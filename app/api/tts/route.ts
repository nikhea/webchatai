import { NextRequest } from "next/server";

const KOKORO_BASE_URL = process.env.KOKORO_BASE_URL ?? "http://localhost:8880";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${KOKORO_BASE_URL}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => upstream.statusText);
    return new Response(detail, { status: upstream.status });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "audio/pcm",
      "Cache-Control": "no-cache",
    },
  });
}
