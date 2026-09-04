"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import modelsJson from "@/lib/models.json";

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

type Model = { name: string; price: string | null; favorited: boolean; dim: boolean; caps: CapKey[]; desc: string; hidden?: boolean };

const MODEL_DATA: Record<string, { models: Model[]; legacy: string[]; legacyLabel: string | null }> = (modelsJson as any).modelData;

const PROVIDERS: { id: string; label: string; icon: string; hidden?: boolean }[] = (modelsJson as any).providers;

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
  cerebras: "cerebras",
  cloudflare: "cloudflare",
  moonshot: "moonshot",
  zai: "zai",
  siliconflow: "siliconflow",
  upstage: "upstage",
  openrouter: "openrouter",
  deepinfra: "deepinfra",
  openai: "openai",
};

function OpenAIIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 320 320" fill="currentColor" className={active ? "text-white" : "text-gray-500"}>
      <path d="M297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68C187.93 9.4 165.74 0 142.13 0 106.83 0 75.57 22.79 65 56.4 42.49 60.99 23.06 75.13 11.66 95.13c-17.59 30.32-13.58 68.54 9.92 94.54-7.25 21.79-4.76 45.66 6.86 65.48 17.46 30.41 52.56 46.04 86.84 38.68 15.43 17.41 37.63 27.39 60.94 26.92 35.32.06 66.58-22.74 77.16-56.38 22.51-4.59 41.94-18.74 53.34-38.74 17.6-30.32 13.59-68.54-9.92-94.54zm-120.95 174.83c-13.96 0-27.5-4.92-38.17-13.95.49-.26 1.34-.74 1.9-1.08l63.72-36.8a10.42 10.42 0 0 0 5.24-9.07v-89.83l26.93 15.55c.29.15.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.92 59.94zm-128.84-55.03c-7-12.08-9.52-26.25-7.11-39.85.46.27 1.27.77 1.86 1.1l63.72 36.8a10.45 10.45 0 0 0 10.48 0l77.79-44.92v31.1c.02.32-.13.63-.39.83l-64.41 37.19c-28.69 16.52-65.32 6.7-81.95-21.95z" />
    </svg>
  );
}

