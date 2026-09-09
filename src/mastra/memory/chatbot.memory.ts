import { Memory,  } from "@mastra/memory";
import { OBSERVATIONAL_MEMORY_MODEL, TITLE_GENERATION_MODEL } from "../constants/model.constant";
import { libsqlStore } from "../connections/storage.db";
import { libsqlVector } from "../connections/vector.db";
import { openrouterEmbedder } from "../constants/embedding.model";
import { userProfileWorkingMemoryTemplateString } from "../shcema/working-memory.shcema";


// new Memory({
//   options: {
//     lastMessages: 15,
//     generateTitle: {
//       model: TITLE_GENERATION_MODEL,
//     },
//     workingMemory: {
//       enabled: true,
//       useStateSignals: true,
//       scope: "resource",
//       template: userProfileWorkingMemoryTemplateString,
//     },
//   },
// })

export const chatBotMemory = new Memory({
    storage: libsqlStore,
    vector: libsqlVector,
    embedder: openrouterEmbedder,
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
      observationalMemory: {
        model: OBSERVATIONAL_MEMORY_MODEL,
        scope: "thread",

        temporalMarkers: true,
        activateOnProviderChange: true,
        enabled: true,
        retrieval: {
          vector: true,
          scope: "resource",
        },
        observation: {
          bufferOnIdle: true,
          manageWorkingMemory: true
          // messageTokens: 32000,
        },
        reflection: {
          // observationTokens: 4000,
          activateAfterIdle: "10m",

        },
      },
    },
  })
