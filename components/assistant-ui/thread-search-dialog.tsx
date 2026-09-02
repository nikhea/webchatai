"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useAui } from "@assistant-ui/react";
import { MessageSquareIcon, SearchIcon, XIcon, CornerUpLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThreadSearch } from "@/app/queries/memory.query";
import { RESOURCE_ID_KEY, AGENT_ID } from "@/lib/mastra/memory-queries";

const DAY_IN_MS = 86_400_000;

function dateLabel(date: Date | undefined, startOfToday: number): string {
  if (!date) return "";
  const t = date.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - DAY_IN_MS) return "Yesterday";
  if (t >= startOfToday - 7 * DAY_IN_MS) return "Past week";
  return date.toLocaleDateString();
}

export function ThreadSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const aui = useAui();
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);
  const infinite = useThreadSearch(RESOURCE_ID_KEY, AGENT_ID, debounced, 12);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !infinite.hasNextPage || infinite.isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) infinite.fetchNextPage();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [infinite.hasNextPage, infinite.isFetchingNextPage, infinite]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const pages = infinite.data?.pages ?? [];
  const flat: any[] = pages.flatMap((p: any) => (Array.isArray(p) ? p : (p as any)?.threads ?? (p as any)?.data ?? []));
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const list = flat.map((t: any) => ({
    id: t.id,
    title: t.title || "New Chat",
    date: t.updatedAt ? new Date(t.updatedAt) : t.createdAt ? new Date(t.createdAt) : undefined,
  }));
  const sorted = [...list].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  const withLabel = sorted.map((t) => ({ ...t, label: dateLabel(t.date, startOfToday) }));
  const isLoading = infinite.isLoading;

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 pt-[6%] backdrop-blur-[1px]" onClick={() => onOpenChange(false)}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[70vh] w-[min(820px,92%)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <SearchIcon className="size-4 shrink-0 text-zinc-500" />
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats and projects" className="h-7 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0" />
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="grid size-6 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2 [scrollbar-width:thin]">
          {isLoading ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">Loading...</div>
          ) : withLabel.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">No chats found</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {withLabel.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const auiAny = aui as unknown as { threads: { switchToThread: (id: string) => void } };
                    auiAny.threads.switchToThread(t.id);
                    onOpenChange(false);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800", idx === 0 && debounced === "" && "bg-zinc-800")}
                >
                  <MessageSquareIcon className="size-4 shrink-0 text-zinc-500" />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  {idx === 0 && debounced === "" ? <CornerUpLeftIcon className="size-3.5 shrink-0 text-zinc-500" /> : <span className="shrink-0 text-xs text-zinc-500">{t.label}</span>}
                </button>
              ))}
              <div ref={sentinelRef} className="h-1" />
              {infinite.isFetchingNextPage && <div className="px-3 py-2 text-center text-xs text-zinc-500">Loading more…</div>}
              {!infinite.hasNextPage && withLabel.length > 0 && <div className="px-3 py-2 text-center text-xs text-zinc-600">No more results</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
