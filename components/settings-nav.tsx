"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account", href: "/settings/account" },
  { id: "customization", label: "Customization", href: "/settings/customization" },
  { id: "history", label: "History & Sync", href: "/settings/history" },
  { id: "models", label: "Models", href: "/settings/models" },
  { id: "api-keys", label: "API Keys", href: "/settings/api-keys" },
  { id: "attachments", label: "Attachments", href: "/settings/attachments" },
  { id: "shortcuts", label: "Shortcuts", href: "/settings/shortcuts" },
  { id: "contact", label: "Contact Us", href: "/settings/contact" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden rounded-lg bg-secondary/80 p-1 text-xs font-bold [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
      {tabs.map((t) => {
        const active = pathname === t.href || (t.href === "/settings/models" && pathname === "/settings");
        return (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md bg-transparent px-3 py-1.5 font-bold text-zinc-400 transition-colors hover:bg-sidebar-accent/40 hover:text-zinc-100",
              active && "bg-background text-zinc-100",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
