"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Archive,
  Download,
  Upload,
  Pin,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  GitFork,
  Eye,
  Pencil,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useThreads } from "@/app/queries/memory.query";
import { AGENT_ID, RESOURCE_ID_KEY } from "@/lib/mastra/memory-queries";

type Chat = {
  id: string;
  title: string;
  profile: string;
  date: string;
  pinned?: boolean;
};

type Shared = {
  id: string;
  title: string;
  link?: string;
  forks: number;
  views: number;
  date: string;
  expanded?: boolean;
};

const sharedInitial: Shared[] = [
  { id: "s1", title: "Talent Filter Not Working Despite Matching Role and No Ma...", link: "https://t3.chat/share/85h70dvcvj", forks: 0, views: 1, date: "about 5 hours ago", expanded: true },
  { id: "s2", title: "Mastra AI Summary", link: "https://t3.chat/share/5gdvjzhr1i", forks: 0, views: 0, date: "3 months ago", expanded: true },
  { id: "s3", title: "Meaning of Life", forks: 0, views: 0, date: "", expanded: false },
];

function formatDate(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `about ${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

export default function HistoryPage() {
  const [rowSelection, setRowSelection] = React.useState({});
  const [shared, setShared] = React.useState<Shared[]>(sharedInitial);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading, isFetching, isError } = useThreads(RESOURCE_ID_KEY, AGENT_ID, {
    page: pagination.pageIndex,
    perPage: pagination.pageSize,
  });

  const threadsRaw: any = data as any;
  const rows: Chat[] = React.useMemo(() => {
    const list: any[] = Array.isArray(threadsRaw) ? threadsRaw : threadsRaw?.threads ?? threadsRaw?.data ?? threadsRaw?.items ?? [];
    return list.map((t: any) => ({
      id: t.id ?? t.threadId ?? t.thread_id ?? Math.random().toString(36).slice(2),
      title: t.title ?? "New Thread",
      profile: "Default",
      date: formatDate(t.updatedAt ?? t.createdAt ?? t.created_at),
      pinned: !!(t.metadata?.pinned ?? t.pinned),
    }));
  }, [threadsRaw]);

  const hasNextPage = rows.length >= pagination.pageSize;
  const hasPrevPage = pagination.pageIndex > 0;

  const columns: ColumnDef<Chat>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={(table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false) as never}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="border-zinc-700 data-[checked]:bg-zinc-700 data-[checked]:border-zinc-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" className="border-zinc-700 data-[checked]:bg-zinc-700 data-[checked]:border-zinc-600" />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: () => <span className="text-xs font-medium text-[rgb(231,208,221)]">Title</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm text-[rgb(249,248,251)]">{row.getValue("title")}</span>
          {row.original.pinned && <Pin className="size-3.5 shrink-0 text-pink-600" />}
        </div>
      ),
    },
    {
      accessorKey: "profile",
      header: () => <span className="text-xs font-medium text-[rgb(231,208,221)]">Profile</span>,
      cell: ({ row }) => <span className="text-xs text-zinc-400">{row.getValue("profile")}</span>,
    },
    {
      accessorKey: "date",
      header: () => <span className="sr-only">Date</span>,
      cell: ({ row }) => <span className="whitespace-nowrap text-xs text-zinc-400">{row.getValue("date")}</span>,
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: -1,
    state: { rowSelection, pagination },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
  });

  const toggleShared = (id: string) => setShared((s) => s.map((x) => (x.id === id ? { ...x, expanded: !x.expanded } : x)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 text-[rgb(249,248,251)]">
        <div>
          <h1 className="text-xl font-bold text-[rgb(249,248,251)]">Chat History</h1>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">You can back up your chat history from here to restore or transfer your conversations later. Importing will NOT delete any of your existing conversations.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-zinc-800 bg-[#1a1219] p-1">
            <DropdownMenuItem className="gap-2 text-sm text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"><Archive className="size-4" /> Archive all</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"><Upload className="size-4" /> Export all</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"><Download className="size-4" /> Import</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4 text-[rgb(249,248,251)]">
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0b080b]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-zinc-800 hover:bg-transparent">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="h-8 bg-transparent px-3 py-2" style={{ width: header.id === "select" ? 36 : header.id === "profile" ? 80 : header.id === "date" ? 130 : undefined }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-800">
                    <TableCell colSpan={4} className="px-3 py-3"><div className="h-4 w-full animate-pulse rounded bg-zinc-800" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow className="border-zinc-800"><TableCell colSpan={4} className="px-3 py-8 text-center text-sm text-zinc-500">Failed to load history</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow className="border-zinc-800"><TableCell colSpan={4} className="px-3 py-8 text-center text-sm text-zinc-500">No conversations yet</TableCell></TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-zinc-800 bg-[#0b080b] hover:bg-zinc-900/60 data-[state=selected]:bg-zinc-900">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-2.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {isFetching && !isLoading && <p className="text-xs text-zinc-500">Loading...</p>}
      </div>

      <div className="-mb-3 flex items-center gap-2 justify-between text-[rgb(249,248,251)]">
        <Button variant="outline" size="sm" className="h-7 gap-1.5 border-zinc-800 bg-[#1a1219] px-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
          <Archive className="size-3.5" /> Open Archive
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Page {pagination.pageIndex + 1}</span>
          <Button variant="outline" type="button" size="sm" className="h-7 gap-1 border-zinc-800 bg-[#1a1219] px-2.5 text-xs text-zinc-500 disabled:opacity-40" onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))} disabled={!hasPrevPage}><ChevronLeft className="size-3.5" /> Previous</Button>
          <Button variant="outline" type="button" size="sm" className="h-7 gap-1 border-zinc-800 bg-[#1a1219] px-2.5 text-xs text-zinc-300 disabled:opacity-40" onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))} disabled={isLoading || (!hasNextPage && rows.length === 0 && pagination.pageIndex > 0)}>Next <ChevronRight className="size-3.5" /></Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-[rgb(231,208,221)]">Manage your shared threads here.</p>

      <div className="space-y-4 text-[rgb(249,248,251)]">
        <h2 className="text-lg font-bold text-[rgb(249,248,251)] -mb-2">Shared Threads</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0b080b]">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="h-8 w-9 px-3"><Checkbox className="border-zinc-700" /></TableHead>
                <TableHead className="h-8 px-3 text-xs font-medium text-[rgb(231,208,221)]">Title</TableHead>
                <TableHead className="h-8 w-8 px-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shared.map((s) => (
                <React.Fragment key={s.id}>
                  <TableRow className="border-zinc-800 bg-[#0b080b] hover:bg-zinc-900/60">
                    <TableCell className="px-3 py-2.5"><Checkbox className="border-zinc-700" /></TableCell>
                    <TableCell className="px-3 py-2.5"><span className="text-sm text-[rgb(249,248,251)]">{s.title}</span></TableCell>
                    <TableCell className="px-3 py-2.5 text-right">
                      <button onClick={() => toggleShared(s.id)} className="grid size-6 place-items-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                        {s.expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                    </TableCell>
                  </TableRow>
                  {s.expanded && s.link && (
                    <TableRow className="border-zinc-800 bg-[#0b080b] hover:bg-zinc-900/60">
                      <TableCell className="px-3 py-2 pl-10"><Checkbox className="border-zinc-700" /></TableCell>
                      <TableCell className="px-3 py-2"><a href={s.link} className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200">{s.link}</a></TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center justify-end gap-3 text-xs text-zinc-400">
                          <span className="inline-flex items-center gap-1"><GitFork className="size-3" />{s.forks}</span>
                          <span className="inline-flex items-center gap-1"><Eye className="size-3" />{s.views}</span>
                          <span className="whitespace-nowrap">{s.date}</span>
                          <button className="grid size-6 place-items-center rounded hover:bg-zinc-800"><Pencil className="size-3" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="-mb-3 flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-800 bg-[#1a1219] px-2.5 text-xs text-zinc-500" disabled><ChevronLeft className="size-3.5" /> Previous</Button>
          <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-800 bg-[#1a1219] px-2.5 text-xs text-zinc-300">Next <ChevronRight className="size-3.5" /></Button>
        </div>
      </div>

    </div>
  );
}
