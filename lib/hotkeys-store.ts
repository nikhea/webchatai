"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HotkeyId = "search" | "toggleSidebar" | "openModelPicker" | "settings" | "deleteCurrent" | "newChat" | "prevThread" | "nextThread";

export const defaultHotkeys: Record<HotkeyId, string[]> = {
  search: ["Ctrl", "K"],
  toggleSidebar: ["Ctrl", "B"],
  openModelPicker: ["Ctrl", "/"],
  settings: ["Ctrl", ","],
  deleteCurrent: ["Ctrl", "Shift", "⌫"],
  newChat: ["Ctrl", "Shift", "O"],
  prevThread: ["Ctrl", "Alt", "↑"],
  nextThread: ["Ctrl", "Alt", "↓"],
};

export const hotkeyLabels: Record<HotkeyId, { label: string; description: string }> = {
  search: { label: "Search", description: "Open the command menu." },
  toggleSidebar: { label: "Toggle Sidebar", description: "Show or hide the chat sidebar." },
  openModelPicker: { label: "Open Model Picker", description: "Open the model chooser from the chat composer." },
  settings: { label: "Open Settings", description: "Open settings page." },
  deleteCurrent: { label: "Delete Current Chat", description: "Delete the active chat thread." },
  newChat: { label: "New Chat", description: "Jump to a fresh chat." },
  prevThread: { label: "Previous Thread", description: "Move to the previous thread in the sidebar." },
  nextThread: { label: "Next Thread", description: "Move to the next thread in the sidebar." },
};

function toHotkeyString(keys: string[]): string {
  return keys.join("+").replace("⌫", "Backspace").replace("↑", "ArrowUp").replace("↓", "ArrowDown");
}

export function keysToHotkey(keys: string[]): string {
  return toHotkeyString(keys);
}

type HotkeysState = {
  hotkeys: Record<HotkeyId, string[]>;
  setHotkey: (id: HotkeyId, keys: string[]) => void;
  clearHotkey: (id: HotkeyId) => void;
  resetAll: () => void;
};

export const useHotkeysStore = create<HotkeysState>()(
  persist(
    (set) => ({
      hotkeys: defaultHotkeys,
      setHotkey: (id, keys) => set((s) => ({ hotkeys: { ...s.hotkeys, [id]: keys } })),
      clearHotkey: (id) => set((s) => ({ hotkeys: { ...s.hotkeys, [id]: [] } })),
      resetAll: () => set({ hotkeys: defaultHotkeys }),
    }),
    { name: "hotkeys-storage" }
  )
);
