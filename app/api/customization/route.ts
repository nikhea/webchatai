import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { mastra } from "@/src/mastra";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const user = (session as any)?.user || (session as any)?.data?.user;
  const editor = mastra.getEditor();
  let agentInstructions: string | null = null;
  let promptBlocks: any[] = [];
  try {
    if (editor) {
      const agent: any = await (editor as any).agent?.getById?.("working-memory-personal-assistant-agent", { status: "published" }).catch(() => null);
      agentInstructions = agent?.instructions || null;
      const blocks: any = await (editor as any).prompt?.list?.({}).catch(() => ({ items: [] }));
      promptBlocks = blocks?.items || blocks || [];
    }
  } catch {}
  return Response.json({
    user: user ? { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role } : null,
    agentInstructions,
    promptBlocks,
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user && !(session as any)?.data?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, role, traits, about, instructions, tools } = body;
  const editor = mastra.getEditor();
  try {
    if (editor && (instructions !== undefined || tools !== undefined)) {
      await (editor as any).agent.update({
        id: "working-memory-personal-assistant-agent",
        instructions: instructions ?? undefined,
        tools: tools ?? undefined,
      });
    }
  } catch (e) {
    console.warn("editor update failed", e);
  }
  if (name || role || traits || about) {
    const workingMemory = `# User Profile\n- Name: ${name || ""}\n- Role: ${role || ""}\n- Traits: ${(traits || []).join(", ")}\n- About: ${about || ""}`;
    try {
      const userId = (session as any)?.user?.id || (session as any)?.data?.user?.id;
      if (userId) {
        const { MASTRA_RESOURCE_ID_KEY } = await import("@mastra/core/request-context");
        const { RequestContext } = await import("@mastra/core/request-context");
        const rc = new RequestContext();
        rc.set(MASTRA_RESOURCE_ID_KEY as any, userId);
      }
    } catch {}
  }
  return Response.json({ success: true });
}
