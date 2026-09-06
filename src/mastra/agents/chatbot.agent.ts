import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import {
  userProfileWorkingMemorySchema,
  userProfileWorkingMemoryTemplateString,
} from "../shcema/working-memory.shcema";
import { DurableAgent } from "@mastra/core/agent/durable";

import { MAIN_MODEL, TITLE_GENERATION_MODEL } from "../constants/model.constant";
import { PERSONAL_ASSISTANT_INSTRUCTIONS } from "../instructions/chatbot.instruction";
import { askUserTool, submitPlanTool, webFetchTool } from "@mastra/core/tools";
import { weatherTool } from "../tools/weather-tool";
import { TokenUsageProcessor } from "../processors/token-usage-processor";
import { tavilyTools } from "../tools/tavilt-tool";
import { redisCache, redisPubSub } from "../utils/redis"

export const workingMemoryPersonalAssistantAgent = new Agent({
  id: "working-memory-personal-assistant-agent",
  name: "Working Memory Personal Assistant Agent",
  // @ts-ignore - editor overrides handled by MastraEditor, instructions/tools remain code defaults
  instructions: PERSONAL_ASSISTANT_INSTRUCTIONS,
  // @ts-ignore
  editor: {
    instructions: true,
    tools: true,
  },
  model: ({ requestContext }) => {
    const providerId = requestContext.get("providerId") as string | undefined;
    const modelName = requestContext.get("modelName") as string | undefined;
    const byokKeys = (requestContext.get("byokKeys") as Record<string, string> | undefined) || {};
    const byokKey = providerId ? byokKeys[providerId] || byokKeys[providerId.toLowerCase()] : undefined;
    if (byokKey) {
      try {
        const { createOpenAI } = require("@ai-sdk/openai");
        const baseURLs: Record<string, string> = {
          groq: "https://api.groq.com/openai/v1",
          openrouter: "https://openrouter.ai/api/v1",
          cerebras: "https://api.cerebras.ai/v1",
          nvidia: "https://integrate.api.nvidia.com/v1",
          ollama: "https://api.ollama.ai/v1",
        };
        const baseURL = baseURLs[providerId!.toLowerCase()];
        const provider = baseURL ? createOpenAI({ apiKey: byokKey, baseURL }) : createOpenAI({ apiKey: byokKey });
        const modelId = modelName || "gpt-4o-mini";
        return provider(modelId) as any;
      } catch {}
    }
    if (providerId && modelName) return `${providerId}-cloud/${modelName}` as any;
    if (modelName && modelName.includes("/")) return modelName as any;
    return (MAIN_MODEL ?? "openai/gpt-4o-mini") as any;
  },
  memory: new Memory({
    options: {
      lastMessages: 15,
      generateTitle: {
        model: TITLE_GENERATION_MODEL,
      },
      workingMemory: {
        enabled: true,
        useStateSignals: true,
        scope: "resource",
        template: userProfileWorkingMemoryTemplateString,
      },
    },
  }),
  outputProcessors: [new TokenUsageProcessor()],
  // @ts-ignore
  tools: ({ requestContext }: any) => {
    const webSearchEnabled = requestContext.get("webSearchEnabled");
    const tools: Record<string, any> = {};
    if (webSearchEnabled) {
      // tools.web_search = tavilyTools.tavilySearch;
      tools.web_fetch = webFetchTool;
    }
    tools.get_weather = weatherTool;
    return tools;
  },
  // tools: {
  //   ask_user: askUserTool,
  //   submit_plan: submitPlanTool,
  //   get_weather: weatherTool,
  //   web_fetch: webFetchTool,
  // },

  defaultOptions({ requestContext, mastra }) {
    const logger = mastra?.getLogger();
    return {
      maxSteps: 100,
      autoResumeSuspendedTools: true,
      tracingOptions: {
        metadata: { userId: "imonikhea" },
        tags: ["production"],
      },
      modelSettings: {
        reasoning: "low",
      },
      providerOptions: {},
      onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        logger?.info("Agent step finished", {
          agentId: "file-system-agent",
          finishReason,
          toolCalls: toolCalls?.map((tc) => ({ name: tc.from, id: tc.runId })),
          toolResultCount: toolResults?.length ?? 0,
          usage,
        });
      },

      onFinish: async (result) => {
        logger?.info("Agent generation complete", {
          agentId: "file-system-agent",
          finishReason: result.finishReason,
          usage: result.usage,
          steps: result.steps?.length,
          totalUsage: result.totalUsage,
          content: result.content,
        });
      },
      onError: async ({ error }) => {
        logger?.error("Agent generation error", {
          agentId: "file-system-agent",
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      },
      onAbort: async () => {
        logger?.warn("Agent generation aborted", {
          agentId: "file-system-agent",
        });
      },
      onIterationComplete: async (context) => {
        logger?.info("Agent iteration complete", {
          agentId: "file-system-agent",
          iteration: context.iteration,
          isFinal: context.isFinal,
          finishReason: context.finishReason,
          toolCalls: context.toolCalls?.map((tc) => tc.name),
          runId: context.runId,
          threadId: context.threadId,
        });
      },
    };
  },
});

export const durableworkingMemoryPersonalAssistantAgent = new DurableAgent({
  agent: workingMemoryPersonalAssistantAgent,
  maxSteps: 20,
  cleanupTimeoutMs: 5 * 60 * 1000,
  cache: redisCache,
  pubsub: redisPubSub,
});
