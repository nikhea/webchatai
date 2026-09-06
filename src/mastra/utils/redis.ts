import { RedisServerCache } from "@mastra/redis";
import { RedisStreamsPubSub } from "@mastra/redis-streams";
import Redis from "ioredis";

// Single shared client/instances — imported by both mastra/index.ts (top-level
// Mastra config) and any DurableAgent that needs to be explicitly wired to the
// same distributed cache/pubsub backend. Do not construct separate instances
// per file: DurableAgent does not document pubsub inheritance from the Mastra
// instance the way it does for cache, so pass these explicitly wherever a
// durable agent is created.

export const redisCache = new RedisServerCache({
  client: new Redis("redis://localhost:6379"),
});

export const redisPubSub = new RedisStreamsPubSub({
  url: "redis://localhost:6379",
});
