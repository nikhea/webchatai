import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { EMBEDDING_MODEL } from "./model.constant";

const openrouterEmbedder = new ModelRouterEmbeddingModel({
  providerId: "openrouter",
  modelId: EMBEDDING_MODEL,
});

export { openrouterEmbedder };
