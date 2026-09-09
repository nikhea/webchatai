import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertArtifact, listArtifactsByThread } from "@/lib/db/artifact";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });
  const rows = await listArtifactsByThread(threadId);
  return NextResponse.json({ artifacts: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { threadId, toolCallId, title, filename, content, language } = body ?? {};
  if (!threadId || !toolCallId || !title || !filename || content == null) {
    return NextResponse.json({ error: "threadId, toolCallId, title, filename, content required" }, { status: 400 });
  }
  const session: any = await (auth as any).api.getSession({ headers: req.headers as any }).catch(() => null);
  const userId = session?.user?.id ?? session?.data?.user?.id ?? null;
  const row = await upsertArtifact({ threadId, toolCallId, userId, title, filename, content: String(content), language: language ?? null });
  return NextResponse.json({ artifact: row });
}
