import { LibSQLStore } from "@mastra/libsql";

const libsqlStore = new LibSQLStore({
  id: "mastra-storage",
  url: "file:/home/imonikhea/Documents/AI Agent/ai-full/my-aui-app/mastra.db",
});

const storage = libsqlStore;

export { storage, libsqlStore };
