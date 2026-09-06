"use client";

import type * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  ChevronRightIcon,
  CommandIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
  GraduationCapIcon,
  HelpCircleIcon,
  InfoIcon,
  KeyRoundIcon,
  LayoutGridIcon,
  LogOutIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SquarePenIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useAui } from "@assistant-ui/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ThreadListSidebar({
  onSearchOpen,
  ...props
}: React.ComponentProps<typeof Sidebar> & { onSearchOpen?: () => void }) {
  const { toggleSidebar } = useSidebar();
  const aui = useAui();
  const router = useRouter();
  const { data: session } = (authClient as any).useSession();
  const user = (session?.user as any) || {};
  const email = user?.email || "loading...";
  const displayName = user?.name || user?.username || "User";
  const shortName = displayName.split(" ")[0]?.slice(0, 12) || "User";
  const initials = (displayName || email).slice(0, 1).toUpperCase();
  const plan = (user?.role as string) || "Free";
  const username = user?.username ? `@${user.username}` : "";

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b-0 p-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="grid size-7 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <PanelLeftIcon className="size-4" />
            </button>
            <span className="text-pink-300/90 text-[22px] font-semibold tracking-tight">T3.chat</span>
            <button
              type="button"
              aria-label="New chat"
              onClick={() => (aui as unknown as { threads: { switchToNewThread: () => void } }).threads.switchToNewThread()}
              className="grid size-7 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <SquarePenIcon className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => (aui as unknown as { threads: { switchToNewThread: () => void } }).threads.switchToNewThread()}
            className="flex w-full items-center justify-center rounded-xl border border-pink-900/30 bg-[#3a0a2a]/60 px-4 py-2.5 text-sm font-medium text-pink-200/90 hover:bg-[#4a0f35]/70 hover:text-pink-100 transition-colors"
          >
            New Chat
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>
      {props.collapsible !== "none" && <SidebarRail />}
      <SidebarFooter className="aui-sidebar-footer border-t p-2">
        <div className="flex w-full items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-7 shrink-0">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={displayName} className="size-7 rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-muted text-xs font-medium">{initials}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-none">
                <span className="truncate text-sm font-medium">{shortName}</span>
                <span className="text-muted-foreground truncate text-xs capitalize">
                  {plan} {username}
                </span>
              </div>
              <ChevronRightIcon className="text-muted-foreground size-3.5 shrink-0 rotate-90 opacity-60" />
            </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={8} align="start" className="w-[18rem]">
            <DropdownMenuLabel className="text-muted-foreground truncate px-2.5 py-1.5 text-xs font-normal">
              {email}
            </DropdownMenuLabel>
            {username && (
              <div className="px-2.5 pb-1 text-xs text-muted-foreground">{username} • {plan}</div>
            )}
            <DropdownMenuItem
              render={<Link href="/settings" />}
            >
              <SettingsIcon />
              <span className="flex-1">Settings</span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                Ctrl <CommandIcon className="size-3" /> ,
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings/contact" />}>
              <HelpCircleIcon />
              Get help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings/account" />}>
              <PlusIcon />
              Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DownloadIcon />
              Get apps and extensions
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings/shortcuts" />}>
              <InfoIcon />
              <span className="flex-1">Learn more</span>
              <ChevronRightIcon className="size-3.5 opacity-50" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings/api-keys" />}>
              <KeyRoundIcon />
              <div className="flex flex-1 flex-col leading-none">
                <span>Manage API Keys</span>
                <span className="text-muted-foreground text-xs">Create and manage keys</span>
              </div>
              <ChevronRightIcon className="size-3.5 opacity-60" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut();
                router.push("/login");
                router.refresh();
              }}
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="Downloads"
              className="grid size-7 place-items-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <DownloadIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Search"
              onClick={() => onSearchOpen?.()}
              className="grid size-7 place-items-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <SearchIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Apps"
              className="grid size-7 place-items-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LayoutGridIcon className="size-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
