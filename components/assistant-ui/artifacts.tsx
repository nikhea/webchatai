"use client";

import * as React from "react";
import { z } from "zod";
import {
  unstable_useInteractable,
  unstable_useInteractableVersions,
} from "@assistant-ui/react";
import { FileText, Code2, FileJson, TableIcon, X, History, Maximize2, Globe, FileWarning, ChevronDown, Minimize2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
  toggle: (id: string) => void;
} | null>(null);

export function useArtifactContext() {
  return React.useContext(ArtifactContext);
}

export function ArtifactProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const value = React.useMemo(
    () => ({
      openId,
      open: (id: string) => setOpenId(id),
      close: () => setOpenId(null),
      toggle: (id: string) => setOpenId((prev) => (prev === id ? null : id)),
    }),
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
  const isOpen = ctx?.openId === id;
  const [expanded, setExpanded] = React.useState(false);
  const preview = display.content.slice(0, 220);

  return (
    <Card className="my-2 w-full gap-0 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileIcon filename={display.filename} />
          <span className="truncate text-sm font-medium">{display.title}</span>
          <span className="truncate text-xs text-muted-foreground">{display.filename}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{lang}</span>
          {streaming && <span className="animate-pulse text-xs text-muted-foreground">streaming…</span>}
          {version && !version.isLatest && <span className="text-xs text-amber-600">version snapshot</span>}
          {isOpen && <span className="text-xs text-emerald-600">open</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {version && !version.isLatest && (
            <Button variant="outline" size="xs" onClick={version.restore}>
              <History className="size-3" /> Restore
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
          >
            <ChevronDown className={cn("size-3 transition-transform duration-200", expanded && "rotate-180")} />
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button variant={isOpen ? "secondary" : "default"} size="xs" onClick={() => ctx?.toggle(id)}>
            {isOpen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            {isOpen ? "Close" : "Open"}
          </Button>
        </div>
      </CardHeader>
      <div className="overflow-hidden transition-all duration-300 ease-in-out">
        <CardContent className="px-3 py-2">
          {lang === "html" ? (
            <HtmlPreview content={display.content} compact={!expanded} />
          ) : lang === "pdf" ? (
            <PdfPreview content={display.content} filename={display.filename} compact={!expanded} />
          ) : lang === "csv" ? (
            <CsvPreview content={display.content} />
          ) : lang === "json" ? (
            <JsonPreview content={display.content} />
          ) : (
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expanded ? "max-h-[500px]" : "max-h-[160px]",
              )}
            >
              <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/30 p-3 font-mono text-xs leading-4">
                {expanded ? display.content : preview}
                {!expanded && display.content.length > 220 && "…"}
              </pre>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
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
  React.useEffect(() => {
    if (!state.content || state.content === emptyDocument.content) return;
    const t = setTimeout(() => {
      try {
        const threadId = window.location.pathname.match(/\/chat\/(.+)/)?.[1] ?? "unknown";
        fetch("/api/artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            toolCallId: id,
            title: state.title,
            filename: state.filename,
            content: state.content,
            language: state.language,
          }),
        }).catch(() => {});
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [id, state.title, state.filename, state.content, state.language]);

  const lang = detectLanguage(state.filename, state.language);

  return (
    <aside className="flex h-full w-full animate-in flex-col bg-background slide-in-from-right-8 duration-300 fade-in">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileIcon filename={state.filename} />
          <Input
            value={state.title}
            onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))}
            className="h-7 max-w-[14rem] border-0 bg-transparent px-1 text-sm font-semibold shadow-none focus-visible:ring-1"
          />
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">{state.filename}</span>
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
          <Button variant="outline" size="xs" onClick={() => setEditing((v) => !v)}>
            {editing ? "Preview" : "Edit"}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => ctx?.close()} title="Close panel">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-1.5 text-xs">
        <label className="text-muted-foreground">File</label>
        <Input
          value={state.filename}
          onChange={(e) => {
            const filename = e.target.value;
            setState((p) => ({ ...p, filename, language: detectLanguage(filename, p.language) }));
          }}
          className="h-6 flex-1 text-xs"
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

      <Separator />
      <div className="px-3 py-2 text-[11px] text-muted-foreground">
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

function HtmlPreview({ content, compact }: { content: string; compact?: boolean }) {
  if (!content.trim()) return <div className="text-sm text-muted-foreground">Empty HTML</div>;
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-md border bg-white">
        <iframe
          srcDoc={content}
          sandbox="allow-scripts allow-same-origin"
          className={cn("w-full transition-all duration-300", compact ? "h-[200px]" : "h-[420px]")}
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

function PdfPreview({ content, filename, compact }: { content: string; filename: string; compact?: boolean }) {
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
          <iframe src={src} className={cn("w-full transition-all duration-300", compact ? "h-[200px]" : "h-[520px]")} title={`PDF ${filename}`} />
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
      <Button
        variant="outline"
        size="xs"
        className="w-fit"
        onClick={() => {
          const blob = new Blob([content], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        Download {filename}
      </Button>
    </div>
  );
}

export function ArtifactShell({ children }: { children: React.ReactNode }) {
  const ctx = useArtifactContext();
  const openId = ctx?.openId ?? null;
  const [lastId, setLastId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (openId) setLastId(openId);
  }, [openId]);
  const visible = !!openId;
  const panelId = openId ?? lastId;
  const [width, setWidth] = React.useState(480);
  const dragging = React.useRef(false);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? Number(localStorage.getItem("artifact-width") ?? 480) : 480;
    if (saved >= 320 && saved <= 800) setWidth(saved);
  }, []);

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
      const dx = startX - ev.clientX;
      const next = Math.min(800, Math.max(320, startW + dx));
      setWidth(next);
    };
    const onUp = () => {
      dragging.current = false;
      localStorage.setItem("artifact-width", String(width));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setWidth((w) => {
        localStorage.setItem("artifact-width", String(w));
        return w;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [width]);

  React.useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
    };
    return () => {};
  }, []);

  return (
    <div className="flex h-full w-full">
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      <div
        className={cn(
          "relative hidden shrink-0 overflow-hidden border-l transition-all duration-300 ease-in-out lg:flex",
          visible ? "translate-x-0 opacity-100" : "w-0 translate-x-8 border-0 opacity-0",
        )}
        style={visible ? { width } : { width: 0 }}
      >
        <div
          onPointerDown={onPointerDown}
          className="absolute left-0 top-0 z-10 flex h-full w-2 cursor-col-resize touch-none items-center justify-center bg-transparent hover:bg-primary/10 active:bg-primary/20"
          title="Drag to resize"
        >
          <GripVertical className="size-3 text-muted-foreground/60" />
        </div>
        <div className="h-full w-full pl-2" style={{ width }}>
          {panelId && <ArtifactPanel id={panelId} />}
        </div>
      </div>
      <div
        className={cn(
          "fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => ctx?.close()}
      >
        <div
          className={cn(
            "relative flex h-full w-[92%] max-w-[480px] flex-col bg-background shadow-xl transition-transform duration-300 ease-in-out",
            visible ? "translate-x-0" : "translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onPointerDown={(e) => {
              const startX = e.clientX;
              const el = e.currentTarget.parentElement as HTMLElement | null;
              const startW = el?.getBoundingClientRect().width ?? 480;
              const onMove = (ev: PointerEvent) => {
                const dx = startX - ev.clientX;
                const viewport = window.innerWidth;
                const next = Math.min(viewport * 0.92, Math.max(320, startW + dx));
                if (el) el.style.width = `${next}px`;
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
            className="absolute left-0 top-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center"
          >
            <GripVertical className="size-3 text-muted-foreground/60" />
          </div>
          {panelId && <ArtifactPanel id={panelId} />}
        </div>
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
  React.useEffect(() => {
    if (streaming || !toolCallId || !state.content) return;
    try {
      const threadId = window.location.pathname.match(/\/chat\/(.+)/)?.[1] ?? "unknown";
      fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          toolCallId,
          title: state.title,
          filename: state.filename,
          content: state.content,
          language: state.language,
        }),
      }).catch(() => {});
    } catch {}
  }, [toolCallId, state.title, state.filename, state.content, state.language, streaming]);
  return <ArtifactButton id={toolCallId} state={state as any} streaming={streaming} />;
}
