import type { SpeechSynthesisAdapter } from "@assistant-ui/react";
import { WebSpeechSynthesisAdapter } from "@assistant-ui/react";

export interface KokoroAdapterOptions {
  voice?: string;
  speed?: number;
  workerUrl?: URL;
  useWorker?: boolean;
}

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_SAMPLE_RATE = 24000;
const MAX_CHUNK_CHARS = 400;

function chunkText(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= maxLen) { chunks.push(sentence); continue; }
    let start = 0;
    while (start < sentence.length) {
      let end = Math.min(start + maxLen, sentence.length);
      if (end < sentence.length) {
        const lastSpace = sentence.lastIndexOf(" ", end);
        if (lastSpace > start) end = lastSpace;
      }
      chunks.push(sentence.slice(start, end));
      start = end;
    }
  }
  return chunks.map((c) => c.trim()).filter(Boolean);
}

function stripWorkingMemoryTTS(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trimStart();
  if (normalized.startsWith("# User Profile")) {
    const lines = normalized.split("\n");
    let end = 0;
    while (end < lines.length && (lines[end].trim() === "" || lines[end].trim().startsWith("#") || lines[end].trim().startsWith("- "))) end++;
    const rest = lines.slice(end).join("\n").trim();
    if (!rest) return "";
    return rest.replace(/Working Memory/gi, "").trim();
  }
  if (/Memory updated/i.test(text)) return "";
  return text;
}

type KokoroTTSInstance = Awaited<ReturnType<typeof import("kokoro-js").KokoroTTS.from_pretrained>>;
let kokoroPromise: Promise<KokoroTTSInstance> | null = null;
let kokoroLoadError: unknown = null;

async function checkWebGPU(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return false;
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    if (!gpu?.requestAdapter) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch { return false; }
}

async function getKokoroMainThread(): Promise<KokoroTTSInstance> {
  if (kokoroPromise) return kokoroPromise;
  if (kokoroLoadError) throw kokoroLoadError;
  kokoroPromise = (async () => {
    const { KokoroTTS } = await import("kokoro-js");
    const hasWebGPU = await checkWebGPU();
    if (hasWebGPU) {
      console.log(`[kokoro] trying webgpu fp32 (adapter available)`);
      try {
        const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "fp32", device: "webgpu" });
        console.log("[kokoro] model loaded via webgpu, voices:", Object.keys((tts as unknown as { voices: Record<string, unknown> }).voices).length);
        return tts;
      } catch (e) {
        console.warn("[kokoro] webgpu load failed, falling back to wasm q8", e);
      }
    } else {
      console.log(`[kokoro] no WebGPU adapter, using wasm q8`);
    }
    try {
      const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "wasm" });
      console.log("[kokoro] wasm q8 loaded, voices:", Object.keys((tts as unknown as { voices: Record<string, unknown> }).voices).length);
      return tts;
    } catch (e) {
      kokoroLoadError = e;
      throw e;
    }
  })();
  kokoroPromise.catch((e) => { kokoroLoadError = e; console.error("[kokoro] load error", e); });
  return kokoroPromise;
}

let sharedWorker: Worker | null = null;
let workerReady: Promise<void> | null = null;
function tryGetWorker(workerUrl?: URL): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (sharedWorker) return sharedWorker;
  try {
    sharedWorker = new Worker(workerUrl ?? new URL("./kokoro-tts-worker.ts", import.meta.url), { type: "module" });
    sharedWorker.addEventListener("error", (e) => console.error("[kokoro worker] error", e));
    return sharedWorker;
  } catch (e) {
    console.warn("[kokoro] Worker creation failed, falling back to main thread", e);
    return null;
  }
}
function ensureWorkerReady(workerUrl?: URL): Promise<void> | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  const worker = tryGetWorker(workerUrl);
  if (!worker) return null;
  if (!workerReady) {
    workerReady = new Promise((resolve, reject) => {
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === "ready") { worker.removeEventListener("message", onMessage); console.log("[kokoro worker] ready"); resolve(); }
        else if (e.data?.type === "load-error") { worker.removeEventListener("message", onMessage); console.error("[kokoro worker] load-error", e.data.error); reject(new Error(e.data.error)); }
      };
      worker.addEventListener("message", onMessage);
      try { worker.postMessage({ type: "init" }); } catch (err) { reject(err as Error); }
      setTimeout(() => reject(new Error("worker init timeout 30s")), 30000);
    });
    workerReady.catch((e) => console.error("[kokoro worker] init failed", e));
  }
  return workerReady;
}

let jobCounter = 0;

