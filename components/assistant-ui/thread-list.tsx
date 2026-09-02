"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AuiIf,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import { memoryKeys, useInfiniteThreads } from "@/app/queries/memory.query";
import { AGENT_ID, pinThread, RESOURCE_ID_KEY, unpinThread, listThreads } from "@/lib/mastra/memory-queries";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  ArchiveIcon,
  GitBranchIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  forwardRef,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FC,
} from "react";
import { useHoverPrefetchThread } from "@/hooks/use-hover-prefetch-thread";

export const ThreadList: FC = () => {
  return (
    <ThreadListRoot>
      <ThreadListItems />
    </ThreadListRoot>
  );
};

export const ThreadListSearch = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithoutRef<typeof Input>, "value" | "onChange"> & {
    value: string;
    onValueChange: (value: string) => void;
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <div data-slot="aui_thread-list-search" className="relative px-0.5 py-1">
      <SearchIcon
        data-slot="aui_thread-list-search-icon"
        className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label="Search threads"
        placeholder="Search threads"
        className={cn("h-8 ps-8 text-sm", className)}
        {...props}
      />
    </div>
  );
});

ThreadListSearch.displayName = "ThreadListSearch";

export const ThreadListRoot: FC<ComponentPropsWithoutRef<typeof ThreadListPrimitive.Root>> = ({
  className,
  ...props
}) => {
  return (
    <ThreadListPrimitive.Root
      data-slot="aui_thread-list-root"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
};

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export const ThreadListItems: FC<ComponentPropsWithoutRef<"div"> & { searchQuery?: string }> = ({
  className,
  searchQuery = "",
  ...props
}) => {
  const hasServerSearch = searchQuery.trim().length > 0;
  if (hasServerSearch) {
    return <ServerThreadList searchQuery={searchQuery} className={className} {...props} />;
  }
  return (
    <div
      data-slot="aui_thread-list-items"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      <AuiIf condition={(s) => s.threads.isLoading}>
        <ThreadListSkeleton />
      </AuiIf>
      <AuiIf condition={(s) => !s.threads.isLoading}>
        <ThreadListItemGroups searchQuery={searchQuery} />
      </AuiIf>
      <InfiniteThreadLoader />
    </div>
  );
};

const InfiniteThreadLoader: FC = () => {
  const aui = useAui();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasFetchedRef.current) {
          hasFetchedRef.current = true;
          (async () => {
            try {
              const res: any = await queryClient.fetchQuery({
                queryKey: memoryKeys.threads(RESOURCE_ID_KEY, AGENT_ID, page, 20),
                queryFn: () => listThreads(RESOURCE_ID_KEY, AGENT_ID, { page, perPage: 20 }),
              } as any);
              const arr = Array.isArray(res) ? res : (res as any)?.threads ?? [];
              if (arr.length > 0) {
                const adapter: any = (aui as any)._adapter ?? (aui as any).threads;
                hasFetchedRef.current = false;
                setPage((p) => p + 1);
              }
            } catch {
              hasFetchedRef.current = false;
            }
          })();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, queryClient, aui]);
  return <div ref={sentinelRef} className="h-1" />;
};

const ServerThreadList: FC<{ searchQuery: string; className?: string }> = ({ searchQuery, className }) => {
  const debounced = useDebounced(searchQuery, 300);
  const aui = useAui();
  const infinite = useInfiniteThreads(RESOURCE_ID_KEY, AGENT_ID, debounced, 20);
  const pinnedQ = useQuery({
    queryKey: [...memoryKeys.threads(RESOURCE_ID_KEY, AGENT_ID, 0, 100), "pinned"] as any,
    queryFn: () => listThreads(RESOURCE_ID_KEY, AGENT_ID, { perPage: 100, metadata: { pinned: true } as any }),
    staleTime: 10_000,
  });
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !infinite.hasNextPage || infinite.isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) infinite.fetchNextPage();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [infinite.hasNextPage, infinite.isFetchingNextPage, infinite]);
  const pages = infinite.data?.pages ?? [];
  const regular = pages.flatMap((p: any) => (Array.isArray(p) ? p : (p as any)?.threads ?? (p as any)?.data ?? []));
  const pinned = (() => {
    const d: any = pinnedQ.data;
    if (!d) return [];
    const arr = Array.isArray(d) ? d : d?.threads ?? d?.data ?? [];
    return arr;
  })();
  const switchTo = (id: string) => {
    try {
      (aui as unknown as { threads: { switchToThread: (id: string) => void } }).threads.switchToThread(id);
    } catch {}
  };
  if (infinite.isLoading) return <ThreadListSkeleton />;
  const merged = (() => {
    const pinnedIds = new Set(pinned.map((t: any) => t.id));
    const filtered = regular.filter((t: any) => !pinnedIds.has(t.id));
    return [...pinned, ...filtered];
  })();
  if (merged.length === 0) return <div className="text-muted-foreground px-2.5 py-4 text-sm">No threads found</div>;
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {merged.map((t: any) => (
        <button
          key={t.id}
          onClick={() => switchTo(t.id)}
          className="hover:bg-muted flex h-8 items-center rounded-md px-2.5 text-left text-sm"
        >
          {!!t.metadata?.pinned && <PinIcon className="text-muted-foreground me-1.5 size-3.5 shrink-0" />}
          <span className="min-w-0 flex-1 truncate">{t.title ?? "New Chat"}</span>
        </button>
      ))}
      <div ref={sentinelRef} className="h-1" />
      {infinite.isFetchingNextPage && <div className="px-2.5 py-2 text-xs text-muted-foreground">Loading more…</div>}
    </div>
  );
};

