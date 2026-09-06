import { db } from "@/lib/db";
import { sharedChat } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { StaticMarkdown } from "@/components/assistant-ui/markdown-text";

export const dynamic = "force-dynamic";

function Message({ role, text }: { role: string; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${isUser ? "bg-pink-700 text-white prose-invert" : "bg-zinc-800 text-zinc-100 prose-invert"} prose prose-sm max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-table:border prose-th:bg-zinc-700 prose-td:border-zinc-700 prose-code:before:content-none prose-code:after:content-none`}
      >
        <div className="text-xs opacity-60 mb-1 capitalize">{role}</div>
        <div className="break-words">
          {text ? <StaticMarkdown text={text} /> : <span className="opacity-60">(empty)</span>}
        </div>
      </div>
    </div>
  );
}

function extractText(m: any) {
  if (!m) return "";
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) return m.content.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n") || m.content.map((p: any) => p.text || "").join("\n");
  if (typeof m.text === "string") return m.text;
  if (Array.isArray(m.parts)) return m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n");
  return m.text || m.content || "";
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await db
    .select()
    .from(sharedChat)
    .where(eq(sharedChat.token, token))
    .limit(1)
    .then((r) => r[0] as any);
  if (!row) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#131314] text-zinc-100 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not found</h1>
          <p className="text-zinc-400 mt-2">This shared chat does not exist or was unshared.</p>
          <Link href="/" className="mt-4 inline-block text-pink-400 underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }
  let snapshot: any[] = [];
  try {
    snapshot = JSON.parse(row.snapshot as any);
  } catch {}
  const title = row.title || "Shared Conversation";
  return (
    <div className="min-h-dvh bg-[#131314] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-[#1a1219]/80 backdrop-blur px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold">{title}</h1>
            <p className="text-xs text-zinc-400">
              Shared • {new Date(row.createdAt).toLocaleDateString()} • {row.viewCount} views • {snapshot.length} messages
              {!row.isPublic && " • Private"}
            </p>
          </div>
          <Link href="/" className="text-sm text-pink-400 hover:text-pink-300">
            Open App
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        {snapshot.length === 0 ? (
          <p className="text-center text-zinc-500">No messages in snapshot.</p>
        ) : (
          snapshot.map((m: any, i: number) => (
            <Message key={m.id || i} role={m.role || "assistant"} text={extractText(m)} />
          ))
        )}
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400">
          Snapshot taken at {new Date(row.createdAt).toLocaleString()}. Messages after sharing are not included unless owner updates.
          Anyone with the link can view. {row.isPublic ? "" : "Org/private restricted."}
        </div>
      </main>
    </div>
  );
}
