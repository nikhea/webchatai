import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProviderKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, maskKey } from "@/lib/byok/crypto";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const uid = (session as any)?.user?.id || (session as any)?.data?.user?.id;
  if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const rows = await db.select().from(userProviderKey).where(eq(userProviderKey.userId, uid));
  const data = rows.map((r: any) => ({
    id: r.id,
    provider: r.provider,
    label: r.label,
    keyHint: r.keyHint || maskKey(""),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    hasKey: !!r.encryptedKey,
  }));
  return Response.json(data);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const uid = (session as any)?.user?.id || (session as any)?.data?.user?.id;
  if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { provider, apiKey, label } = body as { provider: string; apiKey: string; label?: string };
  if (!provider || !apiKey) return new Response(JSON.stringify({ error: "provider and apiKey required" }), { status: 400 });
  const normalized = String(provider).toLowerCase().trim();
  const encryptedKey = encrypt(String(apiKey).trim());
  const keyHint = maskKey(String(apiKey).trim());
  const id = `${uid}:${normalized}`;
  const existing = await db.select().from(userProviderKey).where(eq(userProviderKey.id, id)).limit(1).then((r) => r[0] as any);
  if (existing) {
    await db
      .update(userProviderKey)
      .set({ encryptedKey, keyHint, label: label || existing.label, updatedAt: new Date() } as any)
      .where(eq(userProviderKey.id, id));
  } else {
    await db.insert(userProviderKey).values({
      id,
      userId: uid,
      provider: normalized,
      label: label || normalized,
      encryptedKey,
      keyHint,
    } as any);
  }
  return Response.json({ success: true, provider: normalized, keyHint });
}
