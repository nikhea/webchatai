import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sharedChat } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { threadId, title, isPublic = true, organizationId, snapshot: providedSnapshot } = body;
  if (!threadId) return new Response(JSON.stringify({ error: "threadId required" }), { status: 400 });

  let snapshot = providedSnapshot;
  if (!snapshot) {
    try {
      const { listMessages } = await import("@/lib/mastra/memory-queries");
      const { AGENT_ID } = await import("@/lib/mastra/memory-queries");
      const res: any = await listMessages(AGENT_ID, threadId, { page: 0, perPage: 200 });
      const rows = res?.messages ?? res ?? [];
      snapshot = Array.isArray(rows) ? rows : [];
    } catch {
      snapshot = [];
    }
  }
  const token = genToken();
  const snapshotStr = JSON.stringify(snapshot);
  const titleVal = title || `Shared chat ${new Date().toLocaleDateString()}`;
  const id = crypto.randomUUID();

  await db.insert(sharedChat).values({
    id,
    token,
    threadId,
    ownerId: (session.user as any).id,
    organizationId: organizationId || null,
    title: titleVal,
    snapshot: snapshotStr,
    isPublic: !!isPublic,
  } as any);

  return Response.json({ id, token, url: `/share/${token}` });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const uid = (session.user as any).id;
  const rows = await db
    .select()
    .from(sharedChat)
    .where(eq(sharedChat.ownerId, uid))
    .orderBy(desc(sharedChat.createdAt));
  const data = rows.map((r: any) => ({
    id: r.id,
    token: r.token,
    threadId: r.threadId,
    title: r.title,
    isPublic: r.isPublic,
    viewCount: r.viewCount,
    createdAt: r.createdAt,
    url: `/share/${r.token}`,
  }));
  return Response.json(data);
}
