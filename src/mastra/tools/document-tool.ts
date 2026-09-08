import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().describe("Display title for the artifact"),
  filename: z.string().describe("Filename with extension, e.g. report.md, app.tsx, data.json, page.html, doc.pdf"),
  content: z.string().describe("Full file content. For pdf, base64 or raw text; for html, full HTML string"),
  language: z.string().optional().describe("html, pdf, markdown, typescript, json, csv"),
});

export const documentTool = createTool({
  id: "document",
  description:
    "Create a file artifact that displays in the UI. Use this INSTEAD of a markdown code block whenever you show file contents, code, HTML, or PDF. Each call creates one artifact panel. The UI will render it with proper viewers (HTML iframe, PDF viewer, code, CSV table, JSON). Always use this for: report.md, sample.html, sample.pdf, data.json, app.tsx, tasks.csv, or any file display request. Provide title, filename, content, and language.",
  inputSchema: documentSchema,
  outputSchema: z.object({ success: z.boolean() }),
  execute: async (inputData) => {
    return { success: true, filename: (inputData as any).filename };
  },
});
