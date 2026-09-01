"use client";

import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { File } from "@/components/assistant-ui/file";
import { ThreadFollowupSuggestions } from "@/components/assistant-ui/follow-up-suggestions";
import { Image } from "@/components/assistant-ui/image";
import { MarkdownText, StaticMarkdown } from "@/components/assistant-ui/markdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/assistant-ui/reasoning";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from "@/components/assistant-ui/tool-group";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ComposerQuotePreview,
  QuoteBlock,
  SelectionToolbar,
} from "@/components/assistant-ui/elements/quote.aui";
import { ComposerTriggerPopover } from "@/components/assistant-ui/elements/composer-trigger-popover.aui";
import {
  ComposerContext,
  ComposerModelTrigger,
} from "@/components/assistant-ui/elements/composer";
import { ModelSelectionPopup } from "@/components/assistant-ui/model-selection";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  type AssistantState,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  groupPartByType,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  type FileMessagePartComponent,
  type ImageMessagePartComponent,
  type TextMessagePartProps,
  type ToolCallMessagePartComponent,
  useAui,
  useAuiState,
  unstable_defaultDirectiveFormatter,
  unstable_useMentionAdapter,
  unstable_useSlashCommandAdapter,
  type Unstable_SlashCommand,
} from "@assistant-ui/react";
import { getThreadMessageTokenUsage } from "@assistant-ui/react-ai-sdk";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  AudioLinesIcon,
  BotIcon,
  BrainIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  CpuIcon,
  DatabaseIcon,
  DownloadIcon,
  MicIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SettingsIcon,
  SparklesIcon,
  SquareIcon,
  StopCircleIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FC,
  type PropsWithChildren,
} from "react";

export type ThreadGroupPart = MessagePrimitive.GroupedParts.GroupPart;

/**
 * Optional component overrides for the thread. `AssistantMessage` and
 * `Welcome` replace whole sections; the remaining slots override how the
 * assistant message renders tool calls and part groups. Tool UIs registered
 * by name (toolkit `render`, `useAssistantDataUI`) take precedence over
 * `ToolFallback`.
 */
export type ThreadComponents = {
  AssistantMessage?: ComponentType | undefined;
  Welcome?: ComponentType | undefined;
  ToolFallback?: ToolCallMessagePartComponent | undefined;
  ToolGroup?:
    | ComponentType<PropsWithChildren<{ group: ThreadGroupPart }>>
    | undefined;
  ReasoningGroup?:
    | ComponentType<PropsWithChildren<{ group: ThreadGroupPart }>>
    | undefined;
};

export type ThreadProps = {
  components?: ThreadComponents | undefined;
  autoFocus?: boolean | undefined;
};

const EMPTY_COMPONENTS: ThreadComponents = {};

const ThreadComponentsContext =
  createContext<ThreadComponents>(EMPTY_COMPONENTS);

// Startup exposes a loading placeholder thread; treat it as a new chat so
// the composer mounts centered. Loads after startup keep the docked layout.
const isNewChatView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  (!s.thread.isLoading || s.threads.isLoading);

// A switched thread that is still fetching its history: skeleton, not welcome.
const isHistoryLoadingView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  s.thread.isLoading &&
  !s.thread.isDisabled &&
  !s.threads.isLoading;

const mentionFormatter = {
  serialize: (item: { id: string; label: string; type: string }) => `@${item.label}`,
  parse: (text: string) => {
    const re = /@([A-Za-z0-9_]+)/g;
    const segments: any[] = [];
    let lastIndex = 0;
    for (const m of text.matchAll(re)) {
      if (m.index! > lastIndex) segments.push({ kind: "text", text: text.slice(lastIndex, m.index!) });
      segments.push({ kind: "mention", type: "user", label: m[1]!, id: m[1]!.toLowerCase() });
      lastIndex = m.index! + m[0].length;
    }
    if (lastIndex < text.length) segments.push({ kind: "text", text: text.slice(lastIndex) });
    if (segments.length === 0) segments.push({ kind: "text", text });
    return segments as ReturnType<typeof unstable_defaultDirectiveFormatter.parse>;
  },
} as typeof unstable_defaultDirectiveFormatter;

const slashFormatter = {
  serialize: (item: { id: string; label: string }) => item.label ?? `/${item.id}`,
  parse: (text: string) => [{ kind: "text", text }] as ReturnType<typeof unstable_defaultDirectiveFormatter.parse>,
} as typeof unstable_defaultDirectiveFormatter;

