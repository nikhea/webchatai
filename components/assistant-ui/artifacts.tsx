"use client";

import * as React from "react";
import { z } from "zod";
import {
  unstable_useInteractable,
  unstable_useInteractableVersions,
} from "@assistant-ui/react";
import { FileText, Code2, FileJson, TableIcon, X, History, Maximize2, Globe, FileWarning } from "lucide-react";

export const documentSchema = z.object({
  title: z.string().describe("Display title for the artifact"),
  filename: z.string().describe("Filename with extension, e.g. report.md, app.tsx, data.json, page.html, doc.pdf"),
  content: z.string().describe("Full file content. For pdf, base64 data URL or raw text; for html, full HTML string"),
  language: z.string().optional().describe("Language for syntax highlighting, e.g. markdown, typescript, json, csv, html, pdf"),
});

export type DocumentState = z.infer<typeof documentSchema>;

const emptyDocument: DocumentState = {
  title: "Untitled",
  filename: "untitled.md",
  content: "",
  language: "markdown",
};

function detectLanguage(filename: string, fallback?: string) {
  if (fallback) return fallback;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "md") return "markdown";
  if (ext === "json") return "json";
  if (ext === "tsx" || ext === "ts") return "typescript";
  if (ext === "csv") return "csv";
  if (ext === "py") return "python";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "pdf") return "pdf";
  return "text";
}

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "json") return <FileJson className="size-4" />;
  if (ext === "csv") return <TableIcon className="size-4" />;
  if (ext === "tsx" || ext === "ts" || ext === "js") return <Code2 className="size-4" />;
  if (ext === "html" || ext === "htm") return <Globe className="size-4" />;
  if (ext === "pdf") return <FileWarning className="size-4" />;
  return <FileText className="size-4" />;
}

const ArtifactContext = React.createContext<{
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
} | null>(null);

export function useArtifactContext() {
  return React.useContext(ArtifactContext);
}

export function ArtifactProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const value = React.useMemo(
    () => ({ openId, open: setOpenId, close: () => setOpenId(null) }),
    [openId],
  );
  return <ArtifactContext.Provider value={value}>{children}</ArtifactContext.Provider>;
}

export function ArtifactButton({
  id,
  state,
  version,
  streaming,
}: {
  id: string;
  state: DocumentState;
  version?: { state: DocumentState; isLatest: boolean; restore: () => void };
  streaming?: boolean;
}) {
  const ctx = useArtifactContext();
  const safeState = state ?? { title: "Untitled", filename: "untitled.md", content: "", language: "markdown" };
  const displayRaw = version && !version.isLatest ? version.state : safeState;
  const display = {
    title: toStringContent((displayRaw as any).title),
    filename: toStringContent((displayRaw as any).filename),
    content: toStringContent((displayRaw as any).content),
    language: (displayRaw as any).language ? toStringContent((displayRaw as any).language) : undefined,
  } as DocumentState;
  const lang = detectLanguage(display.filename, display.language);
  const preview = display.content.slice(0, 220);

  return (
    <div className="my-2 w-full rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon filename={display.filename} />
          <span className="truncate text-sm font-medium">{display.title}</span>
          <span className="truncate text-xs text-muted-foreground">{display.filename}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{lang}</span>
          {streaming && <span className="text-xs text-muted-foreground animate-pulse">streaming…</span>}
          {version && !version.isLatest && <span className="text-xs text-amber-600">version snapshot</span>}
        </div>
        <div className="flex items-center gap-1">
          {version && !version.isLatest && (
            <button
              onClick={version.restore}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
            >
              <History className="size-3" /> Restore
            </button>
          )}
          <button
            onClick={() => ctx?.open(id)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:bg-primary/90"
          >
            <Maximize2 className="size-3" /> Open
          </button>
        </div>
      </div>
      <pre className="max-h-[160px] overflow-auto whitespace-pre-wrap break-words p-3 text-xs leading-4 bg-muted/30">
        {preview}
        {display.content.length > 220 && "…"}
      </pre>
    </div>
  );
}

export function ArtifactPanel({ id }: { id: string }) {
  const [state, { setState }] = unstable_useInteractable("document", {
    id,
    description: "A document artifact the user can open and edit. Shared between inline button and side panel.",
    stateSchema: documentSchema,
    initialState: emptyDocument,
  });
  const versions = unstable_useInteractableVersions<DocumentState>(id, "document");
  const ctx = useArtifactContext();
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => setEditing(false), [id]);

  const lang = detectLanguage(state.filename, state.language);

  return (
    <aside className="flex h-full w-full flex-col border-l bg-background">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon filename={state.filename} />
          <input
            value={state.title}
            onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))}
            className="max-w-[14rem] truncate bg-transparent text-sm font-semibold outline-none focus:underline"
          />
          <span className="hidden sm:inline truncate text-xs text-muted-foreground">{state.filename}</span>
        </div>
        <div className="flex items-center gap-1">
          {versions.length > 1 && (
            <select
              onChange={(e) => versions[+e.target.value]?.restore()}
              defaultValue=""
              className="rounded-md border bg-background px-1.5 py-1 text-xs"
            >
              <option value="" disabled>
                History ({versions.length})
              </option>
              {versions.map((v, i) => (
                <option key={i} value={i}>
                  v{i + 1}: {v.origin === "user-edit" ? "you" : v.origin === "update" ? "assistant" : "create"}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
          >
            {editing ? "Preview" : "Edit"}
          </button>
          <button onClick={() => ctx?.close()} className="grid size-7 place-items-center rounded-md hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-1.5 text-xs">
        <label className="text-muted-foreground">File</label>
        <input
          value={state.filename}
          onChange={(e) => {
            const filename = e.target.value;
            setState((p) => ({ ...p, filename, language: detectLanguage(filename, p.language) }));
          }}
          className="flex-1 rounded border bg-background px-1.5 py-0.5 text-xs"
        />
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">{lang}</span>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {editing ? (
          <textarea
            value={state.content}
            onChange={(e) => setState((p) => ({ ...p, content: e.target.value }))}
            className="h-full min-h-[300px] w-full rounded-md border bg-background p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
            placeholder="File content…"
          />
        ) : lang === "html" ? (
          <HtmlPreview content={state.content} />
        ) : lang === "pdf" ? (
          <PdfPreview content={state.content} filename={state.filename} />
        ) : lang === "markdown" ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6">{state.content || "Empty file"}</pre>
        ) : lang === "csv" ? (
          <CsvPreview content={state.content} />
        ) : lang === "json" ? (
          <JsonPreview content={state.content} />
        ) : (
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-sm">
            {state.content || "Empty file"}
          </pre>
        )}
      </div>

      <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        Shared state · <code>update_document</code> edits this file · versioned · persists with thread history
      </div>
    </aside>
  );
}

