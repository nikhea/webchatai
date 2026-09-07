"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SettingsSignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="text-sm font-semibold text-zinc-200 hover:text-white"
    >
      Sign out
    </button>
  );
}