const DirectiveText: FC<TextMessagePartProps> = ({ text }) => {
  const segments = mentionFormatter.parse(text);
  if (segments.length === 1 && segments[0]?.kind === "text") {
    return <span className="wrap-break-word whitespace-pre-wrap">{text}</span>;
  }
  return (
    <span className="aui-directive-text inline wrap-break-word whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.kind === "mention" ? (
          <span
            key={i}
            className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mx-0.5 inline-flex items-center rounded-full px-1.5 py-0 text-xs font-semibold"
          >
            @{seg.label}
          </span>
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {seg.text}
          </span>
        ),
      )}
    </span>
  );
};

const ThreadHistorySkeleton: FC = () => (
  <div
    data-slot="aui_thread-history-skeleton"
    role="status"
    className="animate-in fade-in fill-mode-both flex flex-col gap-y-6 [animation-delay:150ms] [animation-duration:200ms]"
  >
    <span className="sr-only">Loading conversation</span>
    <Skeleton className="ml-auto h-9 w-2/5 rounded-xl motion-reduce:animate-none" />
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4 w-11/12 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
    </div>
    <Skeleton className="ml-auto h-9 w-1/3 rounded-xl motion-reduce:animate-none" />
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4 w-10/12 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
    </div>
  </div>
);

export const Thread: FC<ThreadProps> = ({
  components = EMPTY_COMPONENTS,
  autoFocus = true,
}) => {
  const isEmpty = useAuiState(isNewChatView);

  return (
    <ThreadComponentsContext.Provider value={components}>
      <ThreadRoot isEmpty={isEmpty} autoFocus={autoFocus} />
    </ThreadComponentsContext.Provider>
  );
};

const ThreadRoot: FC<{ isEmpty: boolean; autoFocus: boolean }> = ({
  isEmpty,
  autoFocus,
}) => {
  const { Welcome = ThreadWelcome } = useContext(ThreadComponentsContext);

  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root bg-background @container flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-bg" as string]: "var(--color-card)",
        ["--composer-radius" as string]: "1.5rem",
        ["--composer-padding" as string]: "8px",
      }}
    >
        <ThreadPrimitive.Viewport
        turnAnchor="top"
        data-slot="aui_thread-viewport"
        className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-4">
          <div className="flex flex-1 flex-col">
            <AuiIf condition={isNewChatView}>
              <div className="flex flex-1 items-center justify-center py-12">
                <Welcome />
              </div>
            </AuiIf>
            <AuiIf condition={isHistoryLoadingView}>
              <ThreadHistorySkeleton />
            </AuiIf>

            <div
              data-slot="aui_message-group"
              className="flex flex-col gap-y-6 empty:hidden mb-6"
            >
              <ThreadPrimitive.Messages>
                {() => <ThreadMessage />}
              </ThreadPrimitive.Messages>
            </div>
          </div>

          <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer bg-background sticky bottom-0 mt-auto flex flex-col gap-4 overflow-visible pb-4 md:pb-6 rounded-t-(--composer-radius)">
            <AuiIf condition={(s) => isNewChatView(s) && s.composer.isEmpty}>
              <ThreadSuggestions />
            </AuiIf>
            <ThreadFollowupSuggestions />
            <ThreadScrollToBottom />
            <Composer autoFocus={autoFocus} />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
      <SelectionToolbar />
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const { AssistantMessage: AssistantMessageComponent = AssistantMessage } =
    useContext(ThreadComponentsContext);
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  const isSignal = useAuiState((s) => {
    const m: any = s.message as any;
    return m.metadata?.isSignal || m.metadata?.signal;
  });

  if (isEditing) return <EditComposer />;
  if (isSignal) return <SignalMessage />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessageComponent />;
};

