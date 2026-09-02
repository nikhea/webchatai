import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterIcon, LayoutGridIcon, LayoutListIcon, EyeIcon, EyeOffIcon, StarIcon, SparklesIcon } from "lucide-react";

const models = [
  { name: "Claude", sub: "Fable 5.1", price: "$$$ -", accent: "ring-pink-600", new: true, icon: "AI" },
  { name: "Qwen", sub: "3 32B", price: "· · ·", icon: "Q" },
  { name: "Qwen", sub: "3 235B", price: "· · ·", icon: "Q" },
  { name: "Qwen", sub: "3 Coder", price: "$ ·", icon: "Q" },
  { name: "Qwen", sub: "3.6 27B", price: "$ ·", icon: "Q" },
  { name: "Qwen", sub: "3.6 35B A3B", price: "$ ·", icon: "Q" },
  { name: "Qwen", sub: "3.8 27B", price: "$$ ·", icon: "Q" },
  { name: "Claude", sub: "Sonnet 4.5", price: "$$$", icon: "AI" },
  { name: "Claude", sub: "Sonnet 4.6", price: "$$$", icon: "AI" },
  { name: "Claude", sub: "Sonnet 5", price: "$$$", icon: "AI" },
  { name: "Claude", sub: "4.1 Opus", price: "BYOK", icon: "AI" },
  { name: "Claude", sub: "Haiku 4.5", price: "$$ ·", icon: "AI" },
  { name: "Claude", sub: "Opus 4.5", price: "$$$+", icon: "AI" },
  { name: "Claude", sub: "Opus 4.6", price: "$$$+", icon: "AI" },
  { name: "Claude", sub: "Opus 4.7", price: "$$$ -", icon: "AI" },
  { name: "Claude", sub: "Opus 4.8", price: "$$$ -", icon: "AI" },
  { name: "Claude", sub: "Opus 5", price: "$$$+", icon: "AI" },
  { name: "Claude", sub: "Fable 5", price: "$$$+", icon: "AI" },
  { name: "DeepSeek", sub: "v3 (0324)", price: "$ · -", icon: "DS" },
  { name: "DeepSeek", sub: "v3.1", price: "$ · -", icon: "DS" },
  { name: "DeepSeek", sub: "v3.1 Terminus", price: "$ · -", icon: "DS" },
  { name: "DeepSeek", sub: "v3.2", price: "...", icon: "DS" },
  { name: "DeepSeek", sub: "v4 Flash", price: "...", icon: "DS" },
  { name: "DeepSeek", sub: "v4 Flash (0731)", price: "", icon: "DS" },
  { name: "DeepSeek", sub: "v4 Pro", price: "$$ ·", icon: "DS" },
  { name: "DeepSeek", sub: "v4 Pro (0813)", price: "$$ ·", icon: "DS" },
  { name: "DeepSeek", sub: "R1 (0528)", price: "$$ ·", icon: "DS" },
  { name: "Gemini", sub: "2.5 Flash", price: "$ · -", icon: "G", starred: true },
];

export default function ModelsPage() {
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

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search models..." className="h-9 bg-zinc-900 pl-9 placeholder:text-zinc-500" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 border-zinc-800 bg-zinc-900">
          <FilterIcon className="size-4" /> Filter
        </Button>
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"><LayoutListIcon className="size-4" /></button>
          <button className="rounded bg-zinc-800 p-1.5 text-zinc-100"><LayoutGridIcon className="size-4" /></button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {models.map((m, i) => (
          <div
            key={i}
            className={`relative flex flex-col items-center rounded-xl border bg-zinc-900 p-4 text-center ${m.new ? "border-pink-600/50 ring-1 ring-pink-600/30" : "border-zinc-800"}`}
          >
            {m.new && <span className="absolute right-2 top-2 text-[9px] font-bold text-pink-500">NEW</span>}
            {m.starred && <StarIcon className="absolute right-2 top-2 size-3 fill-amber-400 text-amber-400" />}
            <div className="grid size-8 place-items-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">{m.icon}</div>
            <div className="mt-2 text-sm font-medium leading-none">{m.name}</div>
            <div className="text-xs text-zinc-400">{m.sub}</div>
            <div className={`mt-2 text-[10px] ${m.price.includes("$$$") ? "text-red-400" : m.price.includes("$$") ? "text-amber-400" : "text-emerald-400"}`}>{m.price || "· · ·"}</div>
            <div className="mt-3 flex gap-1.5">
              <span className="grid size-5 place-items-center rounded bg-zinc-800 text-zinc-500"><EyeIcon className="size-3" /></span>
              <span className="grid size-5 place-items-center rounded bg-zinc-800 text-zinc-500"><EyeOffIcon className="size-3" /></span>
              <span className="grid size-5 place-items-center rounded bg-zinc-800 text-zinc-500"><LayoutGridIcon className="size-3" /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
