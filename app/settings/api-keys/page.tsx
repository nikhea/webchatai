"use client";

import { useState } from "react";
import { KeyRoundIcon, CopyIcon, TrashIcon, EyeIcon, EyeOffIcon, PlusIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
};

const initialKeys: ApiKey[] = [
  { id: "1", name: "Production", prefix: "sk-ant-...8f3a", createdAt: "2026-03-12", lastUsed: "2 hours ago" },
  { id: "2", name: "Local dev", prefix: "sk-ant-...c91e", createdAt: "2026-02-28", lastUsed: null },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const create = () => {
    if (!name.trim()) return;
    const id = Date.now().toString();
    const prefix = `sk-ant-...${id.slice(-4)}`;
    const full = `sk-ant-api03-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 18)}`;
    setKeys((k) => [{ id, name: name.trim(), prefix, createdAt: new Date().toISOString().slice(0, 10), lastUsed: null }, ...k]);
    setNewKey(full);
    setName("");
  };

  const copy = async (v: string, id: string) => {
    await navigator.clipboard.writeText(v);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const revoke = (id: string) => {
    if (!confirm("Revoke this key? This cannot be undone.")) return;
    setKeys((k) => k.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-6 text-[#f9f8fb]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">API Keys</h1>
          <p className="mt-1 max-w-[560px] text-sm leading-relaxed text-zinc-400">
            Create and manage API keys for your workspace. Keys have full access — keep them secret and rotate regularly.
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} className="shrink-0 gap-1.5 bg-pink-700 text-white hover:bg-pink-600">
          <PlusIcon className="size-4" /> Create key
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0b080b] p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
            <ShieldCheckIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-100">Keep your keys secure</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Don&apos;t share keys in client-side code or public repos. Use environment variables and restrict usage with scopes where possible.
            </p>
            <a href="https://docs.anthropic.com" target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
              View API docs <ExternalLinkIcon className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-zinc-800 bg-[#0b080b] p-5">
          <h2 className="text-sm font-semibold">Create new key</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name — e.g. Production" className="h-9 bg-zinc-900 placeholder:text-zinc-500" />
            <Button onClick={create} disabled={!name.trim()} className="shrink-0 bg-pink-700 text-white hover:bg-pink-600 disabled:opacity-40">
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="shrink-0 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </Button>
          </div>
          {newKey && (
            <div className="mt-4 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
              <p className="text-xs font-medium text-amber-200">Copy your key now — you won&apos;t see it again</p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs text-zinc-100">{newKey}</code>
                <button onClick={() => copy(newKey, "new")} className="grid size-7 place-items-center rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                  <CopyIcon className="size-3.5" />
                </button>
              </div>
              {copied === "new" && <p className="mt-2 text-xs text-emerald-400">Copied</p>}
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0b080b]">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold">Active keys</h2>
          <span className="text-xs text-zinc-500">{keys.length} keys</span>
        </div>
        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="grid size-10 place-items-center rounded-full bg-zinc-900 text-zinc-500">
              <KeyRoundIcon className="size-5" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No API keys yet</p>
            <p className="max-w-sm text-xs text-zinc-500">Create a key to start building with the API. You can revoke or rotate keys at any time.</p>
            <Button onClick={() => setShowCreate(true)} size="sm" className="mt-2 gap-1.5 bg-pink-700 text-white hover:bg-pink-600">
              <PlusIcon className="size-3.5" /> Create key
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {keys.map((k) => (
              <div key={k.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-100">{k.name}</span>
                    <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">{k.prefix}</span>
                    <button
                      onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}
                      className="grid size-6 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      aria-label="Toggle reveal"
                    >
                      {revealed[k.id] ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>Created {k.createdAt}</span>
                    <span>{k.lastUsed ? `Last used ${k.lastUsed}` : "Never used"}</span>
                  </div>
                  {revealed[k.id] && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-300">sk-ant-••••••••••••{k.prefix.slice(-4)}</code>
                      <button onClick={() => copy(k.prefix, k.id)} className="grid size-6 place-items-center rounded text-zinc-400 hover:bg-zinc-800">
                        <CopyIcon className="size-3.5" />
                      </button>
                      {copied === k.id && <span className="text-xs text-emerald-400">Copied</span>}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => copy(k.prefix, k.id)} className="h-7 gap-1 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
                    <CopyIcon className="size-3.5" /> {copied === k.id ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => revoke(k.id)} className="h-7 gap-1 border-zinc-800 bg-zinc-900 text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300">
                    <TrashIcon className="size-3.5" /> Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-zinc-500">
        Need help? <a href="/settings/contact" className="underline underline-offset-2 hover:text-zinc-300">Contact support</a> or see <a href="/settings/shortcuts" className="underline underline-offset-2 hover:text-zinc-300">shortcuts</a>.
      </p>
    </div>
  );
}
