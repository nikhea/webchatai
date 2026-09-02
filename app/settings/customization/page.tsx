"use client";

import { useState, KeyboardEvent } from "react";
import { Info, Plus, ChevronDown, Circle } from "lucide-react";

const PRESET_TRAITS = ["friendly", "witty", "concise", "curious", "empathetic", "creative", "patient"] as const;

export default function CustomizationPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState("");
  const [about, setAbout] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

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
      <h1 className="text-[28px] font-bold tracking-tight text-white">Customize T3 Chat</h1>

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
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">What should T3 Chat call you?</label>
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
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">What traits should T3 Chat have?</label>
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
          <label className="mb-2 block text-[13px] font-medium text-zinc-100">Anything else T3 Chat should know about you?</label>
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
      </div>

      <div className="mt-8 flex justify-end">
        <button
          disabled={!dirty}
          onClick={() => alert("Preferences saved")}
          className="rounded-md bg-[#a12a5e] px-5 py-2 text-sm font-medium text-white hover:bg-[#b0306a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