function ProviderIcon({ id, active }: { id: string; active: boolean }) {
  const [failed, setFailed] = useState(false);
  if (id === "favorites") return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className={active ? "text-white" : "text-gray-500"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
  if (id === "openai") return <OpenAIIcon active={active} />;
  const slug = PROVIDER_SLUGS[id];
  if (slug && !failed) {
    return (
      <img
        width={22}
        height={22}
        src={`https://cdn.simpleicons.org/${slug}/${active ? "white" : "6b7280"}`}
        alt={id}
        className="size-[22px] object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  const label = id === "xai" ? "xAI" : id === "cohere" ? "Co" : id === "groq" ? "Gr" : id === "together" ? "Tg" : id === "fireworks" ? "Fw" : id === "bedrock" ? "Ab" : id === "qwen" ? "Qw" : id.slice(0, 2);
  return <span className={cn("text-[10px] font-bold tracking-tight uppercase grid size-[22px] place-items-center", active ? "text-white" : "text-gray-500")}>{label}</span>;
}

export function ModelSelectionPopup({
  open,
  onClose,
  onSelect,
  selectedName,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string, providerId: string, providerName: string) => void;
  selectedName?: string;
}) {
  const [active, setActive] = useState("favorites");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCaps, setActiveCaps] = useState<Set<string>>(new Set());
  const [showLegacy, setShowLegacy] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["Gemini 3 Flash", "Gemini 3.5 Flash-Lite", "Claude Opus 5"]));
  const [visible, setVisible] = useState(12);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const markerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);
  useEffect(() => setVisible(12), [debouncedQuery, active, activeCaps]);
  useEffect(() => {
    const el = sentinelRef.current;
    const root = listRef.current;
    if (!el || !root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => v + 12);
      },
      { root, rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  useEffect(() => {
    const btn = btnRefs.current[active];
    const sidebar = sidebarRef.current;
    const marker = markerRef.current;
    if (!btn || !sidebar || !marker) return;
    const sRect = sidebar.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    marker.style.top = `${bRect.top - sRect.top + bRect.height / 2 - 16}px`;
  }, [active]);

  if (!open) return null;

  const visibleProviders = PROVIDERS.filter((p: any) => !(p as any).hidden);
  const data = MODEL_DATA[active];
  const allFiltered = data
    ? data.models.filter((m) => {
        if ((m as any).hidden) return false;
        if (debouncedQuery && !m.name.toLowerCase().includes(debouncedQuery.toLowerCase())) return false;
        if (activeCaps.size > 0 && !m.caps.some((c) => activeCaps.has(c))) return false;
        return true;
      })
    : [];
  const filtered = allFiltered.slice(0, visible);
  const hasMore = visible < allFiltered.length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-50 mb-2 w-[30.8rem] max-w-[min(90vw,30.8rem)] bg-[#1c1821] rounded-2xl border border-white/5 shadow-2xl flex overflow-hidden h-[546px] animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div ref={sidebarRef} className="w-16 bg-[#16131a] flex flex-col relative border-r border-white/5 shrink-0">
          <div ref={markerRef} className="absolute left-0 w-[3px] h-8 rounded-r bg-gradient-to-b from-pink-400 to-purple-600 transition-all duration-150" style={{ top: 16 }} />
          <div className="flex-1 overflow-y-auto flex flex-col items-center py-4 gap-6 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {visibleProviders.map((p) => (
              <button
                key={p.id}
                ref={(el) => { btnRefs.current[p.id] = el; }}
                onClick={() => { setActive(p.id); setShowLegacy(false); }}
                className={cn("sidebar-btn relative p-1", active === p.id ? "text-white" : "text-gray-500 hover:text-white")}
                title={p.label}
              >
                <ProviderIcon id={p.id} active={active === p.id} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#3d1530] via-[#2a1020]/70 to-transparent pointer-events-none" />
            <div className="relative p-6 pb-4 border-b border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-white font-semibold text-lg leading-tight">Unlock all models</h2>
                  <p className="text-pink-400 font-semibold text-sm mt-0.5">$8<span className="text-gray-400 font-normal">/month</span></p>
                </div>
                <button className="bg-gradient-to-b from-[#e0468e] to-[#c23577] text-white px-4 py-1.5 rounded-lg text-sm font-medium">Upgrade</button>
              </div>
              <div className="flex gap-3 relative">
                <div className="flex-1 flex items-center bg-[#25212b]/80 rounded-lg px-3 py-2 border border-white/5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models..." className="bg-transparent border-none text-white focus:outline-none ml-2 w-full text-sm placeholder-gray-500" />
                </div>
                <button onClick={() => setFilterOpen((v) => !v)} className="p-2 bg-[#25212b]/80 rounded-lg border border-white/5 text-gray-400 hover:text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                </button>
                {filterOpen && (
                  <div className="absolute top-12 right-0 w-56 bg-[#1f1b26] border border-white/10 rounded-xl shadow-2xl z-40 py-2">
                    {Object.entries(CAPABILITIES).map(([k, c]) => (
                      <button
                        key={k}
                        onClick={() => setActiveCaps((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
                        className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 text-left", activeCaps.has(k) ? "bg-white/5 text-white" : "text-gray-200")}
                      >
                        <span className={cn("w-6 h-6 rounded-md flex items-center justify-center", c.bg, c.color)} dangerouslySetInnerHTML={{ __html: c.icon }} />
                        {c.label}
                      </button>
                    ))}
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button onClick={() => setFilterOpen(false)} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white">Show combined results</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-5 custom-scrollbar">
            {!data ? (
              <div className="flex flex-col items-center justify-center text-center gap-2 py-16 text-gray-500">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <p className="text-sm">No models synced for {PROVIDERS.find((p) => p.id === active)?.label} yet.</p>
              </div>
            ) : allFiltered.length === 0 ? (
              <div className="text-center text-gray-500 py-12 text-sm">No matches</div>
            ) : (
              filtered.map((m) => {
                const isFav = favorites.has(m.name);
                const isSelected = selectedName === m.name;
                return (
                  <div
                    key={m.name}
                    onClick={() => {
                      const prov = PROVIDERS.find((p) => p.id === active);
                      let pid = prov?.id ?? active;
                      let pname = prov?.label ?? active;
                      if (active === "favorites") {
                        for (const [k, v] of Object.entries(MODEL_DATA)) {
                          if (k === "favorites") continue;
                          if (v.models.some((x) => x.name === m.name)) {
                            const fp = PROVIDERS.find((p) => p.id === k);
                            if (fp) { pid = fp.id; pname = fp.label; break; }
                          }
                        }
                      }
                      onSelect(m.name, pid, pname);
                    }}
                    className={cn("group flex flex-col gap-1 cursor-pointer rounded-lg px-2 py-1 -mx-2", isSelected && "bg-white/5", m.dim && "opacity-80")}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-[15px]", m.dim ? "text-gray-300" : "text-white")}>{m.name}</span>
                        {m.price ? <span className={cn("text-emerald-400 text-xs tracking-widest font-mono", m.dim && "opacity-70")}>{m.price}</span> : <span className="text-gray-600 text-xs font-mono">···</span>}
                        {isSelected && <span className="text-sky-400 text-xs">● selected</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); setFavorites((s) => { const n = new Set(s); if (n.has(m.name)) n.delete(m.name); else n.add(m.name); return n; }); }}
                          className={cn(isFav ? "text-yellow-400" : "text-gray-500")}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.caps.map((k) => {
                          const c = CAPABILITIES[k];
                          return <span key={k} className={cn("inline-flex items-center justify-center w-7 h-7 rounded-full", m.dim ? "bg-white/5 text-gray-500" : cn(c.bg, c.color))} dangerouslySetInnerHTML={{ __html: c.icon }} title={c.label} />;
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={cn("text-xs", m.dim ? "text-[#726c7c]" : "text-[#a29cae]")}>{m.desc}</p>
                    </div>
                  </div>
                );
              })
            )}
            {hasMore && <div ref={sentinelRef} className="h-1" />}
            {!hasMore && allFiltered.length > 12 && <div className="py-2 text-center text-xs text-zinc-600">No more models</div>}
            {data && data.legacy.length > 0 && (
              <>
                <div onClick={() => setShowLegacy((v) => !v)} className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between cursor-pointer text-gray-400 hover:text-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                    {data.legacyLabel}
                  </div>
                  <svg className={cn("w-4 h-4 transition-transform", showLegacy && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </div>
                {showLegacy && <div className="flex flex-col gap-3 mt-1">{data.legacy.map((n) => <div key={n} className="text-gray-400 font-semibold text-[15px] flex items-center gap-2">{n} <span className="text-gray-600 text-xs border border-gray-600 px-1 rounded">Legacy</span></div>)}</div>}
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#332f38;border-radius:10px}`}</style>
    </>
  );
}
