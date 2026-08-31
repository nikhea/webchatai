// hooks/use-hover-prefetch-thread.ts
"use client";

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { memoryKeys } from "@/app/queries/memory.query";
import { listMessages, AGENT_ID } from "@/lib/mastra/memory-queries";

const FRESH_WINDOW_MS = 30_000;

export function useHoverPrefetchThread(threadId: string) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    if (!threadId || threadId.startsWith("__LOCALID_")) return;
    timerRef.current = setTimeout(() => {
      const key = memoryKeys.messages(threadId, 0, AGENT_ID, 100);
      const state = queryClient.getQueryState(key);

      const alreadyFresh =
        state?.status === "success" &&
        Date.now() - (state.dataUpdatedAt ?? 0) < FRESH_WINDOW_MS;
      const inFlight = state?.fetchStatus === "fetching";

      if (!alreadyFresh && !inFlight) {
        queryClient.prefetchQuery({
          queryKey: key,
          queryFn: () =>
            listMessages(AGENT_ID, threadId, { page: 0, perPage: 100 }),
        });
      }
    }, 3000);
  }, [threadId, queryClient]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { onMouseEnter, onMouseLeave };
}
