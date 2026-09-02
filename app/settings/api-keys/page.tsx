import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ApiKeysPage() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-xl font-semibold">API Keys</h1>
      <p className="mt-2 text-sm text-zinc-400">Create and manage API keys for Claude Platform.</p>
      <div className="mt-6 flex gap-2">
        <Input placeholder="New key name" className="bg-zinc-950" />
        <Button>Create</Button>
      </div>
    </div>
  );
}
