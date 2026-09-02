import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SettingsNav } from "@/components/settings-nav";
import { ModeToggle } from "@/components/mode-toggle";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-transparent text-zinc-100">
      <div className="fixed inset-0 -z-50 bg-[rgb(19,19,20)] bg-gradient-to-b from-[#131314] to-[#21141e]" aria-hidden />
      <div className="h-[3px] w-full bg-indigo-600" aria-hidden />
      <div className="mx-auto max-w-[1280px] px-6">
        <header className="mt-[30px] flex h-14 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-white">
            <ArrowLeftIcon className="size-4" />
            Back to Chat
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <button className="text-sm font-semibold text-zinc-200 hover:text-white">Sign out</button>
          </div>
        </header>
      </div>

      <div className="mx-auto flex max-w-[1280px] gap-8 px-6 py-8">
        <aside className="hidden w-[320px] shrink-0 flex-col gap-6 md:flex">
          <div className="flex flex-col items-center text-center">
            <Avatar className="size-28 bg-[#0e8a8a] text-white">
              <AvatarFallback className="bg-[#0e8a8a] text-6xl font-light text-white">i</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 truncate text-lg font-semibold">imonikhea ugbod...</h2>
            <p className="truncate text-sm text-zinc-400">imonikheaugbodaga@gmail.com</p>
            <span className="mt-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">Free Plan</span>
          </div>

          <div className="rounded-sm border border-zinc-800 bg-[#0b080b] p-4">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-medium">Usage Limits</h3>
              <span className="grid size-5 place-items-center rounded-full border border-zinc-700 bg-[#21141e] text-[10px] text-zinc-500">i</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Base</span>
                <span className="text-zinc-500" />
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-zinc-800">
                <div className="h-1.5 w-[92%] rounded-full bg-pink-600" />
              </div>
            </div>
          </div>

          <div className="mt-[30px] rounded-sm border border-zinc-800 bg-[#0b080b] p-4">
            <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
            <div className="flex flex-col text-sm">
              <div className="mt-10 flex items-center justify-between">
                <span className="text-zinc-300">Search</span>
                <span className="rounded bg-[#21141e] px-1.5 py-0.5 font-mono text-xs text-zinc-400">Ctrl + K</span>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <span className="text-zinc-300">New Chat</span>
                <span className="rounded bg-[#21141e] px-1.5 py-0.5 font-mono text-xs text-zinc-400">Ctrl + Shift + O</span>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <span className="text-zinc-300">Toggle Sidebar</span>
                <span className="rounded bg-[#21141e] px-1.5 py-0.5 font-mono text-xs text-zinc-400">Ctrl + B</span>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <span className="text-zinc-300">Open Model Picker</span>
                <span className="rounded bg-[#21141e] px-1.5 py-0.5 font-mono text-xs text-zinc-400">Ctrl + /</span>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <span className="text-zinc-300">Delete Current Chat</span>
                <span className="rounded bg-[#21141e] px-1.5 py-0.5 font-mono text-xs text-zinc-400">Ctrl + Shift + ⌫</span>
              </div>
              <Link href="/settings/shortcuts" className="mt-6 text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200">
                Customize shortcuts
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <SettingsNav />
          {children}
        </div>
      </div>
    </div>
  );
}
