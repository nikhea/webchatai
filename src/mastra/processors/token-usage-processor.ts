// src/mastra/processors/token-usage-processor.ts
import type { Processor } from "@mastra/core/processors";
import type { MastraDBMessage } from "@mastra/core/memory";

export class TokenUsageProcessor implements Processor {
  id = "token-usage-processor";

  // Called before the LLM provider request — record the wall-clock start.
  async processLLMRequest({ state }: { state: Record<string, unknown> }) {
    state.requestStartedAt = Date.now();
  }

  async processOutputStream({
    part,
    state,
  }: {
    part: any;
    state: Record<string, unknown>;
  }) {
    // Record when the first text chunk arrives (decode start / TTFT boundary).
    if (part.type === "text-delta" && !state.decodeStartedAt) {
      state.decodeStartedAt = Date.now();

      // Compute TTFT immediately so it's available in processOutputResult.
      const requestStartedAt = state.requestStartedAt as number | undefined;
      if (requestStartedAt && requestStartedAt > 0) {
        state.timeToFirstTokenMs =
          (state.decodeStartedAt as number) - requestStartedAt;
      }
    }
    return part;
  }

  async processOutputResult({
    messages,
    result,
    state,
  }: {
    messages: MastraDBMessage[];
    result: {
      text: string;
      usage?: any;
      finishReason?: string;
      steps?: Array<{ response?: { modelId?: string } }>;
    };
    state: Record<string, unknown>;
  }): Promise<MastraDBMessage[]> {
    const lastStep = result.steps?.[result.steps.length - 1];
    const modelId = lastStep?.response?.modelId ?? null;

    // Calculate tokens per second (decode phase only, excluding TTFT).
    const decodeStartedAt = state.decodeStartedAt as number | undefined;
    const outputTokens = result.usage?.outputTokens ?? 0;
    const reasoningTokens = result.usage?.reasoningTokens ?? 0;
    const stepTokens = outputTokens + reasoningTokens;

    let tokensPerSec: number | null = null;
    if (decodeStartedAt && decodeStartedAt > 0 && stepTokens > 0) {
      const decodeSeconds = Math.max(
        (Date.now() - decodeStartedAt) / 1000,
        0.001,
      );
      tokensPerSec = Math.round(stepTokens / decodeSeconds);
    }

    // Time to first token (ms).
    const timeToFirstTokenMs =
      (state.timeToFirstTokenMs as number | undefined) ?? null;

    // Capture time and date at completion.
    const completedAt = new Date();
    const completedAtISO = completedAt.toISOString();
    const completedAtDate = completedAt.toLocaleDateString();
    const completedAtTime = completedAt.toLocaleTimeString();

    return messages.map((msg) => {
      if (msg.role !== "assistant") return msg;

      const tokenMetaData = {
        ...msg,
        content: {
          ...msg.content,
          metadata: {
            ...msg.content.metadata,
            tokenUsage: {
              inputTokens: result.usage?.inputTokens ?? null,
              outputTokens: result.usage?.outputTokens ?? null,
              totalTokens: result.usage?.totalTokens ?? null,
              reasoningTokens: result.usage?.reasoningTokens ?? null,
            },
            tokensPerSec,
            timeToFirstTokenMs, // <-- new field
            finishReason: result.finishReason ?? null,
            modelId,
            completedAt: completedAtISO,
            completedAtDate,
            completedAtTime,
          },
        },
      };

      console.log({ ...tokenMetaData });

      return tokenMetaData;
    });
  }
}
