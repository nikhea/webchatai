"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { Info, Plus, ChevronDown, Circle, Save, Sparkles, Blocks } from "lucide-react";

const PRESET_TRAITS = ["friendly", "witty", "concise", "curious", "empathetic", "creative", "patient"] as const;

export default function CustomizationPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState("");
  const [about, setAbout] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [promptBlocks, setPromptBlocks] = useState<any[]>([]);
  const [newBlock, setNewBlock] = useState({ id: "", name: "", content: "" });

  useEffect(() => {
    fetch("/api/customization")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.user?.name) setName(d.user.name);
        if (d.agentInstructions && typeof d.agentInstructions === "string") setInstructions(d.agentInstructions);
        else if (Array.isArray(d.agentInstructions)) setInstructions(JSON.stringify(d.agentInstructions, null, 2));
        if (Array.isArray(d.promptBlocks)) setPromptBlocks(d.promptBlocks);
      })
      .catch(() => {});
    const saved = typeof window !== "undefined" ? localStorage.getItem("nova-customization") : null;
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.name) setName(p.name);
        if (p.role) setRole(p.role);
        if (Array.isArray(p.traits)) setTraits(p.traits);
        if (p.about) setAbout(p.about);
      } catch {}
    }
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const payload = { name, role, traits, about, instructions: instructions || undefined };
    localStorage.setItem("nova-customization", JSON.stringify({ name, role, traits, about }));
    try {
      const res = await fetch("/api/customization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed");
      setMsg("Saved to Editor (draft) + working memory");
    } catch (e: any) {
      setMsg(e.message || "Saved locally");
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const addTrait = (t: string) => {
    const v = t.trim().toLowerCase();
    if (!v || traits.includes(v)) return;
    if ((traits.join(" ").length + v.length) > 100) return;
    setTraits((p) => [...p, v]);
  };

  const removeTrait = (t: string) => setTraits((p) => p.filter((x) => x !== t));

  const onTraitKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (traitInput.trim()) {
        e.preventDefault();
        addTrait(traitInput);
        setTraitInput("");
      }
    }
    if (e.key === "Backspace" && !traitInput && traits.length) {
      removeTrait(traits[traits.length - 1]!);
    }
  };

  const dirty = name.length > 0 || role.length > 0 || traits.length > 0 || about.length > 0;

  return (
    <div className="w-full max-w-[720px]">
      <h1 className="text-[28px] font-bold tracking-tight text-white">Customize NOVA</h1>

      <div className="mt-8 space-y-7">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-zinc-100">Profile</span>
            <Info className="size-3.5 text-zinc-500" />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-[#2a1e2e] bg-[#1a1218]/80 px-3 text-sm text-zinc-100 backdrop-blur hover:bg-[#20161e]"
              >
                <span className="inline-flex items-center gap-2">
                  <Circle className="size-3.5 text-zinc-400" />
                  <span className="text-[13px] font-medium">Default</span>
                </span>
                <ChevronDown className="size-4 text-zinc-500" />
              </button>
              {profileOpen && (
                <div className="absolute left-0 top-10 z-10 w-full rounded-md border border-zinc-800 bg-[#1e141e] py-1 shadow-xl">
                  <div className="px-3 py-1.5 text-sm text-white">Default</div>
                </div>
              )}
            </div>
            <button className="grid size-9 place-items-center rounded-md border border-[#2a1e2e] bg-[#1a1218]/80 text-zinc-300 hover:bg-[#20161e]">
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">What should NOVA call you?</label>
          <div className="relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="Enter your name"
              className="h-9 w-full rounded-md border border-[#2a1e2e] bg-[#15101a]/70 px-3 pr-14 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {name.length}/50
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">What do you do?</label>
          <div className="relative">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value.slice(0, 100))}
              placeholder="Engineer, student, etc."
              className="h-9 w-full rounded-md border border-[#2a1e2e] bg-[#15101a]/70 px-3 pr-16 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {role.length}/100
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">What traits should NOVA have?</label>
          <div className="relative flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-[#2a1e2e] bg-[#15101a]/70 px-2 py-1.5 pr-16 focus-within:border-zinc-700">
            {traits.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-[#2a1e2e] px-2 py-0.5 text-xs font-medium text-zinc-300"
              >
                {t}
                <button onClick={() => removeTrait(t)} className="ml-0.5 text-zinc-400 hover:text-zinc-200">
                  ×
                </button>
              </span>
            ))}
            <input
              value={traitInput}
              onChange={(e) => setTraitInput(e.target.value)}
              onKeyDown={onTraitKeyDown}
              placeholder={traits.length === 0 ? "Type a trait and press Enter or Tab..." : "Add trait..."}
              className="min-w-[180px] flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {traits.join(" ").length}/{100}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_TRAITS.map((t) => (
              <button
                key={t}
                onClick={() => addTrait(t)}
                disabled={traits.includes(t)}
                className="inline-flex items-center gap-1 rounded-full bg-[#2a2430]/80 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-[#332a3a] disabled:opacity-40"
              >
                {t} <Plus className="size-3" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">Anything else NOVA should know about you?</label>
          <div className="relative">
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, 3000))}
              placeholder="Interests, values, or preferences to keep in mind"
              rows={5}
              className="min-h-[132px] w-full resize-none rounded-md border border-[#2a1e2e] bg-[#15101a]/70 px-3 py-2.5 pb-7 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-zinc-500">{about.length}/3000</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0b080b] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Mastra Editor — Instructions (CMS)</h3>
            <span className="ml-auto text-xs text-zinc-500">Studio → Agents → Editor</span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">
            Collaborators can override system prompt without code. Use <code className="bg-zinc-800 px-1 rounded">{"{{userName}}"}</code> /{" "}
            <code className="bg-zinc-800 px-1 rounded">{"{{user.role}}"}</code> from requestContext. Saved as draft, publish when ready.
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions for working-memory-personal-assistant-agent…"
            rows={6}
            className="w-full rounded-md border border-zinc-800 bg-[#15101a] p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none font-mono"
          />
          <p className="text-xs text-zinc-500 mt-1">Leave empty to keep code default. Supports prompt blocks via Editor: create under Prompts → Add block.</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0b080b] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Blocks className="size-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Prompt Blocks (reusable)</h3>
            <span className="text-xs text-zinc-500">e.g. refund policy for support/returns/order-status</span>
          </div>
          {promptBlocks.length === 0 ? (
            <p className="text-xs text-zinc-500">No blocks yet. Create in Studio → Prompts or via API <code className="bg-zinc-800 px-1 rounded">editor.prompt.create</code>.</p>
          ) : (
            <div className="space-y-2">
              {promptBlocks.slice(0, 5).map((b: any) => (
                <div key={b.id} className="rounded border border-zinc-800 bg-zinc-900/50 p-2">
                  <div className="text-xs font-medium text-zinc-200">{b.name || b.id}</div>
                  <div className="text-xs text-zinc-400 truncate">{b.description || b.content?.slice(0, 80)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <input value={newBlock.id} onChange={(e) => setNewBlock({ ...newBlock, id: e.target.value })} placeholder="id: brand-voice" className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs" />
            <input value={newBlock.name} onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })} placeholder="name" className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs" />
            <input value={newBlock.content} onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })} placeholder="content: Write in {{userName}} tone" className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs" />
          </div>
          <button
            onClick={async () => {
              if (!newBlock.id || !newBlock.content) return;
              await fetch("/api/customization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instructions: newBlock.content }) });
              setMsg("Block draft saved (use Studio to publish)");
            }}
            className="mt-2 rounded bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
          >
            Save block draft
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        {msg && <span className="text-xs text-emerald-400">{msg}</span>}
        <button
          disabled={!dirty && !instructions}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#a12a5e] px-5 py-2 text-sm font-medium text-white hover:bg-[#b0306a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="size-4" /> {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
