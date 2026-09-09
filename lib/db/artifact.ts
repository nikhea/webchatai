import { db } from "@/lib/db";
import { artifact } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function upsertArtifact(params: {
  id?: string;
  threadId: string;
  toolCallId: string;
  userId?: string | null;
  title: string;
  filename: string;
  content: string;
  language?: string | null;
}) {
  const id = params.id ?? params.toolCallId;
  const existing = await db.select().from(artifact).where(eq(artifact.toolCallId, params.toolCallId)).limit(1);
  if (existing.length) {
    const [updated] = await db
      .update(artifact)
      .set({
        title: params.title,
        filename: params.filename,
        content: params.content,
        language: params.language ?? null,
        updatedAt: new Date(),
      })
      .where(eq(artifact.toolCallId, params.toolCallId))
      .returning();
    return updated;
  }
  const [inserted] = await db
    .insert(artifact)
    .values({
      id,
      threadId: params.threadId,
      toolCallId: params.toolCallId,
      userId: params.userId ?? null,
      title: params.title,
      filename: params.filename,
      content: params.content,
      language: params.language ?? null,
    })
    .returning();
  return inserted;
}

export async function listArtifactsByThread(threadId: string, _userId?: string | null) {
  return db.select().from(artifact).where(eq(artifact.threadId, threadId)).orderBy(artifact.createdAt);
}

export async function getArtifactByToolCallId(toolCallId: string) {
  const rows = await db.select().from(artifact).where(eq(artifact.toolCallId, toolCallId)).limit(1);
  return rows[0] ?? null;
}

export async function deleteArtifactsByThread(threadId: string) {
  return db.delete(artifact).where(eq(artifact.threadId, threadId));
}
