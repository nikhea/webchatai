"use client";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Sparkles, Shield, Database, Mic, FileText, Zap, Layers,
  Lock, Brain, Radio, GitBranch, Search, Cpu, Clock, Menu, X, Check, Star, Eye, Code2, Palette,
  MessageSquare, Workflow, KeyRound, HardDrive, Headphones, Share2, Bot, Globe, Wand2
} from "lucide-react";
import modelsData from "@/lib/models.json";

function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

function GridPattern() {
  return <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e71a_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e71a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />;
}
function Spotlight({ className, fill }: { className?: string; fill?: string }) {
  return (
    <svg className={cn("pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-20", className)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3787 2842" fill="none">
      <g filter="url(#f)"><ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501" transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill={fill || "white"} fillOpacity="0.21" /></g>
      <defs><filter id="f" x="0.86" y="0.83" width="3785" height="2840" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="a" /><feBlend mode="normal" in="SourceGraphic" in2="a" result="s" /><feGaussianBlur stdDeviation="151" result="b" /></filter></defs>
    </svg>
  );
}
function BackgroundBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0" /><stop offset="50%" stopColor="#a78bfa" stopOpacity="0.9" /><stop offset="100%" stopColor="#ec4899" stopOpacity="0" /></linearGradient></defs>
        {[...Array(5)].map((_, i) => (
          <motion.path key={i} d={`M0 ${140 + i * 110} Q400 ${100 + i * 110} 800 ${140 + i * 110} T1600 ${140 + i * 110}`} stroke="url(#g)" strokeWidth="1.2" fill="none" opacity="0.12"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5 + i * .3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * .2 }} />
        ))}
      </svg>
    </div>
  );
}

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Memory", href: "#memory" },
  { name: "Architecture", href: "#arch" },
  { name: "Stack", href: "#stack" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  return (
    <motion.nav initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .6 }}
      className={cn("fixed top-4 inset-x-0 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-full border px-5 py-2.5 transition-all",
        scrolled ? "bg-background/80 backdrop-blur-xl border-border shadow-lg" : "bg-background/60 backdrop-blur-md border-border/60")}>
      <Link href="/" className="flex items-center gap-2.5">
        <div className="size-8 rounded-xl bg-foreground text-background grid place-items-center font-black text-sm">N</div>
        <span className="font-semibold tracking-tight text-foreground">NOVA</span>
        <span className="hidden sm:inline text-[10px] tracking-[0.18em] text-muted-foreground ml-1 font-medium border border-border rounded-full px-2 py-0.5">MASTRA × assistant-ui</span>
      </Link>
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map(l => <a key={l.name} href={l.href} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{l.name}</a>)}
      </div>
      <div className="hidden md:flex items-center gap-2">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">Sign in</Link>
        <Link href="/chat" className="rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity">Enter NOVA →</Link>
      </div>
      <button onClick={() => setOpen(!open)} className="md:hidden size-8 grid place-items-center rounded-full bg-foreground text-background">{open ? <X size={14} /> : <Menu size={14} />}</button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute top-[56px] inset-x-0 mx-4 bg-background border border-border rounded-2xl p-3 md:hidden flex flex-col gap-1 shadow-xl">
          {navLinks.map(l => <a key={l.name} onClick={() => setOpen(false)} href={l.href} className="px-4 py-3 rounded-xl hover:bg-muted text-sm">{l.name}</a>)}
          <Link href="/chat" className="rounded-xl bg-foreground text-background text-center py-3 text-sm font-medium">Enter NOVA</Link>
        </motion.div>
      )}
    </motion.nav>
  );
}