const DAY_IN_MS = 86_400_000;

const dateGroupLabel = (date: Date | undefined, startOfToday: number): string => {
  if (!date || date.getTime() >= startOfToday) return "Today";
  if (date.getTime() >= startOfToday - DAY_IN_MS) return "Yesterday";
  return "Earlier";
};

type ThreadListGroup = { label: string; indices: number[] };

const ThreadListItemGroups: FC<{ searchQuery?: string }> = ({ searchQuery = "" }) => {
  const threadIds = useAuiState((s) => s.threads.threadIds);
  const threadItems = useAuiState((s) => s.threads.threadItems);

  const query = searchQuery.trim().toLowerCase();

  const { filteredIndices, pinnedIndices, groups } = useMemo(() => {
    const itemsById = new Map(threadItems.map((item) => [item.id, item]));
    const dates = threadIds.map((id) => itemsById.get(id)?.lastMessageAt);
    const filteredIndices = threadIds
      .map((id, index) => ({ id, index }))
      .filter(
        ({ id }) =>
          !query || (itemsById.get(id)?.title || "New Chat").toLowerCase().includes(query),
      )
      .map(({ index }) => index);
    const isPinned = (idx: number) =>
      !!(itemsById.get(threadIds[idx]) as any)?.custom?.pinned;
    const pinnedIndices = filteredIndices.filter(isPinned);
    const regularIndices = filteredIndices.filter((i) => !isPinned(i));
    if (!regularIndices.some((index) => dates[index])) {
      return { filteredIndices, pinnedIndices, groups: null as ThreadListGroup[] | null, regularIndices };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const time = (index: number) => dates[index]?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const sorted = [...regularIndices].sort((a, b) => time(b) - time(a));

    const result: ThreadListGroup[] = [];
    for (const index of sorted) {
      const label = dateGroupLabel(dates[index], startOfToday);
      const lastGroup = result[result.length - 1];
      if (lastGroup?.label === label) {
        lastGroup.indices.push(index);
      } else {
        result.push({ label, indices: [index] });
      }
    }
    return { filteredIndices, pinnedIndices, groups: result, regularIndices } as any;
  }, [threadIds, threadItems, query]);

  if (query && filteredIndices.length === 0) {
    return (
      <div data-slot="aui_thread-list-empty" className="text-muted-foreground px-2.5 py-4 text-sm">
        No threads found
      </div>
    );
  }

  const pinnedBlock =
    pinnedIndices.length > 0 ? (
      <>
        <div
          data-slot="aui_thread-list-group-label"
          className="text-muted-foreground flex items-center gap-1 px-2.5 pt-2 pb-1 text-xs font-medium"
        >
          <PinIcon className="size-3" />
          Pinned
        </div>
        {pinnedIndices.map((index: number) => (
          <ThreadListPrimitive.ItemByIndex
            key={threadIds[index]}
            index={index}
            components={{ ThreadListItem }}
          />
        ))}
      </>
    ) : null;

  if (!groups) {
    return (
      <>
        {pinnedBlock}
        {(groups === null
          ? (filteredIndices as number[]).filter(
              (i: number) => !pinnedIndices.includes(i),
            )
          : []
        ).map((index: number) => (
          <ThreadListPrimitive.ItemByIndex
            key={threadIds[index]}
            index={index}
            components={{ ThreadListItem }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {pinnedBlock}
      {groups!.map((group: ThreadListGroup) => (
        <Fragment key={group.label}>
          <div
            data-slot="aui_thread-list-group-label"
            className="text-muted-foreground px-2.5 pt-3 pb-1 text-xs font-medium"
          >
            {group.label}
          </div>
          {group.indices.map((index: number) => (
            <ThreadListPrimitive.ItemByIndex
              key={threadIds[index]}
              index={index}
              components={{ ThreadListItem }}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
};

export const ThreadListNew = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Button> & { labelClassName?: string }
>(({ className, labelClassName, children, ...props }, ref) => {
  return (
    <ThreadListPrimitive.New
      render={
        <Button
          ref={ref}
          variant="ghost"
          data-slot="aui_thread-list-new"
          className={cn(
            "hover:bg-muted data-active:bg-muted h-8 justify-start gap-2 rounded-md px-2.5 text-sm font-normal",
            className,
          )}
          {...props}
        />
      }
    >
      {children ?? (
        <>
          <PlusIcon data-slot="aui_thread-list-new-icon" className="size-4 shrink-0" />
          <span
            data-slot="aui_thread-list-new-label"
            className={cn("whitespace-nowrap", labelClassName)}
          >
            New Thread
          </span>
        </>
      )}
    </ThreadListPrimitive.New>
  );
});

ThreadListNew.displayName = "ThreadListNew";

const ThreadListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          data-slot="aui_thread-list-skeleton-wrapper"
          className="flex h-8 items-center px-2.5"
        >
          <Skeleton data-slot="aui_thread-list-skeleton" className="h-3.5 w-full" />
        </div>
      ))}
    </div>
  );
};

export const ThreadListItem: FC = () => {
  const isRunning = useAuiState((s) => s.threadListItem.isRunning);
  const isPinned = useAuiState((s) => !!(s.threadListItem.custom as any)?.pinned);
  const title = useAuiState((s) => (s.threadListItem as unknown as { title?: string }).title ?? "");
  const isBranched = title.endsWith(" (clone)");
  const thread = useAuiState((s) => s.threadListItem as any);
  const { onMouseEnter, onMouseLeave } = useHoverPrefetchThread(thread.remoteId ?? thread.id);
  const [isRenaming, setIsRenaming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (isRenaming || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    triggerRef.current?.focus();
  }, [isRenaming]);

  return (
    <ThreadListItemPrimitive.Root
      data-slot="aui_thread-list-item"
      className="group hover:bg-muted focus-visible:bg-muted data-active:bg-muted has-focus-visible:bg-muted has-data-[state=open]:bg-muted relative flex h-8 items-center rounded-md transition-colors focus-visible:outline-none"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isRenaming ? (
        <ThreadListItemRename
          onDone={(restoreFocus) => {
            restoreFocusRef.current = restoreFocus;
            setIsRenaming(false);
          }}
        />
      ) : (
        <ThreadListItemPrimitive.Trigger
          ref={triggerRef}
          data-slot="aui_thread-list-item-trigger"
          className="focus-visible:ring-ring/50 flex h-full min-w-0 flex-1 items-center rounded-md px-2.5 text-start text-sm outline-none group-hover:pe-9 group-has-focus-visible:pe-9 group-has-data-[state=open]:pe-9 group-data-active:pe-9 focus-visible:ring-1"
        >
          {isBranched && (
            <GitBranchIcon
              data-slot="aui_thread-list-item-branched"
              className="text-muted-foreground me-1.5 size-3.5 shrink-0"
            />
          )}
          {isPinned && (
            <PinIcon
              data-slot="aui_thread-list-item-pinned"
              className="text-muted-foreground me-1.5 size-3.5 shrink-0"
            />
          )}
          {isRunning && (
            <Loader2Icon
              aria-hidden
              data-slot="aui_thread-list-item-running"
              className="text-muted-foreground me-1.5 size-3.5 shrink-0 animate-spin"
            />
          )}
          <span data-slot="aui_thread-list-item-title" className="min-w-0 flex-1 truncate">
            <ThreadListItemPrimitive.Title fallback="New Chat" />
          </span>
          {isRunning && <span className="sr-only">Running</span>}
        </ThreadListItemPrimitive.Trigger>
      )}
      <ThreadListItemMore onRename={() => setIsRenaming(true)} />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemRename: FC<{
  onDone: (restoreFocus: boolean) => void;
}> = ({ onDone }) => {
  const aui = useAui();
  const title = useAuiState((s) => s.threadListItem.title) ?? "";
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const commit = (restoreFocus: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;

    const next = value.trim();
    if (!next || next === title) {
      onDone(restoreFocus);
      return;
    }

    // Deferred so a synchronous throw lands on the rejection path too.
    Promise.resolve()
      .then(() => aui.threadListItem.rename(next))
      .then(
        () => onDone(restoreFocus),
        () => {
          settledRef.current = false;
          if (restoreFocus) inputRef.current?.focus();
        },
      );
  };

  const cancel = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onDone(true);
  };

  return (
    <Input
      ref={inputRef}
      autoFocus
      data-slot="aui_thread-list-item-rename"
      aria-label="Rename thread"
      value={value}
      className="h-7 min-w-0 flex-1 ps-2.5 pe-9 text-sm"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
    />
  );
};

const ThreadListItemMore: FC<{ onRename: () => void }> = ({ onRename }) => {
  const isPinned = useAuiState((s) => !!(s.threadListItem.custom as any)?.pinned);
  const aui = useAui();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);
  const handleTogglePin = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const state: any = aui.threadListItem.getState();
      const remoteId = state.remoteId ?? state.id;
      if (!remoteId || state.status === "new") return;
      const api: any = aui.threadListItem as any;
      if (typeof api.updateCustom === "function") {
        await api.updateCustom({ pinned: !isPinned });
      } else {
        if (isPinned) await unpinThread(RESOURCE_ID_KEY, AGENT_ID, remoteId);
        else await pinThread(RESOURCE_ID_KEY, AGENT_ID, remoteId);
        await queryClient.invalidateQueries({ queryKey: memoryKeys.threads(RESOURCE_ID_KEY, AGENT_ID) });
        await queryClient.invalidateQueries({ queryKey: memoryKeys.thread(remoteId, AGENT_ID) });
      }
    } finally {
      setIsToggling(false);
    }
  };
  return (
    <ThreadListItemMorePrimitive.Root sharedFocusGroup>
      <ThreadListItemMorePrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            data-slot="aui_thread-list-item-more"
            className="data-[state=open]:bg-accent absolute end-1.5 top-1/2 size-6 -translate-y-1/2 p-0 opacity-0 group-hover:opacity-100 group-has-focus-visible:opacity-100 group-data-active:opacity-100 data-[state=open]:opacity-100"
          />
        }
      >
        <MoreHorizontalIcon className="size-3.5" />
        <span className="sr-only">More options</span>
      </ThreadListItemMorePrimitive.Trigger>
      <ThreadListItemMorePrimitive.Content
        side="right"
        align="start"
        sideOffset={6}
        data-slot="aui_thread-list-item-more-content"
        className="bg-popover text-popover-foreground data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-xl border p-1.5"
      >
        <ThreadListItemMorePrimitive.Item
          data-slot="aui_thread-list-item-more-item"
          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none"
          onSelect={handleTogglePin}
        >
          {isPinned ? <PinOffIcon className="size-4" /> : <PinIcon className="size-4" />}
          {isPinned ? "Unpin" : "Pin"}
        </ThreadListItemMorePrimitive.Item>
        <ThreadListItemMorePrimitive.Item
          data-slot="aui_thread-list-item-more-item"
          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none"
          onSelect={onRename}
        >
          <PencilIcon className="size-4" />
          Rename
        </ThreadListItemMorePrimitive.Item>
        <ThreadListItemPrimitive.Archive
          render={
            <ThreadListItemMorePrimitive.Item
              data-slot="aui_thread-list-item-more-item"
              className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none"
            />
          }
        >
          <ArchiveIcon className="size-4" />
          Archive
        </ThreadListItemPrimitive.Archive>
        <ThreadListItemPrimitive.Delete
          render={
            <ThreadListItemMorePrimitive.Item
              data-slot="aui_thread-list-item-more-item"
              className="text-red-500 hover:bg-red-500/15 hover:text-red-600 focus:bg-red-500/15 focus:text-red-600 data-disabled:opacity-100 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium opacity-100 outline-none select-none"
            />
          }
        >
          <TrashIcon className="size-4" />
          Delete
        </ThreadListItemPrimitive.Delete>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  );
};