export class KokoroTTSAdapter implements SpeechSynthesisAdapter {
  private fallback = new WebSpeechSynthesisAdapter();
  private useWorker: boolean;
  constructor(private options: KokoroAdapterOptions = {}) {
    this.useWorker = options.useWorker ?? false;
    if (typeof window !== "undefined" && this.useWorker) {
      void ensureWorkerReady(this.options.workerUrl)?.catch(() => {});
    } else if (typeof window !== "undefined") {
      void getKokoroMainThread().catch(() => {});
    }
  }

  speak(text: string): SpeechSynthesisAdapter.Utterance {
    const filtered = stripWorkingMemoryTTS(text);
    if (!filtered.trim()) {
      let status: SpeechSynthesisAdapter.Status = { type: "ended", reason: "cancelled" } as any;
      return {
        get status() { return status; },
        cancel() {},
        subscribe() { return () => {}; },
      } as any;
    }
    text = filtered;
    if (typeof window === "undefined") {
      return this.fallback.speak(text);
    }
    if (this.useWorker) {
      const w = tryGetWorker(this.options.workerUrl);
      if (w) {
        const ready = ensureWorkerReady(this.options.workerUrl);
        if (ready) return this.speakViaWorker(text, w, ready);
        console.warn("[kokoro] worker not ready, using main thread");
      }
    }
    return this.speakViaMainThread(text);
  }

