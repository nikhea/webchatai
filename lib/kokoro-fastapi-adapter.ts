import type { SpeechSynthesisAdapter } from "@assistant-ui/react";

export interface KokoroFastAPIOptions {
  baseUrl: string;
  path?: string;
  voice?: string;
  speed?: number;
  model?: string;
  headers?: Record<string, string>;
}

const SAMPLE_RATE = 24000;
const BYTES_PER_SAMPLE = 2;

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

export class KokoroFastAPIAdapter implements SpeechSynthesisAdapter {
  constructor(private options: KokoroFastAPIOptions) {}

  speak(text: string): SpeechSynthesisAdapter.Utterance {
    const filtered = stripWorkingMemoryTTS(text);
    if (!filtered.trim()) {
      let status: SpeechSynthesisAdapter.Status = { type: "ended", reason: "cancelled" };
      return {
        get status() { return status; },
        cancel() {},
        subscribe() { return () => {}; },
      };
    }
    text = filtered;
    const subscribers = new Set<() => void>();
    let status: SpeechSynthesisAdapter.Status = { type: "starting" };
    const controller = new AbortController();
    let audioCtx: AudioContext | null = null;
    let nextStartTime = 0;
    let scheduledNodes: AudioBufferSourceNode[] = [];
    let pendingNodes = 0;
    let streamDone = false;
    let leftoverByte: number | null = null;
    const notify = () => subscribers.forEach((cb) => cb());
    const finish = (reason: "finished" | "cancelled" | "error", error?: unknown) => {
      if (status.type === "ended") return;
      status = { type: "ended", reason, error };
      notify();
    };
    const checkFullyFinished = () => {
      if (streamDone && pendingNodes === 0) finish("finished");
    };
    const playChunk = (pcmBytes: Uint8Array): Promise<void> => {
      let bytes = pcmBytes;
      if (leftoverByte !== null) {
        const merged = new Uint8Array(bytes.length + 1);
        merged[0] = leftoverByte;
        merged.set(bytes, 1);
        bytes = merged;
        leftoverByte = null;
      }
      if (bytes.length % BYTES_PER_SAMPLE !== 0) {
        leftoverByte = bytes[bytes.length - 1];
        bytes = bytes.slice(0, bytes.length - 1);
      }
      if (bytes.length === 0) return Promise.resolve();
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const sampleCount = bytes.length / BYTES_PER_SAMPLE;
      const floatSamples = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        floatSamples[i] = view.getInt16(i * BYTES_PER_SAMPLE, true) / 32768;
      }
      if (!audioCtx) {
        audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
        nextStartTime = audioCtx.currentTime;
      }
      const audioBuffer = audioCtx.createBuffer(1, floatSamples.length, SAMPLE_RATE);
      audioBuffer.copyToChannel(floatSamples, 0);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      const startAt = Math.max(nextStartTime, audioCtx.currentTime);
      source.start(startAt);
      nextStartTime = startAt + audioBuffer.duration;
      scheduledNodes.push(source);
      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    };
    (async () => {
      try {
        const res = await fetch(`${this.options.baseUrl}${this.options.path ?? "/v1/audio/speech"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...this.options.headers },
          body: JSON.stringify({
            model: this.options.model ?? "kokoro",
            input: text,
            voice: this.options.voice ?? "af_bella",
            response_format: "pcm",
            speed: this.options.speed ?? 1,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => res.statusText);
          throw new Error(`Kokoro-FastAPI request failed (${res.status}): ${detail}`);
        }
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          if (status.type === "starting") {
            status = { type: "running" };
            notify();
          }
          pendingNodes += 1;
          void playChunk(value).finally(() => {
            pendingNodes -= 1;
            checkFullyFinished();
          });
        }
        streamDone = true;
        checkFullyFinished();
      } catch (err) {
        if (controller.signal.aborted) finish("cancelled");
        else finish("error", err);
      }
    })();
    return {
      get status() {
        return status;
      },
      cancel: () => {
        controller.abort();
        scheduledNodes.forEach((n) => {
          try {
            n.stop();
          } catch {}
        });
        scheduledNodes = [];
        void audioCtx?.close();
        finish("cancelled");
      },
      subscribe: (cb) => {
        subscribers.add(cb);
        return () => subscribers.delete(cb);
      },
    };
  }
}
