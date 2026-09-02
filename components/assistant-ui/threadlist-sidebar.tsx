import type * as React from "react";
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
  MessagesSquare,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/assistant-ui/thread-list";
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
  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={
                  <a href="https://assistant-ui.com" target="_blank" rel="noopener noreferrer" />
                }
              >
                <div className="aui-sidebar-header-icon-wrapper bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <MessagesSquare className="aui-sidebar-header-icon size-4" />
                </div>
                <div className="aui-sidebar-header-heading me-6 flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-header-title font-semibold">assistant-ui</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
                <AvatarFallback className="bg-muted text-xs font-medium">I</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-none">
                <span className="truncate text-sm font-medium">imonikhea</span>
                <span className="text-muted-foreground truncate text-xs">Free</span>
              </div>
              <ChevronRightIcon className="text-muted-foreground size-3.5 shrink-0 rotate-90 opacity-60" />
            </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={8} align="start" className="w-[18rem]">
            <DropdownMenuLabel className="text-muted-foreground truncate px-2.5 py-1.5 text-xs font-normal">
              imonikheaugbodaga@gmail.com
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <SettingsIcon />
              <span className="flex-1">Settings</span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                Ctrl <CommandIcon className="size-3" /> ,
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GlobeIcon />
              Language
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircleIcon />
              Get help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <PlusIcon />
              Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DownloadIcon />
              Get apps and extensions
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GraduationCapIcon />
              <span className="flex-1">Claude Academy</span>
              <span className="bg-blue-600 text-white rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                New
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <InfoIcon />
              <span className="flex-1">Learn more</span>
              <ChevronRightIcon className="size-3.5 opacity-50" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <KeyRoundIcon />
              <div className="flex flex-1 flex-col leading-none">
                <span>Get API keys</span>
                <span className="text-muted-foreground text-xs">on Claude Platform</span>
              </div>
              <ExternalLinkIcon className="size-3.5 opacity-60" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
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
