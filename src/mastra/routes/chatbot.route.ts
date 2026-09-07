import {
  handleChatStream,
  smoothStream,
  toAISdkStream,
  withSseHeartbeat,
} from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { durableworkingMemoryPersonalAssistantAgent } from "../agents/chatbot.agent";

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

// export const titleSseRoute = registerApiRoute(
//   "/custom/resumable-chat/:chatId/title",
//   {
//     method: "GET",
//     handler: async (c) => {
//       const { chatId } = c.req.param();
//       const mastra = c.get("mastra");
//       return new Response(
//         new ReadableStream({
//           start(controller) {
//             const unsubscribe = mastra.pubsub.subscribe(
//               `thread.title.${chatId}`,
//               (event) => {
//                 controller.enqueue(`data: ${JSON.stringify(event.data)}\n\n`);
//               },
//             );
//             (controller as any)._unsubscribe = unsubscribe;
//           },
//           cancel(controller) {
//             (controller as any)._unsubscribe?.();
//           },
//         }),
//         {
//           headers: SSE_HEADERS,
//         },
//       );
//     },
//   },
// );

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── POST /custom/resumable-chat/:chatId/chat ─────────────────────────────────
// Starts a new durable run and immediately returns the AI SDK UI message stream.
// chatId is used as the runId so the GET /stream route can observe() by the same key.

export const resumableChatPostRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/chat",
  {
    method: "POST",
    cors: {
      origin: ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization", "x-run-id", "x-resumable-stream-id", "Accept"],
      exposeHeaders: ["x-run-id", "x-resumable-stream-id"],
    },
    handler: async (c) => {
      const { chatId } = c.req.param();
      const body = await c.req.json();
      const mastra = c.get("mastra");

      const {
        modelName,
        providerId,
        providerName,
        webSearchEnabled,
        config,
        messages: rawMessages,
        ...chatParams
      } = body;

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
        console.error("[resumable-chat] prompt missing", {
          bodyKeys: Object.keys(body ?? {}),
          hasMessages: Array.isArray(body.messages),
          messagesLen: Array.isArray(body.messages) ? body.messages.length : 0,
          sample: JSON.stringify(body).slice(0, 1000),
        });
        return c.json({ error: "prompt is required" }, 400);
      }

      const runId =
        (body as any).runId ??
        ((body as any).messageId ? `${chatId}:${(body as any).messageId}` : `${chatId}:${crypto.randomUUID()}`);
      const resourceId = (chatParams as any)?.memory?.resource ?? "user-1234";

      const { output } =
        await durableworkingMemoryPersonalAssistantAgent.stream(prompt, {
          runId,
          requestContext,
          memory: {
            thread: chatId,
            resource: resourceId,
            // onTitleGenerated disabled
          },
          experimentalTransform: smoothStream({ delayInMs: 20, chunking: "word" }) as any,
        } as any);

      const aiSdkStream = toAISdkStream(output, { from: "agent" });

      return withSseHeartbeat(
        createUIMessageStreamResponse({
          stream: aiSdkStream as any,
          headers: {
            "x-run-id": runId,
            "x-resumable-stream-id": runId,
            "access-control-expose-headers": "x-run-id, x-resumable-stream-id",
          },
        }),
        15000,
      );
    },
  },
);

// ─── GET /custom/resumable-chat/:chatId/stream ────────────────────────────────
// useChat calls this on mount (resume: true) to reconnect to an in-progress run.
// Returns 204 when no active run exists — that is what useChat expects.
// Returns the AI SDK UI message stream when a run is found.

