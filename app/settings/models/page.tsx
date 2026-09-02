"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, LayoutGridIcon, LayoutListIcon, EyeIcon, EyeOffIcon, StarIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CapKey = "fast" | "vision" | "reasoning" | "effort" | "tool" | "image" | "pdf";

const CAPABILITIES: Record<CapKey, { label: string; color: string; bg: string; icon: string }> = {
  fast: { label: "Fast", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  vision: { label: "Vision", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' },
  reasoning: { label: "Reasoning", color: "text-indigo-400", bg: "bg-indigo-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>' },
  effort: { label: "Effort Control", color: "text-sky-400", bg: "bg-sky-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8"/><path d="M18 6H10"/><path d="M18 18H10"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/></svg>' },
  tool: { label: "Tool Calling", color: "text-rose-400", bg: "bg-rose-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' },
  image: { label: "Image Generation", color: "text-orange-400", bg: "bg-orange-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
  pdf: { label: "PDF Comprehension", color: "text-purple-400", bg: "bg-purple-500/10", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
};

const PROVIDER_SLUGS: Record<string, string> = {
  gemini: "googlegemini",
  anthropic: "anthropic",
  meta: "meta",
  deepseek: "deepseek",
  mistral: "mistralai",
  xai: "x",
  perplexity: "perplexity",
  cohere: "cohere",
  qwen: "alibabacloud",
  bedrock: "amazonaws",
  together: "together",
  groq: "groq",
  ollama: "ollama",
  databricks: "databricks",
  ai21: "ai21",
  fireworks: "fireworks",
  huggingface: "huggingface",
};

function providerForModel(name: string): string {
  const n = name.toLowerCase();
  if (n.startsWith("claude")) return "anthropic";
  if (n.startsWith("qwen")) return "qwen";
  if (n.startsWith("deepseek")) return "deepseek";
  if (n.startsWith("gemini")) return "gemini";
  return "openai";
}

function ProviderIcon({ id, size = 22 }: { id: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (id === "openai") {
    return (
      <svg width={size} height={size} viewBox="0 0 320 320" fill="currentColor" className="text-white">
        <path d="M297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68C187.93 9.4 165.74 0 142.13 0 106.83 0 75.57 22.79 65 56.4 42.49 60.99 23.06 75.13 11.66 95.13c-17.59 30.32-13.58 68.54 9.92 94.54-7.25 21.79-4.76 45.66 6.86 65.48 17.46 30.41 52.56 46.04 86.84 38.68 15.43 17.41 37.63 27.39 60.94 26.92 35.32.06 66.58-22.74 77.16-56.38 22.51-4.59 41.94-18.74 53.34-38.74 17.6-30.32 13.59-68.54-9.92-94.54zm-120.95 174.83c-13.96 0-27.5-4.92-38.17-13.95.49-.26 1.34-.74 1.9-1.08l63.72-36.8a10.42 10.42 0 0 0 5.24-9.07v-89.83l26.93 15.55c.29.15.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.92 59.94z" />
      </svg>
    );
  }
  const slug = PROVIDER_SLUGS[id];
  if (slug && !failed) {
    return <img width={size} height={size} src={`https://cdn.simpleicons.org/${slug}/white`} alt={id} className="object-contain" style={{ width: size, height: size }} loading="lazy" onError={() => setFailed(true)} />;
  }
  return <span className="grid place-items-center text-[10px] font-bold uppercase text-white" style={{ width: size, height: size }}>{id.slice(0, 2)}</span>;
}

type Model = { name: string; sub: string; price: string; accent?: string; new?: boolean; starred?: boolean; caps: CapKey[] };

const models: Model[] = [
  { name: "Claude", sub: "Fable 5.1", price: "$$$ -", accent: "ring-pink-600", new: true, caps: ["reasoning", "vision", "pdf", "tool"] },
  { name: "Qwen", sub: "3 32B", price: "· · ·", caps: ["reasoning", "tool"] },
  { name: "Qwen", sub: "3 235B", price: "· · ·", caps: ["reasoning", "tool"] },
  { name: "Qwen", sub: "3 Coder", price: "$ ·", caps: ["reasoning", "tool"] },
  { name: "Qwen", sub: "3.6 27B", price: "$ ·", caps: ["reasoning", "tool"] },
  { name: "Qwen", sub: "3.6 35B A3B", price: "$ ·", caps: ["reasoning", "tool"] },
  { name: "Qwen", sub: "3.8 27B", price: "$$ ·", caps: ["reasoning", "vision"] },
  { name: "Claude", sub: "Sonnet 4.5", price: "$$$", caps: ["reasoning", "vision", "tool"] },
  { name: "Claude", sub: "Sonnet 4.6", price: "$$$", caps: ["reasoning", "vision", "tool"] },
  { name: "Claude", sub: "Sonnet 5", price: "$$$", caps: ["reasoning", "vision", "tool", "pdf"] },
  { name: "Claude", sub: "4.1 Opus", price: "BYOK", caps: ["reasoning", "vision"] },
  { name: "Claude", sub: "Haiku 4.5", price: "$$ ·", caps: ["fast", "tool"] },
  { name: "Claude", sub: "Opus 4.5", price: "$$$+", caps: ["reasoning", "vision", "tool"] },
  { name: "Claude", sub: "Opus 4.6", price: "$$$+", caps: ["reasoning", "vision", "tool"] },
  { name: "Claude", sub: "Opus 4.7", price: "$$$ -", caps: ["reasoning", "vision"] },
  { name: "Claude", sub: "Opus 4.8", price: "$$$ -", caps: ["reasoning", "vision"] },
  { name: "Claude", sub: "Opus 5", price: "$$$+", caps: ["reasoning", "vision", "tool", "pdf"] },
  { name: "Claude", sub: "Fable 5", price: "$$$+", caps: ["reasoning", "vision"] },
  { name: "DeepSeek", sub: "v3 (0324)", price: "$ · -", caps: ["reasoning"] },
  { name: "DeepSeek", sub: "v3.1", price: "$ · -", caps: ["reasoning"] },
  { name: "DeepSeek", sub: "v3.1 Terminus", price: "$ · -", caps: ["reasoning", "tool"] },
  { name: "DeepSeek", sub: "v3.2", price: "...", caps: ["reasoning"] },
  { name: "DeepSeek", sub: "v4 Flash", price: "...", caps: ["fast", "reasoning"] },
  { name: "DeepSeek", sub: "v4 Flash (0731)", price: "", caps: ["fast", "reasoning"] },
  { name: "DeepSeek", sub: "v4 Pro", price: "$$ ·", caps: ["reasoning"] },
  { name: "DeepSeek", sub: "v4 Pro (0813)", price: "$$ ·", caps: ["reasoning"] },
  { name: "DeepSeek", sub: "R1 (0528)", price: "$$ ·", caps: ["reasoning"] },
  { name: "Gemini", sub: "2.5 Flash", price: "$ · -", starred: true, caps: ["vision", "fast", "tool"] },
];

export default function ModelsPage() {
  const [query, setQuery] = useState("");
  const [activeCaps, setActiveCaps] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = models.filter((m) => {
    const full = `${m.name} ${m.sub}`.toLowerCase();
    if (query && !full.includes(query.toLowerCase())) return false;
    if (activeCaps.size > 0 && !m.caps.some((c) => activeCaps.has(c))) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Models</h1>
          <p className="mt-1 text-sm text-zinc-400">Choose which models appear in your selector, and read more about their capabilities.</p>
        </div>
        <button className="text-zinc-500 hover:text-zinc-300">⋯</button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
        <SparklesIcon className="size-4 text-amber-500" />
        <span><span className="text-amber-400">1 new</span> — Claude Fable 5.1</span>
      </div>

      <div className="mt-4 flex gap-2 relative">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models..." className="h-9 bg-zinc-900 pl-9 placeholder:text-zinc-500" />
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" className={cn("h-9 gap-1.5 border-zinc-800 bg-zinc-900", filterOpen && "bg-zinc-800")} onClick={() => setFilterOpen((v) => !v)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg> Filter {activeCaps.size > 0 && `(${activeCaps.size})`}
          </Button>
          {filterOpen && (
            <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-white/10 bg-[#1f1b26] py-2 shadow-2xl">
              {Object.entries(CAPABILITIES).map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => setActiveCaps((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
                  className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/5", activeCaps.has(k) ? "bg-white/5 text-white" : "text-zinc-200")}
                >
                  <span className={cn("flex size-6 items-center justify-center rounded-md", c.bg, c.color)} dangerouslySetInnerHTML={{ __html: c.icon }} />
                  {c.label}
                </button>
              ))}
              <div className="mt-1 border-t border-white/5 pt-1">
                <button onClick={() => { setActiveCaps(new Set()); setFilterOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:text-white">Clear filters</button>
                <button onClick={() => setFilterOpen(false)} className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:text-white">Show combined results</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"><LayoutListIcon className="size-4" /></button>
          <button className="rounded bg-zinc-800 p-1.5 text-zinc-100"><LayoutGridIcon className="size-4" /></button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {filtered.map((m, i) => {
          const provider = providerForModel(m.name);
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center rounded-xl border bg-zinc-900 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-800 hover:shadow-lg hover:shadow-black/20 ${m.new ? "border-pink-600/50 ring-1 ring-pink-600/30 hover:border-pink-500/60" : "border-zinc-800"}`}
            >
              {m.new && <span className="absolute right-2 top-2 text-[9px] font-bold text-pink-500">NEW</span>}
              {m.starred && <StarIcon className="absolute right-2 top-2 size-3 fill-amber-400 text-amber-400" />}
              <div className="grid size-8 place-items-center rounded-full bg-zinc-800 overflow-hidden">
                <ProviderIcon id={provider} size={20} />
              </div>
              <div className="mt-2 text-sm font-medium leading-none">{m.name}</div>
              <div className="text-xs text-zinc-400">{m.sub}</div>
              <div className={`mt-2 text-[10px] ${m.price.includes("$$$") ? "text-red-400" : m.price.includes("$$") ? "text-amber-400" : "text-emerald-400"}`}>{m.price || "· · ·"}</div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {m.caps.slice(0, 4).map((k) => {
                  const c = CAPABILITIES[k];
                  return <span key={k} className={cn("inline-flex size-5 items-center justify-center rounded-full text-[10px]", c.bg, c.color)} dangerouslySetInnerHTML={{ __html: c.icon }} title={c.label} />;
                })}
              </div>

            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="mt-12 text-center text-sm text-zinc-500">No matches for current filters</div>}
    </div>
  );
}
