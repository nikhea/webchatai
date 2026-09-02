"use client";

import {
  type RemoteThreadListAdapter,
  RuntimeAdapterProvider,
  useAui,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import type { QueryClient } from "@tanstack/react-query";
import { useMemo, createElement } from "react";
import {
  createThread,
  listThreads,
  fetchThread,
  renameThread,
  deleteThread,
  archiveThread,
  unarchiveThread,
  pinThread,
  unpinThread,
  AGENT_ID,
  listMessages,
} from "@/lib/mastra/memory-queries";
import { memoryKeys } from "@/app/queries/memory.query";
import { queryPersister } from "@/lib/query-persister";

function toUIMessage(m: any) {
  const raw = m.content ?? m.parts ?? m.text ?? "";
  let text = "";
  if (typeof raw === "string") text = raw;
  else if (typeof m.text === "string") text = m.text;
  else if (Array.isArray(raw)) {
    text = raw
      .filter((p: any) => p?.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text)
      .join("\n");
    if (!text) text = raw.map((p: any) => p?.text ?? "").join("\n");
  } else if (raw?.parts) {
    text = raw.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n");
    if (!text && typeof raw.content === "string") text = raw.content;
  } else if (typeof raw?.text === "string") text = raw.text;
  else if (typeof raw?.content === "string") text = raw.content;

  const r = String(m.role ?? "").toLowerCase();
  const contentMeta =
    (m as any).content?.metadata ??
    (typeof raw === "object" && raw !== null ? (raw as any).metadata : undefined) ??
    {};
  const topMeta = (m as any).metadata ?? {};
  const mergedMeta = { ...contentMeta, ...topMeta };
  const isSignal =
    r === "signal" ||
    (m as any).type === "working-memory" ||
    !!mergedMeta.signal ||
    !!(m as any).metadata?.signal ||
    !!(m as any).content?.metadata?.signal;
  if (isSignal) {
    return {
      id: m.id ?? crypto.randomUUID(),
      role: "assistant" as const,
      parts: text ? [{ type: "text", text }] : [],
      createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      metadata: {
        ...mergedMeta,
        isSignal: true,
        signalType:
          (m as any).type ??
          mergedMeta.signal?.type ??
          (m as any).metadata?.signal?.type ??
          "working-memory",
        originalRole: m.role,
        signal: mergedMeta.signal ?? (m as any).metadata?.signal,
      },
    } as any;
  }
  const role = r === "user" ? "user" : r === "system" ? "system" : "assistant";
  return {
    id: m.id ?? crypto.randomUUID(),
    role,
    parts: text ? [{ type: "text", text }] : [],
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    metadata: mergedMeta,
  } as any;
}

export function createMastraThreadListAdapter(
  queryClient: QueryClient,
  resourceId: string,
  getCurrentThreadId?: () => string | undefined,
): RemoteThreadListAdapter {
  return {
    async list() {
      const key = memoryKeys.threads(resourceId, AGENT_ID);
      const mapRows = (rows: any) => {
        const arr = Array.isArray(rows) ? rows : ((rows as any)?.threads ?? []);
        const mapped = arr.map((t: any) => ({
          remoteId: t.id,
          status: t.metadata?.archived ? "archived" : "regular",
          title: t.title ?? undefined,
          lastMessageAt: t.updatedAt
            ? new Date(t.updatedAt)
            : t.createdAt
              ? new Date(t.createdAt)
              : undefined,
          rawCreatedAt: t.createdAt ? new Date(t.createdAt).getTime() : 0,
          custom: t.metadata?.pinned ? { pinned: true } : undefined,
        }));
        mapped.sort((a: any, b: any) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));
        const seen = new Map<string, (typeof mapped)[number]>();
        const deduped: typeof mapped = [];
        const duplicates: string[] = [];
        for (const th of mapped) {
          const keyTitle = (th.title ?? "").trim().toLowerCase();
          if (!seen.has(keyTitle)) {
            seen.set(keyTitle, th);
            deduped.push(th);
          } else {
            const existing = seen.get(keyTitle)!;
            const isNewer = (th.lastMessageAt?.getTime() ?? th.rawCreatedAt) > (existing.lastMessageAt?.getTime() ?? (existing as any).rawCreatedAt);
            if (isNewer) {
              const idx = deduped.indexOf(existing);
              if (idx !== -1) deduped.splice(idx, 1);
              seen.set(keyTitle, th);
              deduped.push(th);
              duplicates.push(existing.remoteId);
            } else {
              duplicates.push(th.remoteId);
            }
          }
        }
        if (duplicates.length) {
          for (const dupId of duplicates) {
            deleteThread(AGENT_ID, dupId).catch(() => {});
          }
          queryClient.invalidateQueries({ queryKey: key }).catch(() => {});
        }
        return {
          threads: deduped.map(({ rawCreatedAt: _rc, ...rest }: any) => rest),
        };
      };

      const threads = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: () => listThreads(resourceId, AGENT_ID, { perPage: 100 }),
        persister: queryPersister.persisterFn as any,
        gcTime: 24 * 60 * 60 * 1000,
        staleTime: 0,
      } as any);

      return mapRows(threads);
    },

    async initialize(_threadId) {
      const isLocalId = _threadId?.startsWith("__LOCALID_");
      if (isLocalId) {
        const pending = getCurrentThreadId?.();
        const isPendingReal = pending && !pending.startsWith("__LOCALID_");
        if (isPendingReal) {
          try {
            const t = await createThread(resourceId, AGENT_ID, "New Conversation", pending);
            await queryClient.invalidateQueries({
              queryKey: memoryKeys.threads(resourceId, AGENT_ID),
            });
            return { remoteId: t.id };
          } catch {}
          return { remoteId: pending as string };
        }
        return { remoteId: _threadId as string };
      }
      if (!_threadId) {
        const localId = `__LOCALID_${crypto.randomUUID()}`;
        return { remoteId: localId };
      }
      const t = await createThread(
        resourceId,
        AGENT_ID,
        "New Conversation",
        _threadId,
      );
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, AGENT_ID),
      });
      return { remoteId: t.id };
    },

    async rename(remoteId, newTitle) {
      await renameThread(resourceId, AGENT_ID, remoteId, newTitle);
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.thread(remoteId, AGENT_ID),
      });
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, AGENT_ID),
      });
    },

    async archive(remoteId) {
      await archiveThread(resourceId, AGENT_ID, remoteId);
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, AGENT_ID),
      });
    },

    async unarchive(remoteId) {
      await unarchiveThread(resourceId, AGENT_ID, remoteId);
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, AGENT_ID),
      });
    },

    async delete(remoteId) {
      await deleteThread(AGENT_ID, remoteId);
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, AGENT_ID),
      });
      queryClient.removeQueries({
        queryKey: memoryKeys.thread(remoteId, AGENT_ID),
      });
      queryClient.removeQueries({ queryKey: ["memory", "thread", remoteId] });
    },

    async fetch(remoteId) {
      const t = await fetchThread(AGENT_ID, remoteId);
      return {
        remoteId: t.id,
        status: (t as any).metadata?.archived ? "archived" : "regular",
        title: (t as any).title ?? undefined,
        lastMessageAt: (t as any).updatedAt ? new Date((t as any).updatedAt) : undefined,
        custom: (t as any).metadata?.pinned ? { pinned: true } : undefined,
      };
    },

    async updateCustom(remoteId, custom) {
      const pinned = !!(custom as any)?.pinned;
      if (pinned) await pinThread(resourceId, AGENT_ID, remoteId);
      else await unpinThread(resourceId, AGENT_ID, remoteId);
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, AGENT_ID),
      });
      await queryClient.invalidateQueries({
        queryKey: memoryKeys.thread(remoteId, AGENT_ID),
      });
    },

    async generateTitle(remoteId, messages) {
      return createAssistantStream(async (controller) => {
        const firstUserText = (messages.find((m) => m.role === "user") as any)?.content?.[0];
        const text =
          firstUserText && "text" in (firstUserText as any)
            ? (firstUserText as any).text.slice(0, 40)
            : (((messages.find((m) => m.role === "user") as any)?.parts?.[0] as any)?.text?.slice(
                0,
                40,
              ) ?? "New Conversation");
        controller.appendText(text);
        try {
          await renameThread(resourceId, AGENT_ID, remoteId, text);
          await queryClient.invalidateQueries({
            queryKey: memoryKeys.threads(resourceId, AGENT_ID),
          });
        } catch {}
      });
    },

    unstable_Provider({ children }) {
      const aui = useAui();
      const history = useMemo<ThreadHistoryAdapter>(
        () => ({
          async load() {
            return { messages: [] } as any;
          },
          async append() {},
          withFormat: (_fmt) => ({
            async load() {
              const state: any = aui.threadListItem.getState();
              const threadId = state.remoteId ?? state.id;
              if (!threadId || state.status === "new") return { messages: [] } as any;
              try {
                const res: any = await queryClient.fetchQuery({
                  queryKey: memoryKeys.messages(threadId, 0, AGENT_ID, 100),
                  queryFn: () => listMessages(AGENT_ID, threadId, { page: 0, perPage: 100 }),
                  gcTime: 1000 * 60 * 5,
                  staleTime: 0,
                } as any);
                const rows = res?.messages ?? res ?? [];
                const arr = Array.isArray(rows) ? rows : [];
                arr.sort(
                  (a: any, b: any) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                );
                const uiMessages = arr.map(toUIMessage);
                const items = uiMessages.map((msg: any, idx: number) => ({
                  message: msg,
                  parentId: idx === 0 ? null : ((uiMessages[idx - 1] as any).id ?? null),
                }));
                return { messages: items } as any;
              } catch {
                return { messages: [] } as any;
              }
            },
            async append(_item) {
              try {
                await aui.threadListItem.initialize();
              } catch {}
            },
          }),
        }),
        [aui, queryClient],
      );
      return createElement(
        RuntimeAdapterProvider as any,
        { adapters: { history } },
        children,
      ) as any;
    },
  };
}
