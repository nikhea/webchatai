"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Eye, EyeOff, Trash2, Plus, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_PROVIDERS } from "@/lib/byok/crypto";

type KeyRow = { provider: string; label?: string; keyHint: string; hasKey: boolean; createdAt?: string; updatedAt?: string };

export default function ByokPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [customProvider, setCustomProvider] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/byok");
      const data = await res.json();
      if (Array.isArray(data)) setKeys(data);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const prov = provider === "custom" ? customProvider.trim().toLowerCase() : provider;
    if (!prov || !apiKey.trim()) {
      setMsg("Provider and API key required");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: prov, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(`Saved ${prov} key ${data.keyHint}`);
      setApiKey("");
      setCustomProvider("");
      await load();
    } catch (e: any) {
      setMsg(e.message);
    }
    setSaving(false);
  };

  const del = async (prov: string) => {
    if (!confirm(`Remove ${prov} key?`)) return;
    await fetch(`/api/byok/${prov}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6 text-[#f9f8fb] max-w-[720px]">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <KeyRound className="size-5 text-pink-500" /> Bring Your Own Key
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Use your own API keys for any provider. Keys are encrypted with <code className="bg-zinc-800 px-1 rounded text-xs">BETTER_AUTH_SECRET</code> (AES-GCM) and
          stored per-user. When set, your key is used instead of the server&apos;s env key.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0b080b] p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">How it works</p>
            <p className="text-xs text-zinc-400 mt-1">
              Add a key for e.g. <code className="bg-zinc-800 px-1 rounded">openai</code>, <code className="bg-zinc-800 px-1 rounded">groq</code>,{" "}
              <code className="bg-zinc-800 px-1 rounded">anthropic</code>. When you chat with a model from that provider (e.g.{" "}
              <code className="bg-zinc-800 px-1 rounded">groq/openai/gpt-oss-20b</code>), your key is injected via{" "}
              <code className="bg-zinc-800 px-1 rounded">requestContext</code> and the agent uses it. Falls back to server env if not set.
            </p>
            <a href="/api/auth/reference" target="_blank" className="text-xs text-zinc-500 underline mt-1 inline-flex items-center gap-1">
              Swagger <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0b080b] p-5">
        <h2 className="text-sm font-semibold">Add / Update key</h2>
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-sm"
            >
              {SUPPORTED_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.id})
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {provider === "custom" && (
              <Input value={customProvider} onChange={(e) => setCustomProvider(e.target.value)} placeholder="provider id e.g. mistral" className="h-9 bg-zinc-900" />
            )}
            <div className="sm:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={show ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={SUPPORTED_PROVIDERS.find((p) => p.id === provider)?.placeholder || "sk-..."}
                  className="h-9 bg-zinc-900 pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded text-zinc-400 hover:bg-zinc-800"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button onClick={save} disabled={saving || !apiKey.trim()} className="shrink-0 bg-pink-700 hover:bg-pink-600">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          {msg && <p className="text-xs text-emerald-400">{msg}</p>}
          <p className="text-xs text-zinc-500">Hint is shown as <code className="bg-zinc-800 px-1 rounded">sk-••••abcd</code>. Full key never returned by GET.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0b080b]">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold">Your keys</h2>
          <span className="text-xs text-zinc-500">{loading ? "..." : `${keys.length} provider(s)`}</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-zinc-500">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-400">No BYOK keys yet. Add one above.</p>
            <p className="text-xs text-zinc-500 mt-1">Example: add Groq key to use <code className="bg-zinc-800 px-1 rounded">groq/openai/gpt-oss-20b</code> with your quota.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {keys.map((k) => (
              <div key={k.provider} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{k.provider}</span>
                    <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-400">{k.keyHint}</span>
                    <span className="text-xs text-zinc-500">{k.label}</span>
                  </div>
                  <div className="text-xs text-zinc-500">{k.updatedAt ? new Date(k.updatedAt).toLocaleDateString() : ""}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(k.keyHint)} className="h-7 border-zinc-800 bg-zinc-900 text-xs">
                    <Check className="size-3" /> Hint
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => del(k.provider)}
                    className="h-7 border-zinc-800 bg-zinc-900 text-xs text-red-400 hover:bg-red-950/30"
                  >
                    <Trash2 className="size-3" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-sm font-medium">Supported providers</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUPPORTED_PROVIDERS.map((p) => (
            <span key={p.id} className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs">
              {p.id}
            </span>
          ))}
          <span className="text-xs text-zinc-500 self-center">+ any custom id</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Model format: <code className="bg-zinc-800 px-1 rounded">provider/model</code> e.g. <code className="bg-zinc-800 px-1 rounded">openai/gpt-4o-mini</code> will use your OpenAI key if set.</p>
      </div>
    </div>
  );
}
