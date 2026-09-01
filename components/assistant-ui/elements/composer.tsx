"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { FC, PropsWithChildren } from "react";

export type ComposerModel = { name: string; meta?: string };

export const ComposerModelTrigger: FC<{
  model: string;
  open: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ model, open, onClick, className }) => (
  <button
    type="button"
    aria-expanded={open}
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors",
      className,
    )}
  >
    {model}
    <ChevronDownIcon className={cn("size-3 transition-transform", open && "rotate-180")} />
  </button>
);

export const ComposerMenu: FC<
  PropsWithChildren<{ open: boolean; align?: "start" | "end"; className?: string }>
> = ({ open, align = "start", className, children }) => (
  <div
    data-slot="composer-menu"
    data-open={open ? "" : undefined}
    className={cn(
      "absolute bottom-full z-50 mb-2 min-w-52 rounded-xl border bg-popover p-1 shadow-md transition-all",
      align === "end" ? "end-0" : "start-0",
      open ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-1",
      className,
    )}
  >
    {children}
  </div>
);

export const ComposerModelItem: FC<{
  entry: ComposerModel;
  selected: boolean;
  onClick?: () => void;
}> = ({ entry, selected, onClick }) => (
  <button
    type="button"
    data-slot="composer-menu-item"
    data-active={selected ? "" : undefined}
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent data-[active]:bg-accent transition-colors text-start"
  >
    <span className="font-medium">{entry.name}</span>
    <span className="flex items-center gap-2">
      {entry.meta && <span className="text-muted-foreground text-xs tabular-nums">{entry.meta}</span>}
      <span className={cn("grid place-items-center transition-all", selected ? "opacity-100 scale-100" : "opacity-0 scale-75")}>
        <CheckIcon className="size-3.5" />
      </span>
    </span>
  </button>
);

export const ComposerContext: FC<{
  usage: { system: number; tools: number; messages: number; total: number };
  className?: string;
}> = ({ usage, className }) => {
  const { system, tools, messages, total } = usage;
  const used = system + tools + messages;
  const pct = total > 0 ? Math.min(1, used / total) : 0;
  const isOver = pct > 0.85;
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div data-slot="composer-context" className={cn("relative group flex items-center", className)}>
      <div className="absolute bottom-full end-0 z-50 mb-2 hidden w-56 rounded-xl border bg-popover p-3 shadow-md group-hover:block group-focus-within:block group-hover:pointer-events-auto">
        <div className="mb-2 text-xs font-medium">Context usage</div>
        <div className="mb-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-sky-500" style={{ width: `${total ? (system / total) * 100 : 0}%` }} />
          <div className="bg-sky-500/70" style={{ width: `${total ? (tools / total) * 100 : 0}%` }} />
          <div className="bg-sky-500/40" style={{ width: `${total ? (messages / total) * 100 : 0}%` }} />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">System</span><span className="tabular-nums">{system}k</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tools</span><span className="tabular-nums">{tools}k</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Messages</span><span className="tabular-nums">{messages}k</span></div>
          <div className="border-t pt-1 flex justify-between font-medium"><span>Total</span><span className="tabular-nums">{used}k / {total}k</span></div>
          <div className={cn("text-xs", isOver ? "text-destructive" : "text-muted-foreground")}>{Math.round(pct * 100)}% used</div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Context usage"
        className={cn(
          "relative grid size-8 place-items-center rounded-full border bg-background",
          isOver && "border-destructive text-destructive",
        )}
      >
        <svg width={32} height={32} viewBox="0 0 32 32" className="-rotate-90">
          <circle cx={16} cy={16} r={r} fill="none" strokeWidth={3} className="stroke-muted" />
          <circle
            cx={16}
            cy={16}
            r={r}
            fill="none"
            strokeWidth={3}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(isOver ? "stroke-destructive" : "stroke-sky-500")}
          />
        </svg>
        <span className={cn("absolute text-[9px] font-bold tabular-nums", isOver && "text-destructive")}>
          {Math.round(pct * 100)}%
        </span>
      </button>
    </div>
  );
};