function FlipWords({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % words.length), 2200); return () => clearInterval(id); }, [words.length]);
  return (
    <span className="relative inline-block h-[1.05em] overflow-hidden align-bottom min-w-[280px] sm:min-w-[360px]">
      {words.map((w, i) => (
        <motion.span key={w} initial={false} animate={{ y: i === idx ? 0 : i < idx ? -40 : 40, opacity: i === idx ? 1 : 0 }}
          transition={{ duration: .5, ease: "easeInOut" }} className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent font-black">
          {w}
        </motion.span>
      ))}
    </span>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-20">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#8b5cf6" />
      <GridPattern />
      <BackgroundBeams />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 text-center w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 backdrop-blur px-3 py-1.5 text-xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-muted-foreground">Next.js 16 + Mastra + assistant-ui</span>
          <span className="hidden sm:inline-flex items-center gap-1 ml-1 rounded-full bg-foreground text-background px-2 py-0.5 text-[11px] font-semibold">OSS <ArrowUpRight size={11} /></span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12, duration: .7 }}
          className="mt-7 text-[2.45rem] sm:text-6xl md:text-[4.4rem] font-black tracking-[-0.04em] leading-[0.88] text-foreground">
          Your private<br />
          <FlipWords words={["AI workspace", "memory engine", "voice studio", "file canvas"]} /> <br />
          that remembers.
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .28, duration: .6 }}
          className="mx-auto mt-6 max-w-2xl text-[14.5px] sm:text-[15.5px] leading-relaxed text-muted-foreground">
          Self-hosted. BYOK-encrypted. <b className="text-foreground font-semibold">120 models</b> across 23 providers. Working + observational memory with vector retrieval. Durable streams that survive disconnects. Artifacts that persist as real files. Voice with Kokoro.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .42 }}
          className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/chat" className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
            Start chatting — free <span className="grid size-6 place-items-center rounded-full bg-background text-foreground group-hover:translate-x-0.5 transition-transform"><ArrowRight size={14} /></span>
          </Link>
          <Link href="#features" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-colors">
            <Eye size={14} /> See how it works
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .65 }}
          className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Shield size={12} /> AES-GCM BYOK</span>
          <span className="hidden sm:inline h-3 w-px bg-border self-center" />
          <span className="inline-flex items-center gap-1.5"><Database size={12} /> Postgres + LibSQL + Redis</span>
          <span className="hidden sm:inline h-3 w-px bg-border self-center" />
          <span className="inline-flex items-center gap-1.5"><Headphones size={12} /> Kokoro 82M TTS</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .75, duration: .8 }}
          className="relative mx-auto mt-10 max-w-5xl rounded-[28px] border border-border bg-muted/20 p-2 backdrop-blur">
          <div className="rounded-[20px] overflow-hidden border border-border bg-card text-left">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/40">
              <span className="size-3 rounded-full bg-red-500" /><span className="size-3 rounded-full bg-yellow-500" /><span className="size-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">assistant • working-memory-personal-assistant-agent</span>
              <span className="ml-auto hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground font-mono"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> groq/openai/gpt-oss-120b • TTFT 312ms</span>
            </div>
            <div className="grid md:grid-cols-[280px_1fr] min-h-[380px]">
              <div className="hidden md:flex flex-col border-r border-border bg-muted/20 p-3 gap-2">
                <div className="rounded-xl bg-foreground text-background px-3 py-2.5 text-sm flex items-center gap-2 font-medium"><MessageSquare size={14} /> New thread <span className="ml-auto text-[10px] opacity-60">⌘⇧O</span></div>
                {[
                  { t: "Q3 launch plan", s: "Today • 12 msgs" },
                  { t: "Brand system tokens", s: "Yesterday • 8 msgs" },
                  { t: "Mastra workflow help", s: "2d ago • 23 msgs" },
                ].map(i => (
                  <div key={i.t} className="rounded-xl px-3 py-2.5 border border-transparent hover:border-border hover:bg-background">
                    <p className="text-sm font-medium text-foreground truncate">{i.t}</p><p className="text-xs text-muted-foreground">{i.s}</p>
                  </div>
                ))}
                <div className="mt-auto rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1"><Brain size={12} /> Memory updated</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-1 leading-relaxed"># User Profile • Pref: concise, visual</p>
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-background flex flex-col">
                <div className="space-y-3">
                  <div className="flex justify-end"><div className="rounded-2xl bg-foreground text-background px-4 py-2.5 text-sm max-w-[80%]">Plan my product launch in 3 phases with risks + a file artifact</div></div>
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono"><Cpu size={12} /> gpt-oss-120b • 42 tok/s • reasoning: low</div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">Here’s your <b>3-phase plan</b> — discovery → build → scale. I created <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-mono"><FileText size={11} /> launch-plan.md</span> with milestones, risks, and owners.</p>
                    <div className="mt-3 rounded-xl border border-border bg-background p-3 flex items-center justify-between">
                      <span className="text-xs font-mono flex items-center gap-2"><span className="size-6 rounded bg-foreground text-background grid place-items-center"><FileText size={12} /></span> launch-plan.md <span className="text-muted-foreground">• v1 • markdown</span></span>
                      <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Open artifact →</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <div className="rounded-2xl border border-border bg-muted/30 p-3 flex items-center gap-2">
                    <span className="hidden sm:flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-xs"><Layers size={12} /> Gemini 3 Flash</span>
                    <span className="flex-1 text-sm text-muted-foreground px-2">Ask anything... <span className="hidden sm:inline">Try “summarize this thread”</span></span>
                    <span className="size-8 rounded-full bg-foreground text-background grid place-items-center"><ArrowUpRight size={14} /></span>
                  </div>
                  <div className="mt-2 flex gap-2 text-[11px] font-mono text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Zap size={11} /> TTFT 180ms</span><span>•</span><span>42 tok/s</span><span>•</span><span className="inline-flex items-center gap-1"><Mic size={11} /> dictation on</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBar() { return null; }

