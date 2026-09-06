import { handleChatStream, smoothStream, withSseHeartbeat } from "@mastra/ai-sdk";
import { RequestContext, MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/src/mastra";
import { auth } from "@/lib/auth";

function getLatestUserText(messages: any[]): string {
  const lastMessage = [...messages].reverse().find((m: any) => m?.role === "user");
  if (!lastMessage) return "";
  if (typeof (lastMessage as any).content === "string") return (lastMessage as any).content;
  if (Array.isArray((lastMessage as any).content)) {
    return (lastMessage as any).content
      .filter((p: any) => p?.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text)
      .join("\n");
  }
  const parts = (lastMessage as any).parts;
  if (Array.isArray(parts)) {
    const texts = parts
      .filter((p: any) => p?.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text);
    if (texts.length) return texts.join("\n");
    const txt = parts.map((p: any) => p?.text).filter(Boolean).join("\n");
    if (txt) return txt;
  }
  return (lastMessage as any).text ?? "";
}

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const body = await req.json();

  const { modelName, providerId, providerName, webSearchEnabled, config, messages: rawMessages, ...chatParams } = body;

  const requestContext = new RequestContext();
  requestContext.set("modelName", modelName);
  requestContext.set("providerId", providerId);
  requestContext.set("providerName", providerName);
  requestContext.set("webSearchEnabled", webSearchEnabled ?? false);

  const rawCandidates = [
    body.messages,
    (body as any).messages,
    rawMessages,
    (chatParams as any)?.messages,
    (body as any)?.prompt ? [{ role: "user", parts: [{ type: "text", text: (body as any).prompt }] }] : null,
  ];
  let messages: any[] = [];
  for (const cand of rawCandidates) {
    if (Array.isArray(cand) && cand.length) {
      messages = cand;
      break;
    }
  }
  if (!messages.length && typeof (body as any).prompt === "string") {
    messages = [{ role: "user", parts: [{ type: "text", text: (body as any).prompt }] }];
  }

  const prompt = getLatestUserText(messages);
  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: "prompt is required" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const session = await (auth as any).api.getSession({ headers: req.headers as any }).catch(() => null);
  const sessionUid = (session as any)?.user?.id || (session as any)?.data?.user?.id;
  if (sessionUid) requestContext.set(MASTRA_RESOURCE_ID_KEY as any, sessionUid);
  if (sessionUid) {
    try {
      const { db } = await import("@/lib/db");
      const { userProviderKey } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { decrypt } = await import("@/lib/byok/crypto");
      const rows = await (db as any).select().from(userProviderKey).where(eq(userProviderKey.userId, sessionUid));
      const map: Record<string, string> = {};
      for (const r of rows as any[]) {
        try {
          const dec = decrypt(r.encryptedKey);
          map[r.provider] = dec;
          map[r.provider.toLowerCase()] = dec;
        } catch {}
      }
      if (Object.keys(map).length) requestContext.set("byokKeys" as any, map);
    } catch {}
  }
  const runId =
    (body as any).runId ?? ((body as any).messageId ? `${chatId}:${(body as any).messageId}` : `${chatId}:${crypto.randomUUID()}`);
  const resourceId = sessionUid || (chatParams as any)?.memory?.resource || "user-1234";

  const stream = await handleChatStream({
    mastra,
    agentId: "working-memory-personal-assistant-agent",
    version: "v7",
    params: {
      messages,
      memory: { thread: chatId, resource: resourceId },
      requestContext,
    },
    sendReasoning: true,
    sendSources: true,
    experimentalTransform: smoothStream({ delayInMs: 20, chunking: "word" }) as any,
  });

  return withSseHeartbeat(
    createUIMessageStreamResponse({
      stream: stream as any,
      headers: {
        "x-run-id": runId,
        "x-resumable-stream-id": runId,
        "access-control-expose-headers": "x-run-id, x-resumable-stream-id",
      },
    }),
    15000,
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "http://localhost:3000",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD",
      "access-control-allow-headers": "Content-Type, Authorization, x-run-id, x-resumable-stream-id, Accept",
      "access-control-expose-headers": "x-run-id, x-resumable-stream-id",
    },
  });
}
