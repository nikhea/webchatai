import { MastraClient } from "@mastra/client-js";

export const mastraClient = new MastraClient({
  baseUrl:
    process.env.NEXT_PUBLIC_MASTRA_BASE_URL ??
    process.env.MASTRA_BASE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
});
