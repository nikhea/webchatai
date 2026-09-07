"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export function SettingsProfileCard({
  user,
  initials,
  fallbackName,
  email,
  role,
  username,
  image,
}: {
  user: any;
  initials: string;
  fallbackName: string;
  email: string;
  role: string;
  username?: string;
  image?: string;
}) {
  const [org, setOrg] = useState<any>(null);
  useEffect(() => {
    authClient.organization
      .getFullOrganization({ query: {} } as any)
      .then((res: any) => setOrg(res?.data || res))
      .catch(() => {});
  }, []);
  return (
    <div className="flex flex-col items-center text-center">
      <Avatar className="size-28 bg-[#0e8a8a] text-white">
        {image ? <AvatarImage src={image} alt={fallbackName} /> : null}
        <AvatarFallback className="bg-[#0e8a8a] text-6xl font-light text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <h2 className="mt-4 truncate text-lg font-semibold max-w-[280px]">{fallbackName}</h2>
      {username && <p className="text-sm text-zinc-400">@{username}</p>}
      <p className="truncate text-sm text-zinc-400 max-w-[280px]">{email}</p>
      <span className="mt-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs capitalize text-zinc-300">
        {role} {org?.name ? `• ${org.name}` : "• Free Plan"}
      </span>
      {user?.emailVerified !== undefined && (
        <span className={`mt-1 text-xs ${user.emailVerified ? "text-emerald-400" : "text-amber-400"}`}>
          {user.emailVerified ? "Verified" : "Unverified"}
        </span>
      )}
    </div>
  );
}
