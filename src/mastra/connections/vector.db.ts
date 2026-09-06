import { LibSQLVector } from "@mastra/libsql";

const libsqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: "file:./vector.db",
});

export { libsqlVector };
