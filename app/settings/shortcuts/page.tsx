"use client";

import { X } from "lucide-react";

type Shortcut = {
  label: string;
  description: string;
  keys: string[];
};

const coreActions: Shortcut[] = [
  { label: "Search", description: "Open the command menu.", keys: ["Ctrl", "K"] },
  { label: "Toggle Sidebar", description: "Show or hide the chat sidebar.", keys: ["Ctrl", "B"] },
  { label: "Open Model Picker", description: "Open the model chooser from the chat composer.", keys: ["Ctrl", "/"] },
  { label: "Delete Current Chat", description: "Delete the active chat thread.", keys: ["Ctrl", "Shift", "⌫"] },
];

const navigation: Shortcut[] = [
  { label: "New Chat", description: "Jump to a fresh chat.", keys: ["Ctrl", "Shift", "O"] },
  { label: "Previous Thread", description: "Move to the previous thread in the sidebar.", keys: ["Ctrl", "Alt", "↑"] },
  { label: "Next Thread", description: "Move to the next thread in the sidebar.", keys: ["Ctrl", "Alt", "↓"] },
];

function ShortcutRow({ item }: { item: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[rgb(249,248,251)]">{item.label}</div>
        <div className="mt-0.5 text-xs text-zinc-400">{item.description}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-[rgb(11,8,11)] px-2 py-1.5">
        <div className="flex items-center gap-1">
          {item.keys.map((k) => (
            <span key={k} className="rounded bg-[#2a2430] px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-300">
              {k}
            </span>
          ))}
        </div>
        <button aria-label={`Clear ${item.label} shortcut`} className="ml-2 grid size-5 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

export default function ShortcutsPage() {
  return (
    <div className="space-y-8">
      <h2 className="sr-only">Keyboard Shortcuts Settings</h2>

      <section className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(249,248,251)]">Keyboard Shortcuts</h1>
        <p className="text-xs leading-relaxed text-zinc-400">
          Record your own shortcuts for common actions. Press Backspace or Delete while recording to clear a shortcut, or Escape to cancel. App shortcuts are temporarily disabled while you are on this page.
        </p>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[rgb(249,248,251)]">Core Actions</h2>
          <p className="text-xs text-zinc-400">The commands you&apos;re most likely to use every day.</p>
        </div>
        <div className="flex flex-col divide-y divide-zinc-800/60">
          {coreActions.map((item) => (
            <ShortcutRow key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-[rgb(11,8,11)] p-4 text-[rgb(249,248,251)]">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[rgb(249,248,251)]">Navigation</h2>
          <p className="text-xs text-zinc-400">Thread movement and other navigation helpers.</p>
        </div>
        <div className="mt-3 flex flex-col divide-y divide-zinc-800/60">
          {navigation.map((item) => (
            <ShortcutRow key={item.label} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
