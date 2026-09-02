export default function AccountPage() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-xl font-semibold">Account</h1>
      <p className="mt-2 text-sm text-zinc-400">Manage your account settings, email and password.</p>
      <div className="mt-6 grid gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm text-zinc-300">Email</div>
          <div className="mt-1 text-sm text-zinc-500">imonikheaugbodaga@gmail.com</div>
        </div>
      </div>
    </div>
  );
}