const SignalMessage: FC = () => {
  const signalType = useAuiState(
    (s) => (s.message as any).metadata?.signalType ?? "working-memory",
  );
  const label = String(signalType).replace(/[-_]/g, " ");
  return (
    <MessagePrimitive.Root
      data-slot="aui_signal-message-root"
      data-role="signal"
      className="group fade-in slide-in-from-bottom-1 animate-in flex gap-3 duration-150 [contain-intrinsic-size:auto_120px] [content-visibility:auto]"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-amber-500/10 border-amber-500/20">
        <BrainIcon className="size-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-muted-foreground mb-1 ml-1 flex items-center gap-1.5 text-xs font-medium capitalize">
          <SparklesIcon className="size-3 text-amber-500" />
          {label}
        </span>
        <div
          data-slot="aui_signal-message-content"
          className="rounded-2xl rounded-tl-md border border-amber-200/60 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 leading-relaxed shadow-sm wrap-break-word"
        >
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
            <DatabaseIcon className="size-3.5" />
            Memory updated
          </div>
          <div className="text-foreground text-sm">
            <MessagePrimitive.Parts
              components={{ Text: MarkdownText } as any}
            />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const InlineMarkdown: FC<{ text: string }> = ({ text }) => {
  return (
    <div className="aui-md">
      <StaticMarkdown text={text} />
    </div>
  );
};

const WorkingMemoryCard: FC<{ text: string }> = ({ text }) => {
  return (
    <div className="mb-3 rounded-xl border border-amber-200/60 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/40 px-3.5 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
        <DatabaseIcon className="size-3.5" />
        Memory updated
      </div>
      <div className="text-foreground text-sm">
        <InlineMarkdown text={text} />
      </div>
    </div>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom
      render={
        <TooltipIconButton
          tooltip="Scroll to bottom"
          variant="outline"
          className="aui-thread-scroll-to-bottom dark:border-border dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible"
        />
      }
    >
      <ArrowDownIcon />
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mb-6 flex flex-col items-center px-4 text-center">
      <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-2xl font-medium tracking-tight duration-200">
        How can I help you today?
      </h1>
    </div>
  );
};

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions flex w-full flex-wrap items-center justify-center gap-2 px-4">
      <ThreadPrimitive.Suggestions>
        {() => <ThreadSuggestionItem />}
      </ThreadPrimitive.Suggestions>
    </div>
  );
};

const ThreadSuggestionItem: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-200">
      <SuggestionPrimitive.Trigger
        send
        render={
          <Button
            variant="ghost"
            className="aui-thread-welcome-suggestion text-foreground hover:bg-muted border-border/60 h-auto gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-normal whitespace-nowrap transition-colors"
          />
        }
      >
        <SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1" />
        <SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 empty:hidden" />
      </SuggestionPrimitive.Trigger>
    </div>
  );
};

const Composer: FC<{ autoFocus: boolean }> = ({ autoFocus }) => {
  const aui = useAui();
  const mention = unstable_useMentionAdapter({
    items: [
      { id: "aiden", type: "user", label: "Aiden", description: "Teammate" },
      { id: "ana", type: "user", label: "Ana", description: "Teammate" },
      { id: "docs", type: "doc", label: "Docs", description: "Knowledge base" },
    ],
    includeModelContextTools: true,
    formatter: mentionFormatter,
  });
  const [usedSlashIds, setUsedSlashIds] = useState<Set<string>>(new Set());
  const composerText = useAuiState((s) => s.composer.text);
  useEffect(() => {
    if (composerText === "") setUsedSlashIds(new Set());
  }, [composerText]);
  const baseSlashCommands = useMemo<readonly Unstable_SlashCommand[]>(
    () => [
      { id: "clear", label: "/clear", execute: () => aui.threads.switchToNewThread() },
      { id: "summarize", label: "/summarize", execute: () => {} },
      { id: "help", label: "/help", execute: () => {} },
      { id: "review", label: "/review", execute: () => {} },
      { id: "branch", label: "/branch", execute: () => {} },
    ],
    [aui],
  );
  const slashCommands = useMemo(
    () =>
      baseSlashCommands
        .filter((c) => !usedSlashIds.has(c.id))
        .map((c) => ({
          ...c,
          execute: () => {
            setUsedSlashIds((prev) => new Set([...prev, c.id]));
            c.execute();
          },
        })) as readonly Unstable_SlashCommand[],
    [baseSlashCommands, usedSlashIds],
  );
  const slash = unstable_useSlashCommandAdapter({
    commands: slashCommands,
  });

  const hasAttachmentError = useAuiState((s) =>
    s.composer.attachments.some((a: any) => a.status?.type === "incomplete" && a.status?.reason === "error"),
  );
  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
        <ComposerPrimitive.AttachmentDropzone
          render={
            <div
              data-slot="aui_composer-shell"
              className={cn(
                "flex w-full cursor-text flex-col gap-2 rounded-(--composer-radius) border bg-(--composer-bg) p-(--composer-padding) transition-[border-color] data-[dragging=true]:border-dashed data-[dragging=true]:bg-[color-mix(in_oklab,var(--color-accent)_50%,var(--color-background))]",
                hasAttachmentError
                  ? "border-destructive ring-destructive/20 focus-within:border-destructive"
                  : "border-border/60 data-[dragging=true]:border-ring focus-within:border-border dark:border-muted-foreground/15 dark:focus-within:border-muted-foreground/30",
              )}
            />
          }
        >
          <ComposerAttachments />
          <ComposerQuotePreview />
          <ComposerPrimitive.Input
            placeholder="Send a message... Type / for commands, @ to mention"
            className="aui-composer-input caret-primary placeholder:text-muted-foreground/60 max-h-48 min-h-10 w-full resize-none bg-transparent px-2.5 py-1 text-base leading-6 outline-none"
            rows={1}
            autoFocus={autoFocus}
            enterKeyHint="send"
            aria-label="Message input"
          />
          <ComposerAction />
        </ComposerPrimitive.AttachmentDropzone>
        <ComposerTriggerPopover
          char="@"
          adapter={mention.adapter}
          directive={mention.directive}
        />
        <ComposerTriggerPopover char="/" adapter={slash.adapter} action={{ ...slash.action, formatter: slashFormatter }} />
      </ComposerPrimitive.Root>
    </ComposerPrimitive.Unstable_TriggerPopoverRoot>
  );
};

