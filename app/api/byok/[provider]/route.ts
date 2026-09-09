import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProviderKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const uid = (session as any)?.user?.id || (session as any)?.data?.user?.id;
  if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const normalized = String(provider).toLowerCase();
  const id = `${uid}:${normalized}`;
  await db.delete(userProviderKey).where(eq(userProviderKey.id, id));
  return Response.json({ success: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const uid = (session as any)?.user?.id || (session as any)?.data?.user?.id;
  if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const normalized = String(provider).toLowerCase();
  const id = `${uid}:${normalized}`;
  const row = await db.select().from(userProviderKey).where(eq(userProviderKey.id, id)).limit(1).then((r) => r[0] as any);
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return Response.json({ provider: row.provider, keyHint: row.keyHint, hasKey: true, label: row.label });
}