  private speakViaWorker(text: string, worker: Worker, ready: Promise<void>): SpeechSynthesisAdapter.Utterance {
    const id = `job-${++jobCounter}`;
    const subscribers = new Set<() => void>();
    let status: SpeechSynthesisAdapter.Status = { type: "starting" };
    let cancelled = false;
    let audioCtx: AudioContext | null = null;
    let nextStartTime = 0;
    let scheduledNodes: AudioBufferSourceNode[] = [];
    let pendingChunks = 0;
    let doneReceiving = false;
    const notify = () => subscribers.forEach((cb) => cb());
    const finish = (reason: "finished" | "cancelled" | "error", error?: unknown) => {
      if (status.type === "ended") return;
      status = { type: "ended", reason, error };
      if (reason === "error") console.error("[kokoro worker] finished error", error);
      notify();
    };
    const checkFullyFinished = () => { if (doneReceiving && pendingChunks === 0 && !cancelled) finish("finished"); };
    const playChunk = async (buffer: ArrayBuffer, sampleRate: number) => {
      if (cancelled) return;
      if (!audioCtx) { audioCtx = new AudioContext({ sampleRate }); nextStartTime = audioCtx.currentTime; }
      if (audioCtx.state === "suspended") await audioCtx.resume().catch(() => {});
      const pcm = new Float32Array(buffer);
      const audioBuffer = audioCtx.createBuffer(1, pcm.length, sampleRate);
      (audioBuffer as unknown as { copyToChannel: (s: Float32Array, c: number) => void }).copyToChannel(pcm as unknown as Float32Array<ArrayBuffer>, 0);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      const startAt = Math.max(nextStartTime, audioCtx.currentTime);
      source.start(startAt);
      nextStartTime = startAt + audioBuffer.duration;
      scheduledNodes.push(source);
      await new Promise<void>((resolve) => { source.onended = () => resolve(); });
    };
    const cleanup = () => worker.removeEventListener("message", onMessage);
    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || !("id" in msg) || msg.id !== id) return;
      switch (msg.type) {
        case "chunk": {
          pendingChunks += 1;
          void playChunk(msg.audio, msg.sampleRate).finally(() => { pendingChunks -= 1; checkFullyFinished(); });
          if (status.type === "starting") { status = { type: "running" }; notify(); }
          break;
        }
        case "done": doneReceiving = true; checkFullyFinished(); break;
        case "error": console.error("[kokoro worker] error", msg.error); finish("error", new Error(msg.error)); cleanup(); break;
        case "cancelled": finish("cancelled"); cleanup(); break;
      }
    };
    worker.addEventListener("message", onMessage);
    ready.then(() => {
      if (cancelled) return;
      console.log(`[kokoro worker] generate id=${id} voice=${this.options.voice ?? "af_sky"} len=${text.length}`);
      worker.postMessage({ type: "generate", id, text, voice: this.options.voice ?? "af_sky", speed: this.options.speed ?? 1 });
    }).catch((err) => {
      console.error("[kokoro worker] ensureReady failed, falling back", err);
      finish("error", err); cleanup();
    });
    return {
      get status() { return status; },
      cancel: () => {
        cancelled = true;
        try { worker.postMessage({ type: "cancel", id }); } catch {}
        scheduledNodes.forEach((n) => { try { n.stop(); } catch {} });
        scheduledNodes = []; void audioCtx?.close(); finish("cancelled"); cleanup();
      },
      subscribe: (cb) => { subscribers.add(cb); return () => subscribers.delete(cb); },
    };
  }

  private speakViaMainThread(text: string): SpeechSynthesisAdapter.Utterance {
    const subscribers = new Set<() => void>();
    let status: SpeechSynthesisAdapter.Status = { type: "starting" };
    let cancelled = false;
    let audioCtx: AudioContext | null = null;
    let nextStartTime = 0;
    let scheduledNodes: AudioBufferSourceNode[] = [];
    let pendingChunks = 0;
    let doneReceiving = false;
    const notify = () => subscribers.forEach((cb) => cb());
    const finish = (reason: "finished" | "cancelled" | "error", error?: unknown) => {
      if (status.type === "ended") return;
      status = { type: "ended", reason, error };
      if (reason === "error") console.error("[kokoro] finished error", error);
      notify();
    };
    const checkFullyFinished = () => { if (doneReceiving && pendingChunks === 0 && !cancelled) finish("finished"); };
    let fallbackCancel: (() => void) | null = null;
    const playChunk = async (pcm: Float32Array, sampleRate: number) => {
      if (cancelled) return;
      if (!audioCtx) { audioCtx = new AudioContext({ sampleRate }); nextStartTime = audioCtx.currentTime; }
      if (audioCtx.state === "suspended") await audioCtx.resume().catch(() => {});
      const audioBuffer = audioCtx.createBuffer(1, pcm.length, sampleRate);
      (audioBuffer as unknown as { copyToChannel: (s: Float32Array, c: number) => void }).copyToChannel(pcm as unknown as Float32Array<ArrayBuffer>, 0);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      const startAt = Math.max(nextStartTime, audioCtx.currentTime);
      source.start(startAt);
      nextStartTime = startAt + audioBuffer.duration;
      scheduledNodes.push(source);
      await new Promise<void>((resolve) => { source.onended = () => resolve(); });
    };

    (async () => {
      try {
        const tts = await getKokoroMainThread();
        if (cancelled) return;
        const { TextSplitterStream } = await import("kokoro-js");
        const splitter = new TextSplitterStream();
        const stream = tts.stream(splitter as unknown as string, { voice: this.options.voice as never ?? "af_sky" as never, speed: this.options.speed ?? 1 });
        const chunks = chunkText(text, MAX_CHUNK_CHARS);
        console.log(`[kokoro] main-thread generate ${chunks.length} chunks voice=${this.options.voice ?? "af_sky"}`);
        for (const c of chunks) splitter.push(c);
        splitter.close();

        let first = true;
        for await (const { audio } of stream) {
          if (cancelled) return;
          const samples: Float32Array = (audio as unknown as { data?: Float32Array; audio?: Float32Array }).data ?? (audio as unknown as { audio: Float32Array }).audio;
          if (!samples) { console.warn("[kokoro] no audio data in chunk"); continue; }
          if (first) { first = false; status = { type: "running" }; notify(); console.log("[kokoro] first chunk received", samples.length); }
          pendingChunks += 1;
          void playChunk(samples, KOKORO_SAMPLE_RATE).finally(() => { pendingChunks -= 1; checkFullyFinished(); });
        }
        doneReceiving = true;
        checkFullyFinished();
        if (pendingChunks === 0 && !cancelled) finish("finished");
        console.log("[kokoro] stream done");
      } catch (err) {
        console.error("[kokoro] main-thread error, falling back to WebSpeech", err);
        try {
          const fallbackUtt = this.fallback.speak(text);
          const unsub = (fallbackUtt as unknown as { subscribe: (cb: () => void) => () => void }).subscribe(() => {
            status = (fallbackUtt as unknown as { status: SpeechSynthesisAdapter.Status }).status as SpeechSynthesisAdapter.Status;
            notify();
          });
          status = (fallbackUtt as unknown as { status: SpeechSynthesisAdapter.Status }).status as SpeechSynthesisAdapter.Status;
          notify();
          const origCancel = (fallbackUtt as unknown as { cancel: () => void }).cancel.bind(fallbackUtt);
          fallbackCancel = () => { unsub(); origCancel(); };
        } catch (fallbackErr) {
          finish("error", err);
        }
      }
    })();

    return {
      get status() { return status; },
      cancel: () => {
        cancelled = true;
        if (fallbackCancel) { try { fallbackCancel(); } catch {} }
        scheduledNodes.forEach((n) => { try { n.stop(); } catch {} });
        scheduledNodes = []; void audioCtx?.close(); finish("cancelled");
      },
      subscribe: (cb) => { subscribers.add(cb); return () => subscribers.delete(cb); },
    };
  }
}