const ComposerModelPicker: FC = () => {
  const aui = useAui();
  const [selected, setSelected] = useState("Gemini 3 Flash");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    return aui.modelContext.register({
      getModelContext: () => ({ config: { modelName: selected } }),
    });
  }, [aui, selected]);
  return (
    <div className="relative">
      <ComposerModelTrigger model={selected} open={open} onClick={() => setOpen((v) => !v)} />
      <ModelSelectionPopup
        open={open}
        onClose={() => setOpen(false)}
        selectedName={selected}
        onSelect={(name) => {
          setSelected(name);
          setOpen(false);
        }}
      />
    </div>
  );
};

const ComposerContextRail: FC = () => {
  const used = useAuiState((s) =>
    s.thread.messages.reduce((sum: number, m: any) => {
      const steps: any[] = m.metadata?.steps ?? [];
      if (steps.length) {
        return (
          sum +
          steps.reduce(
            (a: number, step: any) => a + (step.usage?.inputTokens ?? 0) + (step.usage?.outputTokens ?? 0),
            0,
          )
        );
      }
      const tok: any = (m.metadata as any)?.tokenUsage ?? getThreadMessageTokenUsage(m as any);
      if (tok) return sum + (tok.totalTokens ?? (tok.inputTokens ?? 0) + (tok.outputTokens ?? 0));
      const innerSym = Object.getOwnPropertySymbols(m).find((sym) => sym.description === "innerMessage");
      const inner: any = innerSym ? (m as any)[innerSym] : null;
      if (Array.isArray(inner)) {
        for (const im of inner) {
          const u: any = im?.metadata?.tokenUsage;
          if (u) return sum + (u.totalTokens ?? (u.inputTokens ?? 0) + (u.outputTokens ?? 0));
        }
      }
      return sum;
    }, 0),
  );
  const isRunning = useAuiState((s) => s.thread.isRunning);
  if (isRunning && used === 0) {
    return (
      <div className="grid size-8 place-items-center rounded-full border bg-background">
        <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-sky-500" />
      </div>
    );
  }
  return (
    <ComposerContext usage={{ system: 1, tools: 3, messages: Math.round(used / 1000), total: 200 }} />
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper relative flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <ComposerAddAttachment />
        <ComposerModelPicker />
      </div>
      <div className="flex items-center gap-1.5">
        <ComposerContextRail />
        <AuiIf condition={(s) => s.thread.capabilities.dictation}>
          <AuiIf condition={(s) => s.composer.dictation == null}>
            <ComposerPrimitive.Dictate
              render={
                <TooltipIconButton
                  tooltip="Voice input"
                  side="bottom"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="aui-composer-dictate text-muted-foreground hover:text-foreground size-7 rounded-full"
                  aria-label="Start voice input"
                />
              }
            >
              <MicIcon className="aui-composer-dictate-icon size-4" />
            </ComposerPrimitive.Dictate>
          </AuiIf>
          <AuiIf condition={(s) => s.composer.dictation != null}>
            <ComposerPrimitive.StopDictation
              render={
                <TooltipIconButton
                  tooltip="Stop dictation"
                  side="bottom"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="aui-composer-stop-dictation text-destructive size-7 rounded-full"
                  aria-label="Stop voice input"
                />
              }
            >
              <SquareIcon className="aui-composer-stop-dictation-icon size-3.5 animate-pulse fill-current" />
            </ComposerPrimitive.StopDictation>
          </AuiIf>
        </AuiIf>
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            render={
              <TooltipIconButton
                tooltip="Send message"
                side="bottom"
                type="button"
                variant="default"
                size="icon"
                className="aui-composer-send size-7 rounded-full"
                aria-label="Send message"
              />
            }
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            render={
              <Button
                type="button"
                variant="default"
                size="icon"
                className="aui-composer-cancel size-7 rounded-full"
                aria-label="Stop generating"
              />
            }
          >
            <SquareIcon className="aui-composer-cancel-icon size-3.5 fill-current" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root border-destructive bg-destructive/10 text-destructive dark:bg-destructive/5 mt-2 rounded-md border p-3 text-sm dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

function splitWorkingMemory(parts: any[]) {
  const firstTextPart = parts.find((p: any) => p.type === "text");
  const firstText = (firstTextPart?.text ?? "")
    .replace(/\r\n/g, "\n")
    .trimStart();
  if (!firstText.startsWith("# User Profile")) {
    const restText = parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n\n")
      .trim();
    return { signalText: "", restText };
  }
  const lines = firstText.split("\n");
  let end = 0;
  while (
    end < lines.length &&
    (lines[end].trim() === "" ||
      lines[end].trim().startsWith("#") ||
      lines[end].trim().startsWith("- "))
  ) {
    end++;
  }
  const signalText = lines.slice(0, end).join("\n").trim();
  const restFromFirst = lines.slice(end).join("\n").trim();
  const otherTexts = parts
    .filter((p: any) => p.type === "text" && p !== firstTextPart)
    .map((p: any) => p.text)
    .join("\n\n")
    .trim();
  const restText = [restFromFirst, otherTexts]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return { signalText, restText };
}

const AssistantMessage: FC = () => {
  const {
    ToolFallback: ToolFallbackComponent = ToolFallback,
    ToolGroup,
    ReasoningGroup,
  } = useContext(ThreadComponentsContext);

  const ACTION_BAR_PT = "pt-1.5";
  const ACTION_BAR_HEIGHT = `min-h-7.5 ${ACTION_BAR_PT}`;

  const parts = useAuiState((s) => (s.message as any).parts ?? []);
  const { signalText, restText } = useMemo(
    () => splitWorkingMemory(parts),
    [parts],
  );
  if (signalText) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-amber-500/10 border-amber-500/20">
            <BrainIcon className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted-foreground mb-1 ml-1 flex items-center gap-1.5 text-xs font-medium">
              <SparklesIcon className="size-3 text-amber-500" /> Working Memory
            </span>
            <WorkingMemoryCard text={signalText} />
          </div>
        </div>
        {(restText || !signalText) && (
          <MessagePrimitive.Root
            data-slot="aui_assistant-message-root"
            data-role="assistant"
            className="group flex gap-3 duration-150"
          >
            <div className="bg-primary/10 border-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full border">
              <BotIcon className="size-4 text-primary" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-muted-foreground mb-1 ml-1 text-xs font-medium">
                Assistant
              </span>
              <div className="bg-card text-foreground rounded-2xl rounded-tl-md border px-4 py-3 leading-relaxed wrap-break-word shadow-sm">
                {restText ? (
                  <InlineMarkdown text={restText} />
                ) : (
                  <MessagePrimitive.GroupedParts
                    groupBy={groupPartByType({
                      reasoning: ["group-chainOfThought", "group-reasoning"],
                      "tool-call": ["group-chainOfThought", "group-tool"],
                      "standalone-tool-call": [],
                    })}
                  >
                    {({ part, children }) => {
                      switch (part.type) {
                        case "group-chainOfThought":
                          return (
                            <div data-slot="aui_chain-of-thought">
                              {children}
                            </div>
                          );
                        case "group-tool":
                          if (ToolGroup)
                            return (
                              <ToolGroup group={part}>{children}</ToolGroup>
                            );
                          return (
                            <ToolGroupRoot variant="ghost">
                              <ToolGroupTrigger
                                count={part.indices.length}
                                active={part.status.type === "running"}
                              />
                              <ToolGroupContent>{children}</ToolGroupContent>
                            </ToolGroupRoot>
                          );
                        case "group-reasoning": {
                          if (ReasoningGroup)
                            return (
                              <ReasoningGroup group={part}>
                                {children}
                              </ReasoningGroup>
                            );
                          const running = part.status.type === "running";
                          return (
                            <ReasoningRoot streaming={running}>
                              <ReasoningTrigger active={running} />
                              <ReasoningContent aria-busy={running}>
                                <ReasoningText>{children}</ReasoningText>
                              </ReasoningContent>
                            </ReasoningRoot>
                          );
                        }
                        case "text":
                          return <MarkdownText />;
                        case "reasoning":
                          return <Reasoning {...part} />;
                        case "tool-call":
                          return (
                            part.toolUI ?? <ToolFallbackComponent {...part} />
                          );
                        case "data":
                          return part.dataRendererUI;
                        case "file":
                          return (
                            <div
                              data-slot="aui_assistant-message-file"
                              className="py-1"
                            >
                              <File {...part} />
                            </div>
                          );
                        case "image":
                          return (
                            <div
                              data-slot="aui_assistant-message-image"
                              className="py-1"
                            >
                              <Image {...part} />
                            </div>
                          );
                        case "indicator":
                          return (
                            <span
                              data-slot="aui_assistant-message-indicator"
                              className="animate-pulse font-sans"
                              aria-label="Assistant is working"
                            >
                              {"●"}
                            </span>
                          );
                        default:
                          return null;
                      }
                    }}
                  </MessagePrimitive.GroupedParts>
                )}
                <MessageError />
              </div>
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
                  ACTION_BAR_PT,
                  ACTION_BAR_HEIGHT,
                )}
              >
                <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 has-[button:focus-visible]:opacity-100">
                  <BranchPicker />
                  <AssistantActionBar />
                </div>
                <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 has-[button:focus-visible]:opacity-100">
                  <AssistantTokens />
                </div>
              </div>
            </div>
          </MessagePrimitive.Root>
        )}
      </div>
    );
  }

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="group fade-in slide-in-from-bottom-1 animate-in flex gap-3 duration-150 [contain-intrinsic-size:auto_200px] [content-visibility:auto]"
    >
      <div className="bg-primary/10 border-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full border">
        <BotIcon className="size-4 text-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-muted-foreground mb-1 ml-1 text-xs font-medium">
          Assistant
        </span>
        <div
          data-slot="aui_assistant-message-content"
          className="bg-card text-foreground rounded-2xl rounded-tl-md border px-4 py-3 leading-relaxed wrap-break-word shadow-sm"
        >
          <MessagePrimitive.GroupedParts
            groupBy={groupPartByType({
              reasoning: ["group-chainOfThought", "group-reasoning"],
              "tool-call": ["group-chainOfThought", "group-tool"],
              "standalone-tool-call": [],
            })}
          >
            {({ part, children }) => {
              switch (part.type) {
                case "group-chainOfThought":
                  return <div data-slot="aui_chain-of-thought">{children}</div>;
                case "group-tool":
                  if (ToolGroup) {
                    return <ToolGroup group={part}>{children}</ToolGroup>;
                  }
                  return (
                    <ToolGroupRoot variant="ghost">
                      <ToolGroupTrigger
                        count={part.indices.length}
                        active={part.status.type === "running"}
                      />
                      <ToolGroupContent>{children}</ToolGroupContent>
                    </ToolGroupRoot>
                  );
                case "group-reasoning": {
                  if (ReasoningGroup) {
                    return (
                      <ReasoningGroup group={part}>{children}</ReasoningGroup>
                    );
                  }
                  const running = part.status.type === "running";
                  return (
                    <ReasoningRoot streaming={running}>
                      <ReasoningTrigger active={running} />
                      <ReasoningContent aria-busy={running}>
                        <ReasoningText>{children}</ReasoningText>
                      </ReasoningContent>
                    </ReasoningRoot>
                  );
                }
                case "text":
                  return <MarkdownText />;
                case "reasoning":
                  return <Reasoning {...part} />;
                case "tool-call":
                  return part.toolUI ?? <ToolFallbackComponent {...part} />;
                case "data":
                  return part.dataRendererUI;
                case "file":
                  return (
                    <div
                      data-slot="aui_assistant-message-file"
                      className="py-1"
                    >
                      <File {...part} />
                    </div>
                  );
                case "image":
                  return (
                    <div
                      data-slot="aui_assistant-message-image"
                      className="py-1"
                    >
                      <Image {...part} />
                    </div>
                  );
                case "indicator":
                  return (
                    <span
                      data-slot="aui_assistant-message-indicator"
                      className="animate-pulse font-sans"
                      aria-label="Assistant is working"
                    >
                      {"●"}
                    </span>
                  );
                default:
                  return null;
              }
            }}
          </MessagePrimitive.GroupedParts>
          <MessageError />
        </div>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
            ACTION_BAR_PT,
            ACTION_BAR_HEIGHT,
          )}
        >
          <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 has-[button:focus-visible]:opacity-100">
            <BranchPicker />
            <AssistantActionBar />
          </div>
          <AssistantTokens />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantTokens: FC = () => {
  const message = useAuiState((s) => s.message as any);
  const innerSym = Object.getOwnPropertySymbols(message).find(
    (s) => s.description === "innerMessage",
  );
  const inner: any[] | null = innerSym ? (message as any)[innerSym] : null;
  const assistantInner = Array.isArray(inner)
    ? ([...inner]
        .reverse()
        .find((m: any) => m?.role === "assistant" && m?.metadata?.tokenUsage) ??
      [...inner].reverse().find((m: any) => m?.role === "assistant") ??
      inner[inner.length - 1])
    : null;
  const metadata = (assistantInner?.metadata ?? message?.metadata ?? {}) as any;
  const usage = (assistantInner?.metadata?.tokenUsage ??
    getThreadMessageTokenUsage(message) ??
    metadata.tokenUsage) as
    | {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        reasoningTokens?: number;
      }
    | undefined;

  const modelId: string | undefined =
    metadata.modelId ?? metadata.model ?? message?.modelId;
  const provider: string | undefined = metadata.provider;
  const displayModel =
    modelId || provider ? `${modelId ?? ""}`.trim() || provider : null;

  const tokensPerSec: number | undefined =
    metadata.tokensPerSec ?? metadata.tps ?? metadata.tokensPerSecond;

  const totalTokens: number | undefined =
    usage?.totalTokens ??
    metadata.totalTokens ??
    metadata.tokenUsage?.totalTokens;

  const ttft: number | string | undefined =
    metadata.timeToFirstToken ?? metadata.ttft ?? metadata.timeToFirst;

  const fallbackTtft = (() => {
    if (ttft != null) return ttft;
    const created = message?.createdAt
      ? new Date(message.createdAt).getTime()
      : null;
    const completed = metadata.completedAt
      ? new Date(metadata.completedAt).getTime()
      : null;
    if (created && completed && completed > created) {
      const sec = (completed - created) / 1000;
      if (sec > 0 && sec < 30) return sec.toFixed(1) + " sec";
    }
    return null;
  })();

  const hasAny =
    displayModel ||
    tokensPerSec != null ||
    totalTokens != null ||
    fallbackTtft != null ||
    usage;
  if (!hasAny) return null;

  const parts: string[] = [];
  if (usage?.inputTokens != null) parts.push(`${usage.inputTokens} in`);
  if (usage?.outputTokens != null) parts.push(`${usage.outputTokens} out`);
  if (usage?.totalTokens != null && totalTokens == null)
    parts.push(`${usage.totalTokens} tokens`);

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums">
      {displayModel ? (
        <span className="inline-flex items-center gap-1">
          <CpuIcon className="size-3 opacity-70" />
          {provider && modelId
            ? `${provider} ${displayModel}`.trim()
            : displayModel}
        </span>
      ) : null}
      {tokensPerSec != null ? (
        <span className="inline-flex items-center gap-1">
          <ZapIcon className="size-3 opacity-70" />
          {typeof tokensPerSec === "number"
            ? `${tokensPerSec.toFixed(2)} tok/sec`
            : `${tokensPerSec} tok/sec`}
        </span>
      ) : null}
      {totalTokens != null ? (
        <span className="inline-flex items-center gap-1">
          <SettingsIcon className="size-3 opacity-70" />
          {totalTokens} tokens
        </span>
      ) : parts.length ? (
        <span className="inline-flex items-center gap-1">
          <SettingsIcon className="size-3 opacity-70" />
          {parts.join(" · ")}
        </span>
      ) : null}
      {fallbackTtft != null ? (
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="size-3 opacity-70" />
          Time-to-First:{" "}
          {typeof fallbackTtft === "number"
            ? `${fallbackTtft.toFixed(1)} sec`
            : fallbackTtft}
        </span>
      ) : null}
    </div>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="aui-assistant-action-bar-root text-muted-foreground col-start-3 row-start-2 -ms-1 flex gap-1"
    >
      <ActionBarPrimitive.Copy render={<TooltipIconButton tooltip="Copy" />}>
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon className="animate-in zoom-in-75 fade-in duration-150" />
        </AuiIf>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload
        render={<TooltipIconButton tooltip="Refresh" />}
      >
        <RefreshCwIcon />
      </ActionBarPrimitive.Reload>
      <AuiIf condition={(s) => s.message.speech == null}>
        <ActionBarPrimitive.Speak
          render={<TooltipIconButton tooltip="Read aloud" />}
        >
          <AudioLinesIcon />
        </ActionBarPrimitive.Speak>
      </AuiIf>
      <AuiIf condition={(s) => s.message.speech != null}>
        <ActionBarPrimitive.StopSpeaking
          render={<TooltipIconButton tooltip="Stop speaking" />}
        >
          <StopCircleIcon />
        </ActionBarPrimitive.StopSpeaking>
      </AuiIf>

      {/* <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger
          render={
            <TooltipIconButton
              tooltip="More"
              className="data-[state=open]:bg-accent"
            />
          }
        >
          <MoreHorizontalIcon />
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="aui-action-bar-more-content bg-popover text-popover-foreground data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1.5"
        >
          <ActionBarPrimitive.ExportMarkdown
            render={
              <ActionBarMorePrimitive.Item className="aui-action-bar-more-item hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none" />
            }
          >
            <DownloadIcon className="size-4" />
            Export as Markdown
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
       */}
    </ActionBarPrimitive.Root>
  );
};