const features = [
  { icon: Brain, title: "Working + Observational Memory", desc: "Resource-scoped profile (# User Profile) + thread-scoped reflection. Vector retrieval via nvidia/nemotron-3-embed-1b, temporal markers, idle reflection after 10m.", bullets: ["15 last messages + vector search", "Generates title with gpt-oss-20b", "Reflection via gemma4:31b"], color: "from-violet-500 to-purple-500" },
  { icon: KeyRound, title: "BYOK — 23 providers, 120 models", desc: "Bring your own keys. AES-256-GCM (SHA256 of BETTER_AUTH_SECRET) via iv.cipher.tag. Per-user, per-provider.", bullets: ["OpenAI, Anthropic, Gemini, Groq, Ollama...", "Custom baseURLs (Groq, OpenRouter...)", "Masked hints like sk-••••abcd"], color: "from-fuchsia-500 to-pink-500" },
  { icon: FileText, title: "Artifacts = Real Files", desc: "document tool (title, filename, content, language). Not markdown fences. Versioned, draggable, persisted to Postgres.", bullets: ["HTML iframe, CSV table, JSON, PDF", "ToolCallId unique, thread re-hydration", "Local sandbox per thread"], color: "from-blue-500 to-cyan-500" },
  { icon: Radio, title: "Durable & Resumable", desc: "DurableAgent (20 steps, RedisStreamsPubSub + RedisServerCache). Same runId resumes via /stream?runId&offset=0.", bullets: ["Survives disconnects & reloads", "Heartbeat 15s, smoothStream 20ms", "IndexedDB + sessionStorage fallback"], color: "from-emerald-500 to-teal-500" },
  { icon: Mic, title: "Voice-native", desc: "Kokoro 82M: WebGPU fp32 / WASM q8 in-browser, plus FastAPI server (/api/tts). PCM 24kHz, 400-char chunks, AudioContext scheduling.", bullets: ["af_sky voice, 1.0x speed", "Web Speech dictation + mic button", "Filters working-memory TTS"], color: "from-orange-500 to-amber-500" },
  { icon: Shield, title: "Self-hosted & Private", desc: "Postgres (better-auth + artifacts + shares) + LibSQL file (nova.db + vector.db) + Redis. Organizations, invites, sharing with view counts.", bullets: ["No vendor lock-in", "Share token snapshots (16 chars)", "PinoLogger observability"], color: "from-zinc-700 to-zinc-900" },
];