function CsvPreview({ content }: { content: string }) {
  const rows = React.useMemo(() => {
    const lines = content.trim().split("\n");
    return lines.map((l) => l.split(","));
  }, [content]);
  if (!content.trim()) return <div className="text-sm text-muted-foreground">Empty CSV</div>;
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {rows[0]?.map((c, i) => (
              <th key={i} className="px-2 py-1 text-left font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-1">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonPreview({ content }: { content: string }) {
  try {
    const obj = JSON.parse(content);
    return <pre className="rounded-md bg-muted p-3 font-mono text-sm">{JSON.stringify(obj, null, 2)}</pre>;
  } catch {
    return <pre className="rounded-md bg-destructive/10 p-3 font-mono text-sm text-destructive">{content}</pre>;
  }
}

function HtmlPreview({ content }: { content: string }) {
  if (!content.trim()) return <div className="text-sm text-muted-foreground">Empty HTML</div>;
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-md border bg-white">
        <iframe
          srcDoc={content}
          sandbox="allow-scripts allow-same-origin"
          className="h-[420px] w-full"
          title="HTML preview"
        />
      </div>
      <details className="rounded-md bg-muted p-2">
        <summary className="cursor-pointer text-xs font-medium">Source</summary>
        <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs">{content}</pre>
      </details>
    </div>
  );
}

function PdfPreview({ content, filename }: { content: string; filename: string }) {
  const src = React.useMemo(() => {
    const c = content.trim();
    if (!c) return null;
    if (c.startsWith("data:application/pdf")) return c;
    if (c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    if (c.startsWith("%PDF")) return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(c)))}`;
    if (/^[A-Za-z0-9+/=\s]+$/.test(c.slice(0, 100)) && c.length > 200) {
      const maybeB64 = c.replace(/\s/g, "");
      if (maybeB64.startsWith("JVBER")) return `data:application/pdf;base64,${maybeB64}`;
    }
    return null;
  }, [content]);

  if (!content.trim()) return <div className="text-sm text-muted-foreground">Empty PDF</div>;

  if (src) {
    return (
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-md border bg-white">
          <iframe src={src} className="h-[520px] w-full" title={`PDF ${filename}`} />
        </div>
        <a href={src} download={filename} className="inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent">
          Download {filename}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md border bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
        PDF content is raw text/markdown. For rendered PDF, provide a data URL, https URL, or base64 PDF string.
      </div>
      <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-sm">{content}</pre>
      <button
        onClick={() => {
          const blob = new Blob([content], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="inline-flex w-fit rounded-md border px-2 py-1 text-xs hover:bg-accent"
      >
        Download {filename}
      </button>
    </div>
  );
}

export function ArtifactShell({ children }: { children: React.ReactNode }) {
  const ctx = useArtifactContext();
  const openId = ctx?.openId;
  if (!openId) return <>{children}</>;
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
      <div className="w-[480px] max-w-[50vw] shrink-0 overflow-hidden max-lg:hidden">
        <ArtifactPanel id={openId} />
      </div>
      <div className="fixed inset-0 z-50 bg-background lg:hidden">
        <ArtifactPanel id={openId} />
      </div>
    </div>
  );
}

function toStringContent(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((c) => (typeof c === "string" ? c : JSON.stringify(c, null, 2))).join("\n");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function BackendDocumentArtifact({ args, toolCallId, status }: { args: any; toolCallId: string; status?: any }) {
  const a: any = args ?? {};
  const rawContent = toStringContent(a.content);
  const state: DocumentState = {
    title: toStringContent(a.title) || toStringContent(a.filename) || "Document",
    filename: toStringContent(a.filename) || "file.md",
    content: rawContent,
    language: a.language ? toStringContent(a.language) : detectLanguage(toStringContent(a.filename) || "file.md", undefined),
  };
  const streaming = status?.type === "running";
  return <ArtifactButton id={toolCallId} state={state as any} streaming={streaming} />;
}