const UserFilePart: FileMessagePartComponent = (part) => (
  <div data-slot="aui_user-message-file" className="py-1">
    <File {...part} />
  </div>
);

const UserImagePart: ImageMessagePartComponent = (part) => (
  <div data-slot="aui_user-message-image" className="py-1">
    <Image {...part} />
  </div>
);

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      className="fade-in slide-in-from-bottom-1 animate-in flex justify-end gap-3 duration-150 [contain-intrinsic-size:auto_200px] [content-visibility:auto]"
      data-role="user"
    >
      <div className="flex max-w-[75%] flex-col items-end">
        <span className="text-muted-foreground mb-1 mr-1 text-xs font-medium">
          You
        </span>
        <div className="aui-user-message-content-wrapper relative min-w-0">
          <div className="aui-user-message-content bg-primary text-primary-foreground peer rounded-2xl rounded-br-md px-4 py-2.5 wrap-break-word shadow-sm empty:hidden">
            <MessagePrimitive.Quote>
              {(quote) => <QuoteBlock {...quote} />}
            </MessagePrimitive.Quote>
            <MessagePrimitive.Parts
              components={{ Text: DirectiveText, File: UserFilePart, Image: UserImagePart }}
            />
          </div>
          <div className="aui-user-action-bar-wrapper absolute start-0 top-1/2 -translate-x-full -translate-y-1/2 pe-2 peer-empty:hidden rtl:translate-x-full">
            <UserActionBar />
          </div>
        </div>
        <BranchPicker
          data-slot="aui_user-branch-picker"
          className="mt-1 -me-1 justify-end"
        />
        <UserMessageAttachments />
      </div>
      <div className="bg-muted border flex size-8 shrink-0 items-center justify-center rounded-full border">
        <UserIcon className="text-muted-foreground size-4" />
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit
        render={
          <TooltipIconButton tooltip="Edit" className="aui-user-action-edit" />
        }
      >
        <PencilIcon />
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_edit-composer-wrapper"
      className="flex flex-col px-2 [contain-intrinsic-size:auto_200px] [content-visibility:auto]"
    >
      <ComposerPrimitive.Root className="aui-edit-composer-root border-border/60 dark:border-muted-foreground/15 ms-auto flex w-full max-w-[85%] cursor-text flex-col rounded-(--composer-radius) border bg-(--composer-bg)">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input text-foreground min-h-14 w-full resize-none bg-transparent px-4 pt-3 pb-1 text-base outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-2.5 mb-2.5 flex items-center gap-1.5 self-end">
          <ComposerPrimitive.Cancel
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3.5"
              />
            }
          >
            Cancel
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send
            render={<Button size="sm" className="h-8 rounded-full px-3.5" />}
          >
            Update
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root text-muted-foreground -ms-2 me-2 inline-flex items-center text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous
        render={<TooltipIconButton tooltip="Previous" />}
      >
        <ChevronLeftIcon />
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next render={<TooltipIconButton tooltip="Next" />}>
        <ChevronRightIcon />
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
