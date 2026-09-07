import { withAui } from "@assistant-ui/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/*", "duckdb", "@duckdb/node-bindings", "@duckdb/node-api"],
};

export default withAui(nextConfig);
