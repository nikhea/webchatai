import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { weatherWorkflow } from "./workflows/weather-workflow";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";
import { storage } from "./connections/storage.db";
import {
  workingMemoryPersonalAssistantAgent,
  durableworkingMemoryPersonalAssistantAgent,
} from "./agents/chatbot.agent";
import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import {
  chatbotRoutes,
  resumableChatPostRoute,
  resumableChatStopRoute,
  resumableChatStreamRoute,
  // titleSseRoute,
} from "./routes/chatbot.route";
import { redisCache, redisPubSub } from "./utils/redis";

export const mastra = new Mastra({
  cache: redisCache,
  pubsub: redisPubSub,
  workflows: { weatherWorkflow },
  agents: {
    workingMemoryPersonalAssistantAgent,
    durableworkingMemoryPersonalAssistantAgent,
  },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,
    translationScorer,
  },
  storage: storage,
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter(), // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
  recovery: { durableAgents: "auto" },
  server: {
    build: {
      apiReqLogs: {
        enabled: true,
        level: "debug", // 'debug' | 'info' | 'warn'
        excludePaths: ["/health", "/ready"], // skip these paths
        includeQueryParams: true, // log query string params
        includeHeaders: true, // log request headers
        redactHeaders: ["x-api-key", "x-secret"], // redact sensitive headers
      },
    },
    middleware: [
      async (c, next) => {
        const start = Date.now();
        console.log(`--> ${c.req.method} ${c.req.url}`);
        await next();
        const duration = Date.now() - start;
        console.log(`<-- ${c.req.method} ${c.req.url} - ${duration}ms`);
      },
      async (c, next) => {
        try {
          const { auth } = await import("@/lib/auth");
          const session = await (auth as any).api
            .getSession({ headers: c.req.raw.headers as any })
            .catch(() => null);
          const uid = (session as any)?.user?.id || (session as any)?.data?.user?.id;
          if (uid) {
            const rc: any = (c as any).get("requestContext");
            if (rc && typeof rc.set === "function") rc.set(MASTRA_RESOURCE_ID_KEY, uid);
          }
        } catch {}
        await next();
      },
    ],
    apiRoutes: [
      chatbotRoutes,
      resumableChatPostRoute,
      resumableChatStreamRoute,
      resumableChatStopRoute,
      // titleSseRoute,
    ],
  },
});
