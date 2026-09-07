import { handleChatStream } from "@mastra/ai-sdk";
import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/src/mastra";
import { NextResponse } from "next/server";

const THREAD_ID = "example-user-id";
const RESOURCE_ID = "weather-chat";
const AGENT_ID = "working-memory-personal-assistant-agent";

export async function POST(req: Request) {
  const params = await req.json();
  const stream = await handleChatStream({
    mastra,
    agentId: AGENT_ID,
    version: "v7",
    params: {
      ...params,
      memory: {
        ...params.memory,
        thread: params.memory?.thread ?? THREAD_ID,
        resource: params.memory?.resource ?? RESOURCE_ID,
      },
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function GET() {
  const memory = await mastra.getAgentById(AGENT_ID).getMemory();
  let response = null;
  try {
    response = await memory?.recall({
      threadId: THREAD_ID,
      resourceId: RESOURCE_ID,
    });
  } catch {
    console.log("No previous messages found.");
  }
  const uiMessages = toAISdkMessages(response?.messages || [], { version: "v7" });
  return NextResponse.json(uiMessages);
}
