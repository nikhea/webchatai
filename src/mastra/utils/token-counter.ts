// import { estimateTokenCount } from "tokenx";
// import { mastra } from "../index";

// function toText(content: unknown): string {
//   if (typeof content === "string") return content;
//   try {
//     return JSON.stringify(content);
//   } catch {
//     return String(content);
//   }
// }

// export async function getThreadTotalTokens(threadId: string, resourceId?: string) {
//   const storage = mastra.getStorage();
//   if (!storage) throw new Error("Storage not configured on Mastra instance");
//   const store = (storage as any).getStore?.("memory") ?? storage;

//   let messages: any[] = [];
//   let page = 1;
//   const perPage = 100;

//   while (true) {
//     const res: { messages: any[]; hasMore: boolean } = await store.listMessages({
//       threadId,
//       resourceId,
//       perPage,
//       page,
//     });
//     messages.push(...res.messages);
//     if (!res.hasMore) break;
//     page++;
//   }

//   const tokens = messages.reduce((sum, m) => sum + estimateTokenCount(toText(m.content)), 0);
//   return { threadId, resourceId, total: messages.length, tokens, messages };
// }

// export function getMessageTokens(content: unknown): number {
//   return estimateTokenCount(toText(content));
// }

// export async function getSingleMessageThreadTokens(threadId: string, resourceId?: string) {
//   const result = await getThreadTotalTokens(threadId, resourceId);
//   if (result.total !== 1) console.warn(`Expected 1 message in thread ${threadId}, got ${result.total}`);
//   return { tokens: result.tokens, total: result.total, message: result.messages[0] ?? null, messages: result.messages };
// }

// export async function getRecallWindowTokens(threadId: string, resourceId?: string) {
//   const agent = mastra.getAgent("workingMemoryPersonalAssistantAgent");
//   const memory = await agent.getMemory();
//   if (!memory) throw new Error("Memory not configured on agent");
//   const { usage, total } = await memory.recall({ threadId, resourceId } as any);
//   return { tokens: usage?.tokens ?? 0, total };
// }
