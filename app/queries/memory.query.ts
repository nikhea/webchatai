import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
} from "@tanstack/react-query";
import {
  createThread,
  listThreads,
  fetchThread,
  renameThread,
  deleteThread,
  cloneThread,
  listMessages,
  deleteMessages,
  getWorkingMemory,
  updateWorkingMemory,
  getMemoryStatus,
} from "@/lib/mastra/memory-queries";
// import { queryPersister } from "@/lib/query-persister";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const memoryKeys = {
  status: (agentId: string) => ["memory", "status", agentId] as const,
  threads: (resourceId: string, agentId?: string, page?: number, perPage?: number) =>
    ["memory", "threads", resourceId, agentId ?? "", page ?? 0, perPage ?? 10] as const,
  thread: (threadId: string, agentId?: string) =>
    ["memory", "thread", threadId, agentId] as const,
  messages: (
    threadId: string,
    page?: number,
    agentId?: string,
    perPage?: number,
  ) =>
    [
      "memory",
      "thread",
      threadId,
      "messages",
      page ?? 0,
      agentId ?? "",
      perPage ?? 100,
    ] as const,
  workingMemory: (agentId: string, threadId: string, resourceId?: string) =>
    ["memory", "working-memory", agentId, threadId, resourceId] as const,
};

// ─── Memory Status ────────────────────────────────────────────────────────────

export function useMemoryStatus(agentId: string | undefined) {
  return useQuery({
    queryKey: memoryKeys.status(agentId ?? ""),
    queryFn: agentId ? () => getMemoryStatus(agentId) : skipToken,
  });
}

// ─── List Threads ─────────────────────────────────────────────────────────────

export function useThreads(
  resourceId: string,
  agentId?: string,
  options?: { page?: number; perPage?: number },
) {
  const page = options?.page ?? 0;
  const perPage = options?.perPage ?? 10;
  return useQuery({
    queryKey: memoryKeys.threads(resourceId, agentId, page, perPage),
    queryFn: () => listThreads(resourceId, agentId, { page, perPage }),
    enabled: Boolean(resourceId),
    staleTime: 30_000,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

// ─── Fetch Thread ─────────────────────────────────────────────────────────────

export function useThread(
  agentId: string | undefined,
  threadId: string | undefined,
) {
  return useQuery({
    queryKey: memoryKeys.thread(threadId ?? "", agentId),
    queryFn:
      agentId && threadId ? () => fetchThread(agentId, threadId) : skipToken,
    enabled: Boolean(agentId) && Boolean(threadId),
    staleTime: 30_000,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    // persister: queryPersister.persisterFn,
  });
}

// ─── Create Thread ────────────────────────────────────────────────────────────

export function useCreateThread(resourceId: string, agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => createThread(resourceId, agentId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, agentId),
      });
    },
  });
}

// ─── Rename Thread ────────────────────────────────────────────────────────────

export function useRenameThread(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      resourceId,
      title,
    }: {
      threadId: string;
      resourceId: string;
      title: string;
    }) => renameThread(resourceId, agentId, threadId, title),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: memoryKeys.thread(variables.threadId, agentId),
      });
      void queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(variables.resourceId, agentId),
      });
    },
  });
}

// ─── Delete Thread ────────────────────────────────────────────────────────────

export function useDeleteThread(resourceId: string, agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => deleteThread(agentId, threadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, agentId),
      });
    },
  });
}

// ─── Clone Thread ─────────────────────────────────────────────────────────────

export function useCloneThread(resourceId: string, agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      newThreadId,
      title,
      messageLimit,
    }: {
      threadId: string;
      newThreadId?: string;
      title?: string;
      messageLimit?: number;
    }) => cloneThread(agentId, threadId, { newThreadId, title, messageLimit }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: memoryKeys.threads(resourceId, agentId),
      });
    },
  });
}

// ─── List Messages ────────────────────────────────────────────────────────────

export function useMessages(
  agentId: string | undefined,
  threadId: string | undefined,
  options?: { page?: number; perPage?: number },
) {
  const page = options?.page ?? 0;
  const perPage = options?.perPage ?? 100;

  return useQuery({
    queryKey: memoryKeys.messages(threadId ?? "", page, agentId ?? "", perPage),
    queryFn:
      agentId && threadId
        ? () => listMessages(agentId, threadId, { page, perPage })
        : skipToken,
    enabled: Boolean(agentId) && Boolean(threadId),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });
}

// ─── Delete Messages ──────────────────────────────────────────────────────────

export function useDeleteMessages(agentId: string, threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string | string[]) =>
      deleteMessages(agentId, threadId, messageIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["memory", "thread", threadId, "messages"],
      });
    },
  });
}

// ─── Working Memory ───────────────────────────────────────────────────────────

export function useWorkingMemory(
  agentId: string | undefined,
  threadId: string | undefined,
  resourceId?: string,
) {
  return useQuery({
    queryKey: memoryKeys.workingMemory(
      agentId ?? "",
      threadId ?? "",
      resourceId,
    ),
    queryFn:
      agentId && threadId
        ? () => getWorkingMemory(agentId, threadId, resourceId)
        : skipToken,
    enabled: Boolean(agentId) && Boolean(threadId),
    refetchOnWindowFocus: false,
  });
}

// ─── Update Working Memory ────────────────────────────────────────────────────

export function useUpdateWorkingMemory(
  agentId: string,
  threadId: string,
  resourceId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workingMemory: string) =>
      updateWorkingMemory(agentId, threadId, workingMemory, resourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: memoryKeys.workingMemory(agentId, threadId, resourceId),
      });
    },
  });
}
