import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";

export function HeadlessChat() {
  return (
    <ThreadPrimitive.Root className="flex h-screen flex-col">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-6">
        <ThreadPrimitive.Messages>
          {({ message }) => {
            if (message.role === "user") {
              return (
                <MessagePrimitive.Root className="mb-4 flex justify-end">
                  <div className="max-w-[75%] rounded-xl bg-blue-600 p-3 text-white">
                    <MessagePrimitive.Parts />
                  </div>
                </MessagePrimitive.Root>
              );
            }

            return (
              <MessagePrimitive.Root className="mb-4 flex justify-start">
                <div className="max-w-[75%] rounded-xl bg-gray-100 p-3 text-gray-900">
                  <MessagePrimitive.Parts />
                </div>
              </MessagePrimitive.Root>
            );
          }}
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 pt-4">
          <ComposerPrimitive.Root className="flex gap-2 border bg-white p-2">
            <ComposerPrimitive.Input
              className="min-h-10 flex-1 resize-none p-2 outline-none"
              placeholder="Ask something..."
            />

            <ComposerPrimitive.Send className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
              Send
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
