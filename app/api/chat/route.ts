import { openai } from "@ai-sdk/openai";
import { frontendTools, injectQuoteContext } from "@assistant-ui/react-ai-sdk";
import { type JSONSchema7, streamText, convertToModelMessages, type UIMessage } from "ai";

export async function POST(req: Request) {
  const {
    messages,
    system,
    tools,
    config,
    callSettings,
    modelName: bodyModelName,
    webSearchEnabled: bodyWebSearch,
  }: {
    messages: UIMessage[];
    system?: string;
    tools?: Record<string, { description?: string; parameters: JSONSchema7 }>;
    config?: { modelName?: string; webSearchEnabled?: boolean };
    callSettings?: Record<string, unknown>;
    modelName?: string;
    webSearchEnabled?: boolean;
  } = await req.json();

  const modelName = config?.modelName ?? bodyModelName ?? (callSettings as any)?.modelName ?? "gpt-5.6-luna";
  const webSearchEnabled = config?.webSearchEnabled ?? bodyWebSearch ?? (callSettings as any)?.webSearchEnabled ?? false;

  let finalSystem = system;
  if (webSearchEnabled) {
    const webSearchInstruction =
      "Web search is ENABLED. When the user asks for current, real-time, or factual information that may require up-to-date data, use web search to retrieve accurate information and cite sources inline.";
    finalSystem = system ? `${system}\n\n${webSearchInstruction}` : webSearchInstruction;
  }

  const result = streamText({
    model: openai.responses(modelName as any),
    messages: await convertToModelMessages(injectQuoteContext(messages)),
    system: finalSystem,
    tools: {
      ...frontendTools(tools ?? {}),
    },
    providerOptions: {
      openai: {
        reasoningEffort: "low",
        reasoningSummary: "auto",
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
}
