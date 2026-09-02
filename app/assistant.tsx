"use client";

import {
  AssistantRuntimeProvider,
  AuiConfig,
  Suggestions,
  useRemoteThreadListRuntime,
  WebSpeechDictationAdapter,
} from "@assistant-ui/react";
import { KokoroFastAPIAdapter } from "@/lib/kokoro-fastapi-adapter";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { ThreadSearchDialog } from "@/components/assistant-ui/thread-search-dialog";
import { PanelLeftIcon, SearchIcon, PlusIcon } from "lucide-react";
import { useAui } from "@assistant-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMastraThreadListAdapter } from "./assistant/thread-list-adapter";
import { RESOURCE_ID_KEY } from "@/lib/mastra/memory-queries";
import { attachmentAdapter } from "@/lib/attachment-adapter";

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

  const runtimeHook = useCallback(
    () =>
      useChatRuntime({
        adapters: {
          speech: speechAdapter,
          dictation: dictationAdapter,
          attachments: attachmentAdapter,
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        transport: new AssistantChatTransport({
          api: `${process.env.NEXT_PUBLIC_MASTRA_BASE_URL ?? process.env.MASTRA_BASE_URL ?? "http://localhost:4111"}/chat/working-memory-personal-assistant-agent`,
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
            return {
              memory: {
                thread: tid as string,
                resource: RESOURCE_ID_KEY,
              },
            };
          },
        }),
      }),
    [speechAdapter, dictationAdapter],
  );

  const runtime = useRemoteThreadListRuntime({
    adapter,
    threadId: currentThreadId,
    onThreadIdChange,
    runtimeHook,
  });

  const config = AuiConfig({
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
      <SidebarProvider>
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
    </AssistantRuntimeProvider>
  );
};

function AssistantHeader({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const aui = useAui();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      {isCollapsed ? (
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
