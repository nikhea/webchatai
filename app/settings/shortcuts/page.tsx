"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { useHotkeysStore, type HotkeyId, hotkeyLabels } from "@/lib/hotkeys-store";

const order: HotkeyId[] = ["search", "toggleSidebar", "openModelPicker", "settings", "deleteCurrent", "newChat", "prevThread", "nextThread"];

function keysToDisplay(keys: string[]) {
  if (keys.length === 0) return ["—"];
  return keys;
}

function ShortcutRow({ id, recording, onRecord, onClear }: { id: HotkeyId; recording: boolean; onRecord: (id: HotkeyId) => void; onClear: (id: HotkeyId) => void }) {
  const hotkeys = useHotkeysStore((s) => s.hotkeys);
  const keys = hotkeys[id];
  const meta = hotkeyLabels[id];
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[rgb(249,248,251)]">{meta.label}</div>
        <div className="mt-0.5 text-xs text-zinc-400">{meta.description}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => onRecord(id)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1.5 transition-colors ${recording ? "border-pink-600 bg-pink-950/30 text-pink-300" : "border-zinc-800 bg-[rgb(11,8,11)] hover:border-zinc-700"}`}
        >
          <div className="flex items-center gap-1">
            {keysToDisplay(keys).map((k) => (
              <span key={k} className={`rounded px-1.5 py-0.5 font-mono text-xs font-medium ${recording ? "bg-pink-900 text-pink-200" : "bg-[#2a2430] text-zinc-300"}`}>
                {recording ? "Press keys…" : k}
              </span>
            ))}
          </div>
        </button>
        <button aria-label={`Clear ${meta.label} shortcut`} onClick={() => onClear(id)} className="grid size-7 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function ShortcutsPage() {
  const { hotkeys, setHotkey, clearHotkey, resetAll } = useHotkeysStore();
  const [recording, setRecording] = useState<HotkeyId | null>(null);

  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(null);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        clearHotkey(recording);
        setRecording(null);
        return;
      }
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key === "ArrowUp" ? "↑" : e.key === "ArrowDown" ? "↓" : e.key === "Backspace" ? "⌫" : e.key;
      if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        if (!parts.includes(key)) parts.push(key);
      }
      if (parts.length >= 2) {
        setHotkey(recording, parts);
        setRecording(null);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recording, setHotkey, clearHotkey]);

  return (
    <div className="space-y-8">
      <h2 className="sr-only">Keyboard Shortcuts Settings</h2>
      <section className="space-y-1.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[rgb(249,248,251)]">Keyboard Shortcuts</h1>
            <p className="text-xs leading-relaxed text-zinc-400">Click a shortcut to record. Press Backspace/Delete to clear, Escape to cancel. Saved to localStorage via zustand.</p>
          </div>
          <button onClick={resetAll} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#0b080b] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-900">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      </section>
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[rgb(249,248,251)]">Core Actions</h2>
          <p className="text-xs text-zinc-400">The commands you&apos;re most likely to use every day.</p>
        </div>
        <div className="flex flex-col divide-y divide-zinc-800/60">
          {order.slice(0, 5).map((id) => (
            <ShortcutRow key={id} id={id} recording={recording === id} onRecord={setRecording} onClear={clearHotkey} />
          ))}
        </div>
      </section>
      <section className="rounded-lg bg-[rgb(11,8,11)] p-4 text-[rgb(249,248,251)]">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[rgb(249,248,251)]">Navigation</h2>
          <p className="text-xs text-zinc-400">Thread movement and other navigation helpers.</p>
        </div>
        <div className="mt-3 flex flex-col divide-y divide-zinc-800/60">
          {order.slice(5).map((id) => (
            <ShortcutRow key={id} id={id} recording={recording === id} onRecord={setRecording} onClear={clearHotkey} />
          ))}
        </div>
      </section>
      <p className="text-xs text-zinc-500">Stored in localStorage key <code className="rounded bg-zinc-800 px-1">hotkeys-storage</code> · zustand persist</p>
    </div>
  );
}
