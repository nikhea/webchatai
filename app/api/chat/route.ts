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
  }: {
    messages: UIMessage[];
    system?: string;
    tools?: Record<string, { description?: string; parameters: JSONSchema7 }>;
    config?: { modelName?: string };
    callSettings?: Record<string, unknown>;
  } = await req.json();

  const modelName = config?.modelName ?? (callSettings as any)?.modelName ?? "gpt-5.6-luna";

  const result = streamText({
    model: openai.responses(modelName as any),
    messages: await convertToModelMessages(injectQuoteContext(messages)),
    system,
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
