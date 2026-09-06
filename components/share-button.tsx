"use client";
import { useState } from "react";
import { Share2, Copy, Check, Trash2, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuiState } from "@assistant-ui/react";

export function ShareButton() {
  const threadId = useAuiState((s: any) => s.threads.mainThreadId || s.thread?.id || (s as any).message?.threadId) as string | undefined;
  const messages = useAuiState((s: any) => s.thread.messages) as any[];
  const threadTitle = useAuiState((s: any) => (s.thread as any)?.title || (s.threads as any)?.currentThreadTitle || "") as string;
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentThreadId = threadId || "local-" + Date.now();
  const hasMessages = Array.isArray(messages) && messages.length > 0;

  const create = async () => {
    if (!hasMessages) {
      setError("Send a message first to create a shareable snapshot");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        parts: m.parts,
        content: (m as any).content,
        createdAt: (m as any).createdAt,
        metadata: (m as any).metadata,
      }));
      const title = threadTitle || (snapshot.find((m: any) => m.role === "user")?.parts?.find((p: any) => p.type === "text")?.text?.slice(0, 60) as string) || "Shared chat";
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: currentThreadId, isPublic, title, snapshot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setToken(data.token);
      const fullUrl = `${window.location.origin}${data.url}`;
      setUrl(fullUrl);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const update = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const snapshot = messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        parts: m.parts,
        content: (m as any).content,
        createdAt: (m as any).createdAt,
        metadata: (m as any).metadata,
      }));
      const res = await fetch(`/api/share/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const unshare = async () => {
    if (!token) return;
    if (!confirm("Unshare and revoke link?")) return;
    await fetch(`/api/share/${token}`, { method: "DELETE" });
    setToken(null);
    setUrl(null);
  };

  const togglePublic = async () => {
    if (!token) return;
    const next = !isPublic;
    setIsPublic(next);
    await fetch(`/api/share/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Share2 className="size-4" />
        Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[520px] bg-[#0b080b] border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Share conversation</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Snapshot link — anyone with link can view. Messages after sharing are private unless you update.
          </DialogDescription>
        </DialogHeader>
        {!hasMessages ? (
          <p className="text-sm text-amber-400">Send a message first to create a snapshot.</p>
        ) : !token ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm flex-1">Public link</label>
              <button
                onClick={() => setIsPublic((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${isPublic ? "bg-zinc-700" : "bg-zinc-800"}`}
              >
                <span className={`inline-block size-5 rounded-full bg-white transition ${isPublic ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
            <p className="text-xs text-zinc-500">{isPublic ? "Anyone with link can view" : "Only you (private) - will require auth"}</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={create} disabled={loading} className="w-full bg-pink-700 hover:bg-pink-600">
              {loading ? "Creating..." : "Create link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={url || ""} readOnly className="flex-1 bg-zinc-900 font-mono text-xs" />
              <Button onClick={copy} variant="outline" className="shrink-0 gap-1.5 border-zinc-800">
                {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={update} disabled={loading} className="gap-1.5 border-zinc-800">
                <RefreshCw className="size-3.5" /> Update snapshot
              </Button>
              <Button variant="outline" size="sm" onClick={togglePublic} className="gap-1.5 border-zinc-800">
                <Eye className="size-3.5" /> {isPublic ? "Make private" : "Make public"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={unshare}
                className="gap-1.5 border-zinc-800 text-red-400 hover:bg-red-950/30"
              >
                <Trash2 className="size-3.5" /> Unshare
              </Button>
            </div>
            <a href={url || "#"} target="_blank" className="text-xs text-pink-400 hover:underline block truncate">
              {url}
            </a>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}
        <p className="text-xs text-zinc-500">
          Manage all shared chats at <a href="/settings/history" className="underline">History</a> or via Swagger{" "}
          <a href="/api/auth/reference" target="_blank" className="underline">
            /api/auth/reference
          </a>
          . Files/MCP raw data are not shared.
        </p>
      </DialogContent>
    </Dialog>
    </>
  );
}