function Features() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.18em] text-violet-600 dark:text-violet-400 font-semibold uppercase flex items-center gap-2"><Sparkles size={14} /> Features</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-none text-foreground">Built for <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">builders.</span></h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">One workspace for chat, memory, files, and voice. Not a ChatGPT wrapper — a full Mastra agent with workspace sandbox, evals, and observability.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
              className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-[1px]">
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br", f.color)} />
              <div className="relative rounded-[23px] bg-card p-6 h-full text-left">
                <div className={cn("size-10 rounded-xl bg-gradient-to-br grid place-items-center text-white", f.color)}><f.icon size={18} /></div>
                <h3 className="mt-4 font-semibold text-foreground leading-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <ul className="mt-3 space-y-1.5">
                  {f.bullets.map(b => <li key={b} className="text-xs text-muted-foreground flex gap-1.5"><Check size={12} className="mt-0.5 text-emerald-600 shrink-0" /> {b}</li>)}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-[24px] border border-border bg-foreground text-background p-7 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 size-64 rounded-full bg-white/10 blur-3xl" />
            <p className="relative text-xs tracking-widest uppercase opacity-60">Composer superpowers</p>
            <h3 className="relative mt-2 text-xl font-bold">Slash commands, @mentions, context rail</h3>
            <p className="relative mt-2 text-sm opacity-70 max-w-lg">/clear /summarize /branch /help • @thread mentions • Token rail (TTFT + tok/s) • Model picker with caps icons (vision/tool/reasoning/fast) • Web search toggle.</p>
            <div className="relative mt-4 flex flex-wrap gap-2 text-xs font-mono"><span className="rounded-full bg-background text-foreground px-3 py-1">Ctrl+K search</span><span className="rounded-full bg-white/10 border border-white/15 px-3 py-1">Ctrl+B sidebar</span><span className="rounded-full bg-white/10 border border-white/15 px-3 py-1">Ctrl+/ model</span></div>
          </div>
          <div className="rounded-[24px] border border-border bg-card p-6 flex flex-col justify-between">
            <div><p className="text-4xl font-black tracking-tight text-foreground">~120</p><p className="text-sm text-muted-foreground">models ready. Switch in the composer — no redeploy.</p></div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><HardDrive size={14} /> Favorites: Gemini 3 Flash • 3.5 Flash-Lite</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MemoryDeep() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { k: "Working memory", icon: Brain, code: `# User Profile\n\n## Personal\n- Name: Alex\n- Timezone: Asia/Kolkata\n\n## Preferences\n- Style: concise, visual\n- Goal: ship MVP in 4 weeks\n\n## Session\n- Last task: launch plan\n- Open Q: pricing?` },
    { k: "Observational", icon: Eye, code: `observationalMemory: {\n  model: "ollama-cloud/gemma4:31b",\n  scope: "thread",\n  temporalMarkers: true,\n  activateOnProviderChange: true,\n  reflection: { activateAfterIdle: "10m" },\n  retrieval: { vector: true, scope: "resource" }\n}` },
    { k: "Artifacts", icon: FileText, code: `// document tool (critical)\nawait document({\n  title: "Q3 Report",\n  filename: "report.md",\n  content: fullFileString, // never array\n  language: "markdown"\n})\n// persists to Postgres + re-hydrates\n// + workspace FS per thread` },
    { k: "Durable", icon: Workflow, code: `DurableAgent({ maxSteps: 20,\n  cleanup: "5m", cache: redisCache,\n  pubsub: redisPubSub })\n.stream(prompt, {\n  runId: "chatId:messageId",\n  smoothStream: { chunking: "word", delayInMs: 20 }\n})` },
  ];
  return (
    <section id="memory" className="bg-muted/30 border-y border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[420px_1fr] gap-8 items-start">
          <div>
            <p className="text-xs tracking-[0.18em] text-violet-600 dark:text-violet-400 font-semibold uppercase">Deep dive</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight leading-none text-foreground">Memory, files, <br /><span className="text-muted-foreground">and streams.</span></h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Tap a tab to see the actual implementation. Everything is wired — not mocked.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {tabs.map((t, i) => (
                <button key={t.k} onClick={() => setTab(i)} className={cn("rounded-2xl border px-3 py-3 text-left flex items-center gap-2 text-sm font-medium transition-colors", i === tab ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted")}>
                  <t.icon size={14} /> {t.k}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"><Cpu size={12} /> TokenUsageProcessor</p>
              <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-1">Measures TTFT + tok/s (decode-only) + per-step modelId. Surfaced in the composer rail.</p>
            </div>
          </div>
          <div className="rounded-[20px] border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/40">
              <span className="size-2.5 rounded-full bg-red-500" /><span className="size-2.5 rounded-full bg-yellow-500" /><span className="size-2.5 rounded-full bg-green-500" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">{tabs[tab].k}.ts</span>
              <span className="ml-auto text-[11px] font-mono text-muted-foreground">src/mastra/•</span>
            </div>
            <pre className="p-5 text-xs leading-relaxed font-mono text-foreground overflow-x-auto whitespace-pre-wrap">{tabs[tab].code}</pre>
            <div className="border-t border-border px-4 py-3 bg-muted/20 flex gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1 font-mono"><Database size={12} /> LibSQLVector</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1 font-mono"><GitBranch size={12} /> branch @ message</span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1 font-mono"><Search size={12} /> vector: true</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const providerGradients: Record<string, string> = {
  openai: "from-zinc-900 to-zinc-700", anthropic: "from-orange-600 to-amber-600", gemini: "from-blue-600 to-sky-500",
  meta: "from-blue-700 to-indigo-600", deepseek: "from-slate-800 to-slate-600", mistral: "from-orange-500 to-red-500",
  xai: "from-zinc-900 to-black", perplexity: "from-cyan-600 to-teal-600", groq: "from-orange-600 to-red-600",
  together: "from-violet-600 to-indigo-600", fireworks: "from-red-600 to-orange-500", huggingface: "from-yellow-500 to-amber-500",
  cerebras: "from-zinc-800 to-zinc-600", cloudflare: "from-orange-500 to-amber-500", moonshot: "from-slate-900 to-violet-800",
  "zai": "from-violet-700 to-fuchsia-600", siliconflow: "from-indigo-600 to-violet-600", upstage: "from-emerald-600 to-teal-600",
  openrouter: "from-zinc-700 to-zinc-900", deepinfra: "from-emerald-700 to-green-600", ollama: "from-zinc-800 to-black",
};

function ProvidersMarquee() {
  const providers = (modelsData as any).providers.filter((p: any) => p.id !== "favorites");
  return (
    <section className="bg-background border-y border-border py-10 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-xs tracking-[0.18em] text-muted-foreground font-semibold uppercase flex items-center gap-2"><Globe size={12} /> Model providers — switch live in the composer, BYOK encrypted</p>
          <span className="hidden sm:inline text-xs text-muted-foreground font-mono">23 providers • ~120 models</span>
        </div>
      </div>
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div className="flex gap-4 shrink-0 pr-4" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
          {[...providers, ...providers].map((p: any, i: number) => (
            <div key={`${p.id}-${i}`} className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shrink-0 shadow-sm">
              <div className={cn("size-8 rounded-full bg-gradient-to-br grid place-items-center text-white text-[11px] font-black shrink-0", providerGradients[p.id] || "from-zinc-700 to-zinc-900")}>
                {p.label.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{p.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] mt-3">
        <motion.div className="flex gap-4 shrink-0 pr-4" animate={{ x: ["-50%", "0%"] }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }}>
          {[...providers.slice().reverse(), ...providers.slice().reverse()].map((p: any, i: number) => (
            <div key={`${p.id}-r-${i}`} className="flex items-center gap-3 rounded-full border border-border bg-muted/50 px-4 py-2.5 shrink-0">
              <div className={cn("size-7 rounded-full bg-gradient-to-br grid place-items-center text-white text-[10px] font-black", providerGradients[p.id] || "from-zinc-700 to-zinc-900")}>
                {p.label[0]}
              </div>
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{p.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Comparison() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight text-foreground">Not a ChatGPT clone.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Why teams self-host this instead of paying per-seat.</p>
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-widest">
              <tr><th className="text-left px-4 py-3 font-medium">Capability</th><th className="text-left px-4 py-3 font-medium">This workspace</th><th className="text-left px-4 py-3 font-medium">Typical SaaS</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Data ownership", "Postgres + LibSQL files on your infra", "Vendor-hosted, export pain"],
                ["Models", "120 models, 23 providers, switch live", "1–2 models, locked"],
                ["Memory", "Working + observational + vector + idle reflection", "Last N messages"],
                ["Files", "Real artifacts (HTML/CSV/JSON/PDF) versioned", "Markdown fences, lost on refresh"],
                ["Voice", "Kokoro 82M local/server + dictation", "No TTS or cloud-only"],
                ["Streams", "Durable, resumable via runId + Redis", "Lost on disconnect"],
                ["Cost", "BYOK — pay provider directly", "Per-seat + markup"],
              ].map(([a, b, c]) => (
                <tr key={a} className="bg-card"><td className="px-4 py-3 font-medium text-foreground">{a}</td><td className="px-4 py-3 text-foreground flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> {b}</td><td className="px-4 py-3 text-muted-foreground">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Arch() {
  const steps = [
    { n: "01", t: "Chat", d: "assistant-ui thread + composer (attachments, @mentions, /slash, web search, model picker). TanStack Query + IndexedDB persistence." },
    { n: "02", t: "Agent", d: "workingMemoryPersonalAssistantAgent (Mastra) — workspace sandbox per thread, tools: document + weather + web_fetch, 100 steps." },
    { n: "03", t: "Memory & Stream", d: "LibSQL + vector (nemotron-3-embed-1b) + DurableAgent + RedisStreamsPubSub. Resumable streams, TTFT telemetry." },
  ];
  return (
    <section id="arch" className="bg-muted/20 border-y border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[420px_1fr] gap-8">
          <div>
            <p className="text-xs tracking-[0.18em] text-violet-600 dark:text-violet-400 font-semibold uppercase">Architecture</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight leading-none text-foreground">From prompt <br />to artifact — <br /><span className="text-muted-foreground">in one stream.</span></h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Secure middleware, isolated workspaces, and observable execution. Every thread is a sandbox.</p>
            <div className="mt-5 rounded-2xl border border-border bg-card p-4 font-mono text-xs">
              <p className="text-muted-foreground">Quick start</p>
              <p className="mt-2 bg-muted rounded-lg px-3 py-2">npm run dev <span className="text-muted-foreground">— http://localhost:3000</span></p>
              <p className="mt-2 bg-muted rounded-lg px-3 py-2">DATABASE_URL=postgresql://.../nova</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-violet-500 via-fuchsia-500 to-transparent hidden sm:block" />
            <div className="space-y-4">
              {steps.map(s => (
                <div key={s.n} className="relative flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="hidden sm:grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background font-bold text-sm">{s.n}</div>
                  <div><h3 className="font-semibold text-foreground">{s.t}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-card p-4 flex flex-wrap gap-2 text-xs font-mono">
              <span className="rounded-full bg-muted px-3 py-1">better-auth + orgs</span><span className="rounded-full bg-muted px-3 py-1">share token 16-char</span><span className="rounded-full bg-muted px-3 py-1">PinoLogger tracing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const groups = [
    {
      label: "Frontend", icon: Palette, color: "from-violet-600 to-indigo-600",
      items: [
        { name: "Next.js 16.3", meta: "Turbopack", icon: "▲" },
        { name: "React 19.2", meta: "RSC + Actions", icon: "⚛" },
        { name: "Tailwind 4.3", meta: "CSS-first", icon: "◈" },
        { name: "shadcn base-nova", meta: "zinc", icon: "⬢" },
      ],
    },
    {
      label: "Motion & Type", icon: Sparkles, color: "from-fuchsia-600 to-pink-600",
      items: [
        { name: "Inter", meta: "font-sans", icon: "Aa" },
        { name: "IBM Plex Mono", meta: "font-mono", icon: "Aa" },
        { name: "motion 13.2", meta: "Framer", icon: "◐" },
        { name: "--radius 0.625rem", meta: "oklch zinc", icon: "⬣" },
      ],
    },
    {
      label: "AI & Data", icon: Database, color: "from-emerald-600 to-teal-600",
      items: [
        { name: "Mastra 1.27", meta: "+ memory 1.28", icon: "◆" },
        { name: "Drizzle 0.45", meta: "+ pg", icon: "⬡" },
        { name: "ioredis 6", meta: "Streams + Cache", icon: "⬢" },
        { name: "LibSQL", meta: "vector + file", icon: "⬔" },
      ],
    },
  ];
  return (
    <section id="stack" className="relative overflow-hidden bg-background py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground font-semibold uppercase flex items-center gap-2"><Layers size={12} /> Stack & design system</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-foreground">Production stack, <span className="text-muted-foreground">pixel-perfect.</span></h2>
          </div>
          <p className="text-xs font-mono text-muted-foreground hidden sm:block">--radius 0.625rem • --font-sans Inter • oklch zinc • base-nova</p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.label} className="group relative rounded-[20px] border border-border bg-card p-4 hover:shadow-lg hover:border-foreground/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("size-7 rounded-lg bg-gradient-to-br grid place-items-center text-white", g.color)}><g.icon size={12} /></div>
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{g.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.items.map((it) => (
                  <div key={it.name} className="rounded-xl border border-border bg-muted/40 group-hover:bg-background p-3 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className="size-6 rounded-md bg-foreground text-background grid place-items-center text-[10px] font-bold shrink-0">{it.icon}</span>
                      <span className="text-xs font-semibold leading-none truncate text-foreground">{it.name}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-mono text-muted-foreground">{it.meta}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex-1 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 font-medium"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> All wired — not mocked</span>
            <span className="hidden sm:inline h-3 w-px bg-border" />
            <span>assistant-ui • Mastra • better-auth • PinoLogger</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/signup" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
              Enter NOVA <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MovingBorder({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative p-[1px] rounded-full overflow-hidden", className)}>
      <motion.div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ scale: 1.4 }} />
      <div className="relative rounded-full bg-foreground">{children}</div>
    </div>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      <GridPattern />
      <BackgroundBeams />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="relative rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-1">
          <div className="rounded-[28px] bg-zinc-900/80 backdrop-blur p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-80 rounded-full bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-600/20 blur-3xl" />
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Self-host in minutes • No lock-in
              </div>
              <h2 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-[0.9] text-white">
                Your data.<br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Your models.</span><br />
                Your workspace.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">Open-source. Bring your keys, keep your memory. Postgres + Redis for durable streams. Works offline with Ollama.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <MovingBorder>
                  <Link href="/signup" className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors">
                    Create account — free <ArrowRight size={14} />
                  </Link>
                </MovingBorder>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-7 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                  Sign in <ArrowUpRight size={14} />
                </Link>
              </div>
              <p className="mt-4 text-xs text-zinc-500">No credit card • BYOK encrypted • <Link href="/chat" className="underline decoration-white/20 hover:text-white">Enter NOVA directly →</Link></p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-violet-500/20">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <MemoryDeep />
      <ProvidersMarquee />
      <Comparison />
      <Arch />
      <Stack />
      <CTA />
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 NOVA</span>
          <span className="flex gap-4"><Link href="/login" className="hover:text-foreground">Login</Link><Link href="/signup" className="hover:text-foreground">Signup</Link><Link href="/chat" className="hover:text-foreground">Enter NOVA</Link></span>
        </div>
      </footer>
    </div>
  );
}
