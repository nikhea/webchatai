"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, Trash2, FileText, ExternalLink } from "lucide-react";

type FileItem = {
  id: string;
  name: string;
  mime: string;
  created: string;
  scope: "chat" | "canvas";
};

const files: FileItem[] = [
  { id: "1", name: "Pasted Text 1", mime: "text/plain", created: "Mar 25, 2026", scope: "chat" },
  { id: "2", name: "Pasted Text 1", mime: "text/plain", created: "Mar 25, 2026", scope: "chat" },
  { id: "3", name: "Report.pdf", mime: "application/pdf", created: "Mar 24, 2026", scope: "chat" },
  { id: "4", name: "Image.png", mime: "image/png", created: "Mar 22, 2026", scope: "canvas" },
];

const allowedFormats = [
  { group: "Images", items: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/*"] },
  { group: "Text", items: ["text/plain (.txt)", "text/csv (.csv)", "text/markdown (.md)", "text/html", "text/xml", "application/json (.json)"] },
  { group: "Documents", items: ["application/pdf (.pdf)", ".doc/.docx", ".xls/.xlsx", ".ppt/.pptx"] },
];

export default function AttachmentsPage() {
  const [tab, setTab] = React.useState<"chat" | "canvas">("chat");
  const [filter, setFilter] = React.useState<string>("All files");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const filtered = React.useMemo(() => {
    let d = files.filter((f) => f.scope === tab);
    if (filter !== "All files") d = d.filter((f) => f.mime === filter);
    return d;
  }, [tab, filter]);

  const columns: ColumnDef<FileItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={(table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false) as never}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          className="border-zinc-700"
        />
      ),
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} className="border-zinc-700" />,
    },
    {
      accessorKey: "name",
      header: () => <span className="text-xs font-medium text-zinc-300">Name</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded bg-zinc-800 text-zinc-400">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm text-zinc-100">
              {row.original.name} <ExternalLink className="size-3 text-zinc-500" />
            </div>
            <div className="text-xs text-zinc-500">{row.original.mime}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created",
      header: () => (
        <button onClick={() => setSorting([{ id: "created", desc: false }])} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300">
          Created <ArrowUpDown className="size-3.5" />
        </button>
      ),
      cell: ({ row }) => <span className="text-xs text-zinc-300">{row.getValue("created")}</span>,
    },
    {
      id: "actions",
      cell: () => (
        <Button variant="ghost" size="icon-sm" className="bg-[#2a1212] text-zinc-400 hover:bg-[#3a1818] hover:text-red-300">
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-white">Attachments</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Manage your uploaded files and attachments. Note that deleting files here will remove them from the relevant threads, but not delete the threads. This may lead to unexpected behavior if you delete a file that is still being used in a thread.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg bg-[#1a1219] p-1">
          <button onClick={() => setTab("chat")} className={`rounded-md px-3 py-1 text-xs font-bold ${tab === "chat" ? "bg-[#2a2430] text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
            Chat
          </button>
          <button onClick={() => setTab("canvas")} className={`rounded-md px-3 py-1 text-xs font-bold ${tab === "canvas" ? "bg-[#2a2430] text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
            Canvas
          </button>
        </div>
      </div>

      <div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-7 rounded-md border border-zinc-800 bg-[#1a1219] px-2 text-xs text-zinc-300">
          <option>All files</option>
          <option>text/plain</option>
          <option>application/pdf</option>
          <option>image/png</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0b080b]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-zinc-800 hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="h-8 bg-transparent px-3">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-zinc-800 bg-[#0b080b] hover:bg-zinc-900/60">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-zinc-500">
                  No files in {tab}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="-mb-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-800 bg-[#1a1219] px-2.5 text-xs text-zinc-500" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className="size-3.5" /> Previous
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-800 bg-[#1a1219] px-2.5 text-xs text-zinc-300" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-800 bg-[#0b080b] p-4">
        <h3 className="text-sm font-bold text-white">Allowed formats</h3>
        <p className="mt-1 text-xs text-zinc-400">Derived from your attachment adapter — any file matching these types can be attached in the composer.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {allowedFormats.map((g) => (
            <div key={g.group} className="rounded-lg bg-[#1a1219] p-3">
              <div className="text-xs font-bold text-zinc-200">{g.group}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <span key={it} className="rounded bg-[#2a2430] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] font-mono text-zinc-500">accept: image/*, text/plain, text/csv, text/markdown, application/json, application/pdf, .doc/.docx, .xls/.xlsx, .ppt/.pptx, etc.</p>
      </section>
    </div>
  );
}
