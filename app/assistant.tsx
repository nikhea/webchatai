"use client";

import {
  AssistantRuntimeProvider,
  AuiConfig,
  Suggestions,
  useRemoteThreadListRuntime,
  WebSpeechDictationAdapter,
  defineToolkit,
  Tools,
  type ToolApprovalResponse,
} from "@assistant-ui/react";
import { KokoroFastAPIAdapter } from "@/lib/kokoro-fastapi-adapter";
import {
  useChatRuntime,
  AssistantChatTransport,
  createResumableSessionStorage,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { ThreadSearchDialog } from "@/components/assistant-ui/thread-search-dialog";
import { PanelLeftIcon, SearchIcon, PlusIcon } from "lucide-react";
import { useAui, useAuiState } from "@assistant-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMastraThreadListAdapter } from "./assistant/thread-list-adapter";
import { RESOURCE_ID_KEY, AGENT_ID, deleteThread } from "@/lib/mastra/memory-queries";
import { attachmentAdapter } from "@/lib/attachment-adapter";
import { HotkeysProvider, useHotkey } from "@tanstack/react-hotkeys";
import { useComposerStore } from "@/lib/composer-state";
import { useHotkeysStore, keysToHotkey } from "@/lib/hotkeys-store";

export const Assistant = ({
  threadId: initialThreadId,
}: {
  threadId?: string;
}) => {
  const normalizedInitialId = initialThreadId?.startsWith("__LOCALID_")
    ? undefined
    : initialThreadId;
  const queryClient = useQueryClient();
  const [currentThreadId, setCurrentThreadId] = useState(normalizedInitialId);
  const [searchOpen, setSearchOpen] = useState(false);
  const currentThreadIdRef = useRef(currentThreadId);

  useEffect(() => {
    setCurrentThreadId(initialThreadId);
  }, [initialThreadId]);

  useEffect(() => {
    currentThreadIdRef.current = currentThreadId;
    const isLocal = currentThreadId?.startsWith("__LOCALID_");
    const expected = !currentThreadId || isLocal ? "/" : `/chat/${currentThreadId}`;
    if (typeof window !== "undefined" && window.location.pathname !== expected) {
      window.history.pushState(null, "", expected);
    }
  }, [currentThreadId]);

  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/^\/chat\/(.+)$/);
      setCurrentThreadId(match?.[1]);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const adapter = useMemo(
    () =>
      createMastraThreadListAdapter(
        queryClient,
        RESOURCE_ID_KEY,
        () => currentThreadIdRef.current,
      ),
    [queryClient],
  );

  const onThreadIdChange = useCallback((newThreadId: string | undefined) => {
    const isLocalId = newThreadId?.startsWith("__LOCALID_");
    setCurrentThreadId(newThreadId);
    const url = !newThreadId || isLocalId ? "/" : `/chat/${newThreadId}`;
    if (typeof window !== "undefined" && window.location.pathname !== url) {
      window.history.pushState(null, "", url);
    }
  }, []);

  const speechAdapter = useMemo(() => {
    const directUrl = process.env.NEXT_PUBLIC_KOKORO_BASE_URL;
    if (directUrl) {
      return new KokoroFastAPIAdapter({ baseUrl: directUrl, voice: "af_sky", speed: 1 });
    }
    return new KokoroFastAPIAdapter({ baseUrl: "", path: "/api/tts", voice: "af_sky", speed: 1 });
  }, []);

  const dictationAdapter = useMemo(() => new WebSpeechDictationAdapter(), []);

  useEffect(() => {
    if (!WebSpeechDictationAdapter.isSupported()) {
      console.warn("[dictation] Web Speech API not supported");
    }
  }, []);

  useEffect(() => {
    const suppress = (e: any) => {
      const msg = String(e?.message ?? e?.reason?.message ?? e?.reason ?? "");
      if (msg.includes("no resumable stream id")) {
        e.preventDefault?.();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return true;
      }
    };
    window.addEventListener("error", suppress as any);
    window.addEventListener("unhandledrejection", suppress as any);
    return () => {
      window.removeEventListener("error", suppress as any);
      window.removeEventListener("unhandledrejection", suppress as any);
    };
  }, []);

  const runtimeHook = useCallback(
    () => {
      const aui = useAui();
      const durableStorage = createResumableSessionStorage({
        key: () => {
          const tid = currentThreadIdRef.current;
          if (tid && !tid.startsWith("__LOCALID_")) return `aui-resumable:${tid}`;
          try {
            const s: any = aui.threadListItem.getState();
            const fallback = s.remoteId ?? s.id;
            if (fallback && !String(fallback).startsWith("__LOCALID_")) return `aui-resumable:${fallback}`;
            return tid ? `aui-resumable:${tid}` : undefined;
          } catch {
            return tid ? `aui-resumable:${tid}` : undefined;
          }
        },
      });
      const baseUrl =
        process.env.NEXT_PUBLIC_MASTRA_BASE_URL ??
        process.env.MASTRA_BASE_URL ??
        "http://localhost:4111";

      return useChatRuntime({
        adapters: {
          speech: speechAdapter,
          dictation: dictationAdapter,
          attachments: attachmentAdapter,
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
        transport: new AssistantChatTransport({
          api: `${baseUrl}/custom/resumable-chat/placeholder/chat`,
          resumable: {
            storage: durableStorage,
            resumeApi: (streamId) => {
              const tid =
                currentThreadIdRef.current ??
                (aui.threadListItem.getState() as any).remoteId ??
                (aui.threadListItem.getState() as any).id;
              return `${baseUrl}/custom/resumable-chat/${tid}/stream?runId=${streamId}&offset=0`;
            },
          },
          prepareSendMessagesRequest: async (options) => {
            const effectiveId =
              (options.body as any)?.memory?.thread ??
              (options.body as any)?.thread ??
              options.id;
            return {
              api: `${baseUrl}/custom/resumable-chat/${effectiveId}/chat`,
              body: {
                ...(options.body as object),
                messages: (options as any).messages,
                messageId: (options as any).messageId,
                runId: `${effectiveId}:${(options as any).messageId ?? crypto.randomUUID()}`,
              },
            };
          },
          prepareReconnectToStreamRequest: async (options) => {
            const streamId = durableStorage.getStreamId(options.id);
            if (!streamId) throw new Error("no resumable stream id");
            return {
              api: `${baseUrl}/custom/resumable-chat/${options.id}/stream?runId=${streamId}&offset=0`,
              headers: options.headers,
              credentials: options.credentials,
            };
          },
          body: () => {
            let tid = currentThreadIdRef.current;
            const isLocalId = tid?.startsWith("__LOCALID_");
            if (!tid || isLocalId) {
              tid = crypto.randomUUID();
              currentThreadIdRef.current = tid;
              queueMicrotask(() => {
                setCurrentThreadId(tid as string);
                const url = `/chat/${tid}`;
                if (
                  typeof window !== "undefined" &&
                  window.location.pathname !== url
                ) {
                  window.history.replaceState(null, "", url);
                }
              });
            }
            const s = useComposerStore.getState();
            return {
              memory: {
                thread: tid as string,
                resource: RESOURCE_ID_KEY,
              },
              modelName: s.modelName,
              providerId: s.providerId,
              providerName: s.providerName,
              provider: s.providerId,
              webSearchEnabled: s.webSearchEnabled,
            };
          },
        }),
      });
    },
    [speechAdapter, dictationAdapter],
  );

  const runtime = useRemoteThreadListRuntime({
    adapter,
    threadId: currentThreadId,
    onThreadIdChange,
    runtimeHook,
  });

  const toolkit = defineToolkit({
    get_weather: {
      type: "backend",
      render: ({ args, approval, respondToApproval, result }) => {
        const answer = async (response: ToolApprovalResponse) => {
          try {
            await respondToApproval(response);
          } catch (e) {
            console.error(e);
          }
        };
        const isPending = !!approval && approval.approved === undefined && (approval as any).resolution === undefined;
        if (isPending) {
          return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-sm">
                Approve weather lookup for <b>{(args as any)?.location ?? "unknown location"}</b>?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded-md bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
                  onClick={() => void answer({ approved: true })}
                >
                  Approve
                </button>
                <button
                  className="rounded-md border px-3 py-1 text-xs"
                  onClick={() => void answer({ approved: false, reason: "user denied" })}
                >
                  Deny
                </button>
              </div>
            </div>
          );
        }
        if (approval?.approved === false) return <p className="text-sm text-red-600">Denied: {approval.reason ?? "user denied"}</p>;
        if (approval?.approved === true && result === undefined) return <p className="text-sm">Approved, fetching weather…</p>;
        if (result !== undefined) return <p className="text-sm">Weather: {JSON.stringify(result)}</p>;
        return null;
      },
    },
    deploy: {
      type: "backend",
      render: ({ args, approval, respondToApproval, result }) => {
        const answer = async (response: ToolApprovalResponse) => {
          try {
            await respondToApproval(response);
          } catch (e) {
            console.error(e);
          }
        };
        const isPending = !!approval && approval.approved === undefined && (approval as any).resolution === undefined;
        if (isPending) {
          return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm">
                Approve deploy to <b>{(args as any)?.target ?? "unknown"}</b>?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded-md bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
                  onClick={() => void answer({ approved: true })}
                >
                  Approve
                </button>
                <button
                  className="rounded-md border px-3 py-1 text-xs"
                  onClick={() => void answer({ approved: false, reason: "user denied" })}
                >
                  Deny
                </button>
              </div>
            </div>
          );
        }
        if (approval?.approved === false) return <p className="text-sm text-red-600">Deploy denied</p>;
        if (approval?.approved === true && result === undefined) return <p className="text-sm">Approved, deploying…</p>;
        if (result !== undefined) return <p className="text-sm">Deployed {(result as any)?.deployed}</p>;
        return null;
      },
    },
  });

  const config = AuiConfig({
    tools: Tools({ toolkit }),
    suggestions: Suggestions([
      {
        title: "Plan a project",
        label: "with milestones and risks",
        prompt: "Help me plan a small product launch.",
      },
      {
        title: "Explain a concept",
        label: "in plain language",
        prompt: "Explain retrieval-augmented generation simply.",
      },
      {
        title: "who are you",
        label: "in plain language",
        prompt: "Explain what you can do",
      },
    ]),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime} config={config}>
      <HotkeysProvider>
        <SidebarProvider>
          <AssistantHotkeys
            onSearchOpen={() => setSearchOpen(true)}
            currentThreadId={currentThreadId}
            currentThreadIdRef={currentThreadIdRef}
            setCurrentThreadId={setCurrentThreadId}
            adapter={adapter}
          />
          <div className="flex h-dvh w-full pr-0.5">
            <ThreadListSidebar onSearchOpen={() => setSearchOpen(true)} />
            <SidebarInset className="relative">
              <AssistantHeader onSearchOpen={() => setSearchOpen(true)} />
              <div className="flex-1 overflow-hidden">
                <Thread />
              </div>
              <ThreadSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </HotkeysProvider>
    </AssistantRuntimeProvider>
  );
};

