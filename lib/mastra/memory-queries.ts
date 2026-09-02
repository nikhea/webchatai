import { mastraClient } from "./mastra-client";

export const AGENT_ID = "working-memory-personal-assistant-agent";
// export const RESOURCE_ID_KEY = "working-memory-personal-assistant-agent";

export const RESOURCE_ID_KEY = "user-1234";

/**
 * Create thread
 */
export async function createThread(
  resourceId: string,
  agentId: string,
  title?: string,
  threadId?: string,
) {
  return mastraClient.createMemoryThread({
    resourceId,
    agentId,
    title: title ?? "New Conversation",
    ...(threadId ? { threadId } : {}),
  });
}

/**
 * List all threads for a user/resource
 */
export async function listThreads(
  resourceId: string,
  agentId?: string,
  options?: {
    page?: number;
    perPage?: number;
  },
) {
  return mastraClient.listMemoryThreads({
    resourceId,
    agentId,
    page: options?.page ?? 0,
    perPage: options?.perPage ?? 100,
    orderBy: {
      field: "createdAt",
      direction: "DESC",
    },
  });
}

/**
 * Get thread details
 */
export async function fetchThread(agentId: string, threadId: string) {
  const thread = mastraClient.getMemoryThread({
    threadId,
    agentId,
  });

  return thread.get();
}

/**
 * Update thread title / metadata
 */
export async function renameThread(
  resourceId: string,
  agentId: string,
  threadId: string,
  title: string,
  metadata?: Record<string, unknown>,
) {
  const thread = mastraClient.getMemoryThread({
    threadId,
    agentId,
  });

  let finalMetadata = metadata;
  if (finalMetadata === undefined) {
    try {
      const current = await fetchThread(agentId, threadId);
      finalMetadata = (current as any).metadata ?? { status: "active" };
    } catch {
      finalMetadata = { status: "active" };
    }
  }

  return thread.update({
    resourceId,
    title,
    metadata: finalMetadata as Record<string, any>,
  });
}

export async function archiveThread(
  resourceId: string,
  agentId: string,
  threadId: string,
) {
  const current = await fetchThread(agentId, threadId);
  const meta = (current as any).metadata ?? {};
  return renameThread(
    resourceId,
    agentId,
    threadId,
    current.title ?? "Untitled",
    {
      ...meta,
      archived: true,
    },
  );
}

export async function unarchiveThread(
  resourceId: string,
  agentId: string,
  threadId: string,
) {
  const current = await fetchThread(agentId, threadId);
  const meta = (current as any).metadata ?? {};
  return renameThread(
    resourceId,
    agentId,
    threadId,
    current.title ?? "Untitled",
    {
      ...meta,
      archived: false,
    },
  );
}

export async function pinThread(
  resourceId: string,
  agentId: string,
  threadId: string,
) {
  const current = await fetchThread(agentId, threadId);
  const meta = (current as any).metadata ?? {};
  return renameThread(
    resourceId,
    agentId,
    threadId,
    current.title ?? "Untitled",
    {
      ...meta,
      pinned: true,
    },
  );
}

export async function unpinThread(
  resourceId: string,
  agentId: string,
  threadId: string,
) {
  const current = await fetchThread(agentId, threadId);
  const meta = (current as any).metadata ?? {};
  return renameThread(
    resourceId,
    agentId,
    threadId,
    current.title ?? "Untitled",
    {
      ...meta,
      pinned: false,
    },
  );
}

export async function togglePinThread(
  resourceId: string,
  agentId: string,
  threadId: string,
) {
  const current = await fetchThread(agentId, threadId);
  const meta = (current as any).metadata ?? {};
  const pinned = !!meta.pinned;
  return renameThread(
    resourceId,
    agentId,
    threadId,
    current.title ?? "Untitled",
    {
      ...meta,
      pinned: !pinned,
    },
  );
}

/**
 * Delete thread
 */
export async function deleteThread(agentId: string, threadId: string) {
  const thread = mastraClient.getMemoryThread({
    threadId,
    agentId,
  });

  return thread.delete();
}

/**
 * Clone thread
 */
export async function cloneThread(
  agentId: string,
  threadId: string,
  options?: {
    newThreadId?: string;
    title?: string;
    messageLimit?: number;
  },
) {
  const thread = mastraClient.getMemoryThread({
    threadId,
    agentId,
  });

  return thread.clone({
    newThreadId: options?.newThreadId,
    title: options?.title,
    options: {
      messageLimit: options?.messageLimit,
    },
  });
}

export async function branchThreadAtMessage(
  agentId: string,
  threadId: string,
  messageId: string,
) {
  const original = await fetchThread(agentId, threadId);
  const baseTitle = (original as unknown as { title?: string }).title ?? "New Conversation";
  const cloneTitle = baseTitle.endsWith(" (clone)") ? baseTitle : `${baseTitle} (clone)`;

  const { thread: clonedThread } = await cloneThread(agentId, threadId, {
    title: cloneTitle,
  });

  const newThreadId = (clonedThread as unknown as { id: string }).id;
  try {
    const res: unknown = await listMessages(agentId, newThreadId, { page: 0, perPage: 200 });
    const rows: unknown[] = (res as { messages?: unknown[] })?.messages ?? (Array.isArray(res) ? (res as unknown[]) : []);
    const sorted = [...(rows as { id: string; createdAt?: string | number | Date }[])].sort(
      (a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
    );
    const branchIdx = sorted.findIndex((m) => m.id === messageId);
    if (branchIdx !== -1 && branchIdx < sorted.length - 1) {
      const toDelete = sorted.slice(branchIdx + 1).map((m) => m.id);
      if (toDelete.length) {
        await deleteMessages(agentId, newThreadId, toDelete);
      }
    }
  } catch {}

  return clonedThread;
}

/**
 * List messages in thread
 */
export async function listMessages(
  agentId: string,
  threadId: string,
  options?: {
    page?: number;
    perPage?: number;
  },
) {
  const thread = mastraClient.getMemoryThread({
    threadId,
    agentId,
  });

  const messages = thread.listMessages({
    page: options?.page ?? 0,
    perPage: options?.perPage ?? 100,
  });
  console.log({ tage: "messages", messages });
  return messages;
}

/**
 * Delete messages
 */
export async function deleteMessages(
  agentId: string,
  threadId: string,
  messageIds: string | string[],
) {
  const thread = mastraClient.getMemoryThread({
    threadId,
    agentId,
  });

  return thread.deleteMessages(messageIds);
}

/**
 * Get working memory
 */
export async function getWorkingMemory(
  agentId: string,
  threadId: string,
  resourceId?: string,
) {
  return mastraClient.getWorkingMemory({
    agentId,
    threadId,
    resourceId,
  });
}

/**
 * Update working memory
 */
export async function updateWorkingMemory(
  agentId: string,
  threadId: string,
  workingMemory: string,
  resourceId?: string,
) {
  return mastraClient.updateWorkingMemory({
    agentId,
    threadId,
    resourceId,
    workingMemory,
  });
}

/**
 * Memory health/status
 */
export async function getMemoryStatus(agentId: string) {
  return mastraClient.getMemoryStatus(agentId);
}
