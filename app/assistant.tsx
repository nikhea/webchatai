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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
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
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2  px-4">
              <SidebarTrigger />
              <div className="ml-auto">
                <ModeToggle />
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