export const resumableChatStreamRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/stream",
  {
    method: "GET",
    cors: {
      origin: ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization", "x-run-id", "x-resumable-stream-id", "Accept"],
      exposeHeaders: ["x-run-id", "x-resumable-stream-id"],
    },
    handler: async (c) => {
      const chatId = c.req.param("chatId");
      const runId = c.req.query("runId");
      const offset = c.req.query("offset") || "0";

      const parsedOffset = parseInt(offset);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return c.json({ error: "Invalid offset" }, 400);
      }

      const candidates = [runId, chatId].filter(Boolean) as string[];
      if (!runId) {
        console.warn("[resume] no runId, trying chatId", { chatId });
      }

      let observeResult: Awaited<
        ReturnType<typeof durableworkingMemoryPersonalAssistantAgent.observe>
      > | null = null;
      let effectiveRunId: string | undefined = runId ?? chatId;
      let lastErr: unknown = null;
      for (const cid of candidates) {
        try {
          observeResult =
            await durableworkingMemoryPersonalAssistantAgent.observe(cid, {
              offset: parsedOffset,
              idleTimeoutMs: 300_000,
            });
          if (observeResult) {
            effectiveRunId = cid;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }
      if (!observeResult || !effectiveRunId) {
        console.warn("[resume] no active run", { chatId, runId, lastErr: String(lastErr) });
        return new Response(null, { status: 204 });
      }

      const { output } = observeResult;
      const aiSdkStream = toAISdkStream(output, { from: "agent" });

      return withSseHeartbeat(
        createUIMessageStreamResponse({
          stream: aiSdkStream as any,
          headers: {
            "x-run-id": effectiveRunId,
            "x-resumable-stream-id": effectiveRunId,
            "access-control-expose-headers": "x-run-id, x-resumable-stream-id",
          },
        }),
        15000,
      );
    },
  },
);

// ─── POST /custom/resumable-chat/:chatId/stop ─────────────────────────────────
// Explicitly stops a durable run. Since durable agents ignore client disconnects
// by design, this endpoint allows the frontend to explicitly terminate a run.

export const resumableChatStopRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/stop",
  {
    method: "POST",
    cors: {
      origin: ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization", "x-run-id", "x-resumable-stream-id", "Accept"],
      exposeHeaders: ["x-run-id", "x-resumable-stream-id"],
    },
    handler: async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const runId = body.runId;

      if (!runId) {
        return c.json({ error: "runId is required to stop the stream" }, 400);
      }

      try {
        const maybeAbort = (durableworkingMemoryPersonalAssistantAgent as any)
          .abortRunStream as ((id: string) => Promise<boolean> | boolean) | undefined;
        if (maybeAbort) {
          const aborted = await maybeAbort.call(
            durableworkingMemoryPersonalAssistantAgent,
            runId,
          );
          if (aborted) return c.json({ success: true, message: "Stream aborted." });
        }
        const { cleanup } =
          await durableworkingMemoryPersonalAssistantAgent.observe(runId);
        cleanup();
        return c.json({ success: true, message: "Stream stopped." });
      } catch (error) {
        console.error("Failed to stop stream or run not found:", error);
        return c.json({ error: "Run not found or already stopped." }, 404);
      }
    },
  },
);

export const chatbotRoutes = registerApiRoute("/chat/:agentId", {
  method: "POST",
  cors: {
    origin: ["http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization", "x-run-id", "x-resumable-stream-id", "Accept"],
    exposeHeaders: ["x-run-id", "x-resumable-stream-id"],
  },
  handler: async (c) => {
    const mastra = c.get("mastra");
    const agentId = c.req.param("agentId");
    const params = await c.req.json();

    const { modelName, providerId, providerName, webSearchEnabled, config, ...chatParams } =
      params;

    const requestContext = new RequestContext();
    requestContext.set("modelName", modelName);
    requestContext.set("providerId", providerId);
    requestContext.set("providerName", providerName);
    requestContext.set("webSearchEnabled", webSearchEnabled ?? false);

    const stream = await handleChatStream({
      mastra,
      agentId,
      params: {
        ...chatParams,
        requestContext,
      },
      version: "v7",
      sendReasoning: true,
      sendFinish: true,
      sendSources: true,
      sendStart: true,
      experimentalTransform: smoothStream({ delayInMs: 20, chunking: "word" }),
      onError: (error) => {
        console.log({ type: "error", error: JSON.stringify(error) });
        return JSON.stringify(error);
      },
      messageMetadata(options) {
        console.log({ type: "metadata", metadata: options });
      },
    });
    return withSseHeartbeat(createUIMessageStreamResponse({ stream: stream as any }), 15000);
  },
});
