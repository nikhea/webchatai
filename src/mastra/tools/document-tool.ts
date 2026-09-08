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
    "Create a file artifact that displays in the UI. Use this INSTEAD of a markdown code block whenever you show file contents, code, HTML, or PDF. Each call creates one artifact panel. The UI will render it with proper viewers (HTML iframe, PDF viewer, code, CSV table, JSON). Always use this for: report.md, sample.html, sample.pdf, data.json, app.tsx, tasks.csv, helloworld.html or any file display request. Provide title, filename, content, and language.",
  inputSchema: documentSchema,
  outputSchema: z.object({ success: z.boolean() }),
  execute: async (inputData, ctx: any) => {
    const data: any = inputData as any;
    let content = data.content;
    if (Array.isArray(content)) {
      content = content.map((c: any) => (typeof c === "string" ? c : JSON.stringify(c))).join("\n");
    } else if (content && typeof content === "object") {
      try {
        content = JSON.stringify(content, null, 2);
      } catch {
        content = String(content);
      }
    } else if (content != null) {
      content = String(content);
    }
    if ((!content || !String(content).trim()) && data.filename) {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const full = path.join(process.cwd(), "workspace", data.filename);
        content = await fs.readFile(full, "utf-8").catch(() => "");
        if (!content) {
          const alt = path.join(process.cwd(), data.filename);
          content = await fs.readFile(alt, "utf-8").catch(() => "");
        }
      } catch {}
    }
    try {
      const threadId =
        (ctx as any)?.threadId ??
        (ctx as any)?.memory?.thread ??
        (ctx as any)?.requestContext?.get?.("threadId") ??
        (inputData as any)?.threadId ??
        "unknown";
      const toolCallId =
        (ctx as any)?.toolCallId ??
        (ctx as any)?.toolCall?.id ??
        (inputData as any)?.toolCallId ??
        `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const { upsertArtifact } = await import("@/lib/db/artifact");
      const { auth } = await import("@/lib/auth");
      let userId: string | null = null;
      try {
        const req: any = (ctx as any)?.requestContext;
        userId = req?.get?.("userId") ?? null;
      } catch {}
      await upsertArtifact({
        threadId: String(threadId),
        toolCallId: String(toolCallId),
        userId,
        title: String(data.title ?? data.filename ?? "Document"),
        filename: String(data.filename ?? "file.md"),
        content: String(content ?? ""),
        language: data.language ? String(data.language) : null,
      });
    } catch (e) {
      console.warn("[document] drizzle persist failed", e);
    }
    return { success: true, filename: data.filename, contentLength: String(content ?? "").length };
  },
});