function AssistantHotkeys({
  onSearchOpen,
  currentThreadId,
  currentThreadIdRef,
  setCurrentThreadId,
  adapter,
}: {
  onSearchOpen: () => void;
  currentThreadId: string | undefined;
  currentThreadIdRef: React.MutableRefObject<string | undefined>;
  setCurrentThreadId: (id: string | undefined) => void;
  adapter: ReturnType<typeof createMastraThreadListAdapter>;
}) {
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const aui = useAui();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [currentThreadId, isMobile, setOpenMobile]);
  const threadIds = useAuiState((s) => (s as unknown as { threads: { threadIds: string[] } }).threads.threadIds ?? []);
  const getCurrentId = () => currentThreadIdRef.current ?? currentThreadId;

  const switchTo = (id: string) => {
    try {
      (aui as unknown as { threads: { switchToThread: (id: string) => void } }).threads.switchToThread(id);
    } catch {}
    window.history.pushState(null, "", `/chat/${id}`);
    setCurrentThreadId(id);
    currentThreadIdRef.current = id;
  };

  const newChat = () => {
    try {
      (aui as unknown as { threads: { switchToNewThread: () => void } }).threads.switchToNewThread();
    } catch {}
    window.history.pushState(null, "", "/");
    setCurrentThreadId(undefined);
    currentThreadIdRef.current = undefined;
  };

  const deleteCurrent = async () => {
    const tid = getCurrentId();
    if (!tid) return newChat();
    if (tid.startsWith("__LOCALID_")) return newChat();
    const targetId = tid;
    try {
      const runId = (() => {
        try {
          return window.sessionStorage.getItem(`aui-resumable:${targetId}`);
        } catch {
          return null;
        }
      })();
      if (runId) {
        const baseUrl =
          process.env.NEXT_PUBLIC_MASTRA_BASE_URL ??
          (process.env as any).MASTRA_BASE_URL ??
          "http://localhost:4111";
        await fetch(`${baseUrl}/custom/resumable-chat/${targetId}/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        }).catch(() => {});
        try {
          window.sessionStorage.removeItem(`aui-resumable:${targetId}`);
        } catch {}
      }
    } catch {}
    newChat();
    try {
      try {
        await (adapter as unknown as { delete: (id: string) => Promise<void> }).delete(targetId);
      } catch {
        await deleteThread(AGENT_ID, targetId);
        const { memoryKeys } = await import("@/app/queries/memory.query");
        const key = memoryKeys.threads(RESOURCE_ID_KEY, AGENT_ID);
        queryClient.setQueryData(key as never, (old: unknown) => {
          const data = old as { threads?: { id: string }[] } | { id: string }[] | undefined;
          if (!data) return old as never;
          if (Array.isArray(data)) return data.filter((t: { id: string }) => t.id !== targetId) as never;
          const arr = (data as { threads?: { id: string }[] }).threads;
          if (Array.isArray(arr)) return { ...data, threads: arr.filter((t) => t.id !== targetId) } as never;
          return old as never;
        });
        queryClient.removeQueries({ queryKey: memoryKeys.thread(targetId, AGENT_ID) });
        queryClient.removeQueries({ queryKey: ["memory", "thread", targetId] as never });
        queryClient.removeQueries({ queryKey: key });
        await queryClient.invalidateQueries({ queryKey: key });
        await queryClient.refetchQueries({ queryKey: key });
      }
    } catch {}
  };

  const goPrev = () => {
    const tid = getCurrentId();
    const idx = threadIds.indexOf(tid ?? "");
    if (idx > 0) switchTo(threadIds[idx - 1]);
    else if (idx === -1 && threadIds.length) switchTo(threadIds[0]);
  };
  const goNext = () => {
    const tid = getCurrentId();
    const idx = threadIds.indexOf(tid ?? "");
    if (idx !== -1 && idx < threadIds.length - 1) switchTo(threadIds[idx + 1]);
    else if (idx === -1 && threadIds.length) switchTo(threadIds[0]);
  };

  const hotkeys = useHotkeysStore((s) => s.hotkeys);
  useHotkey((keysToHotkey(hotkeys.search) || "Control+K") as never, () => onSearchOpen(), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey((keysToHotkey(hotkeys.toggleSidebar) || "Control+B") as never, () => toggleSidebar(), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey((keysToHotkey(hotkeys.openModelPicker) || "Control+/") as never, () => window.dispatchEvent(new CustomEvent("toggle-model-picker")), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey((keysToHotkey(hotkeys.settings) || "Control+,") as never, () => (window.location.href = "/settings"), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey((keysToHotkey(hotkeys.deleteCurrent) || "Control+Shift+Backspace") as never, () => void deleteCurrent(), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey("Control+Shift+Delete" as never, () => void deleteCurrent(), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey((keysToHotkey(hotkeys.newChat) || "Control+Shift+O") as never, () => newChat(), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey("Control+Shift+0" as never, () => newChat(), { preventDefault: true, ignoreInputs: false } as never);
  useHotkey((keysToHotkey(hotkeys.prevThread) || "Control+Alt+ArrowUp") as never, () => goPrev(), { preventDefault: true, ignoreInputs: false });
  useHotkey((keysToHotkey(hotkeys.nextThread) || "Control+Alt+ArrowDown") as never, () => goNext(), { preventDefault: true, ignoreInputs: false });

  return null;
}

function AssistantHeader({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const aui = useAui();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      {isMobile ? (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="grid size-8 place-items-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <PanelLeftIcon className="size-4" />
        </button>
      ) : isCollapsed ? (
        <div className="bg-zinc-900 flex items-center gap-0.5 rounded-lg border border-zinc-800 p-1 shadow-sm">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <PanelLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={onSearchOpen}
            aria-label="Search"
            className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <SearchIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => (aui as unknown as { threads: { switchToNewThread: () => void } }).threads.switchToNewThread()}
            aria-label="New chat"
            className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      ) : null}
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}
