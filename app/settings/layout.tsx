import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsNav } from "@/components/settings-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsSignOut } from "@/components/settings-signout";
import { SettingsProfileCard } from "@/components/settings-profile-card";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const user = session?.user as any;
  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();
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
            <SettingsSignOut />
          </div>
        </header>
      </div>

      <div className="mx-auto flex max-w-[1280px] gap-8 px-6 py-8">
        <aside className="hidden w-[320px] shrink-0 flex-col gap-6 md:flex">
          <SettingsProfileCard
            user={user}
            initials={initials}
            fallbackName={user?.name || "User"}
            email={user?.email || ""}
            role={(user?.role as string) || "user"}
            username={user?.username}
            image={user?.image}
          />

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
