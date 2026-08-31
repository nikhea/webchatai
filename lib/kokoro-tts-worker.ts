/// <reference lib="webworker" />

/**
 * Kokoro TTS worker.
 *
 * Runs model load + inference off the main thread so long assistant
 * messages don't jank the UI. Text is streamed through kokoro-js's
 * TextSplitterStream, which splits on sentence boundaries and enforces
 * MAX_CHUNK_CHARS — this keeps every individual synthesis call comfortably
 * inside Kokoro's effective phoneme/context window (long unsplit input
 * degrades quality and can silently truncate), and lets audio start
 * playing after the first sentence instead of waiting for the whole
 * message to finish generating.
 */

import { KokoroTTS, TextSplitterStream } from "kokoro-js";

type InMessage =
  | { type: "init" }
  | { type: "generate"; id: string; text: string; voice: string; speed?: number }
  | { type: "cancel"; id: string };

type OutMessage =
  | { type: "ready" }
  | { type: "load-error"; error: string }
  | { type: "chunk"; id: string; audio: ArrayBuffer; sampleRate: number; index: number }
  | { type: "done"; id: string }
  | { type: "error"; id: string; error: string }
  | { type: "cancelled"; id: string };

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const KOKORO_SAMPLE_RATE = 24000;

const MAX_CHUNK_CHARS = 400;

let ttsPromise: ReturnType<typeof KokoroTTS.from_pretrained> | null = null;

const activeJobs = new Set<string>();

function chunkText(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= maxLen) {
      chunks.push(sentence);
      continue;
    }
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

function post(msg: OutMessage, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(msg, transfer);
}

async function checkWebGPU(): Promise<boolean> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    if (!gpu?.requestAdapter) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch { return false; }
}

async function getTTS() {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const hasWebGPU = await checkWebGPU();
      if (hasWebGPU) {
        try {
          return await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "fp32", device: "webgpu" });
        } catch (e) {
          console.warn("[kokoro worker] webgpu failed, falling back to wasm", e);
        }
      }
      return KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "wasm" });
    })();
  }
  return ttsPromise;
}

self.onmessage = async (event: MessageEvent<InMessage>) => {
  const msg = event.data;

  if (msg.type === "init") {
    try {
      await getTTS();
      post({ type: "ready" });
    } catch (err) {
      post({ type: "load-error", error: String(err) });
    }
    return;
  }

  if (msg.type === "cancel") {
    activeJobs.delete(msg.id);
    return;
  }

  if (msg.type === "generate") {
    const { id, text, voice, speed } = msg;
    activeJobs.add(id);

    try {
      const tts = await getTTS();

      const splitter = new TextSplitterStream();
      const stream = tts.stream(splitter, {
        voice: voice as Parameters<typeof tts.stream>[1] extends { voice?: infer V } ? V : never,
        speed: speed ?? 1,
      });

      for (const chunk of chunkText(text, MAX_CHUNK_CHARS)) {
        splitter.push(chunk);
      }
      splitter.close();

      let index = 0;
      for await (const { audio } of stream) {
        if (!activeJobs.has(id)) {
          post({ type: "cancelled", id });
          return;
        }

        const samples: Float32Array = (audio as unknown as { data?: Float32Array; audio?: Float32Array }).data ?? (audio as unknown as { audio: Float32Array }).audio;
        const buffer = (samples.buffer as ArrayBuffer).slice(
          samples.byteOffset,
          samples.byteOffset + samples.byteLength,
        );

        post(
          { type: "chunk", id, audio: buffer, sampleRate: KOKORO_SAMPLE_RATE, index },
          [buffer],
        );
        index += 1;
      }

      if (activeJobs.has(id)) {
        post({ type: "done", id });
      }
    } catch (err) {
      post({ type: "error", id, error: String(err) });
    } finally {
      activeJobs.delete(id);
    }
  }
};
