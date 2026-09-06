import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sharedChat } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await db
    .select()
    .from(sharedChat)
    .where(eq(sharedChat.token, token))
    .limit(1)
    .then((r) => r[0] as any);
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (!row.isPublic) {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    if (!session?.user) return new Response(JSON.stringify({ error: "Private" }), { status: 403 });
    const isOwner = (session.user as any).id === row.ownerId;
    const isOrgMember = false;
    if (!isOwner && !isOrgMember) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  await db
    .update(sharedChat)
    .set({ viewCount: sql`${sharedChat.viewCount} + 1` } as any)
    .where(eq(sharedChat.token, token));
  let snapshot: any = [];
  try {
    snapshot = JSON.parse(row.snapshot as any);
  } catch {
    snapshot = [];
  }
  return Response.json({
    id: row.id,
    token: row.token,
    threadId: row.threadId,
    title: row.title,
    isPublic: row.isPublic,
    viewCount: (row.viewCount as number) + 1,
    createdAt: row.createdAt,
    snapshot,
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const row = await db
    .select()
    .from(sharedChat)
    .where(eq(sharedChat.token, token))
    .limit(1)
    .then((r) => r[0] as any);
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  const isOwner = (session.user as any).id === row.ownerId;
  const isAdmin = (session.user as any).role === "admin";
  if (!isOwner && !isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  await db.delete(sharedChat).where(eq(sharedChat.token, token));
  return Response.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const body = await req.json().catch(() => ({}));
  const row = await db
    .select()
    .from(sharedChat)
    .where(eq(sharedChat.token, token))
    .limit(1)
    .then((r) => r[0] as any);
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if ((session.user as any).id !== row.ownerId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  let snapshotStr: string | undefined;
  if (body.refresh) {
    try {
      const { listMessages, AGENT_ID } = await import("@/lib/mastra/memory-queries");
      const res: any = await listMessages(AGENT_ID, row.threadId, { page: 0, perPage: 200 });
      const rows = res?.messages ?? res ?? [];
      snapshotStr = JSON.stringify(Array.isArray(rows) ? rows : []);
    } catch {}
  } else if (body.snapshot) {
    snapshotStr = JSON.stringify(body.snapshot);
  } else if (body.isPublic !== undefined) {
    await db.update(sharedChat).set({ isPublic: !!body.isPublic } as any).where(eq(sharedChat.token, token));
    return Response.json({ success: true });
  }
  if (snapshotStr) {
    await db.update(sharedChat).set({ snapshot: snapshotStr } as any).where(eq(sharedChat.token, token));
  }
  return Response.json({ success: true });
}
