import { LibSQLStore } from "@mastra/libsql";
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from "@mastra/core/storage";

const libsqlStore = new LibSQLStore({
  id: "mastra-storage",
  url: "file:./mastra.db",
});

const storage = new MastraCompositeStore({
  id: "composite-storage",
  default: libsqlStore,
  domains: {
    observability: await new DuckDBStore().getStore("observability"),
  },
});

export { storage, libsqlStore };
