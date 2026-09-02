"use client";

import { useState } from "react";
import { Check, Gauge, Sparkles, Search, Image as ImageIcon, Layers } from "lucide-react";

export default function AccountPage() {
  const [receipts, setReceipts] = useState(true);

  return (
    <div className="space-y-3 md:space-y-0">
      <div className="space-y-6 text-[#f9f8fb]">
        <div className="flex flex-row justify-between gap-2">
          <h1 className="text-xl font-bold text-[#f9f8fb]">Choose Your Plan</h1>
          <button className="shrink-0 rounded-md border border-zinc-800 bg-[#1a1219] px-4 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white">Manage Billing & Invoices</button>
        </div>

        <div className="mt-[36px] grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-[#0b080b] p-6">
            <h3 className="text-lg font-bold text-[#f9f8fb]">Free</h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-zinc-300">
              <li className="flex gap-2"><Gauge className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Small monthly limits for basic usage</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Basic models only</li>
            </ul>
            <button disabled className="mt-auto pt-6">
              <span className="block w-full rounded-md bg-[#1a1219] px-4 py-2 text-xs font-bold text-zinc-500">Current Plan</span>
            </button>
          </div>

          <div className="relative flex h-full flex-col rounded-xl border border-pink-900/50 bg-[#0b080b] p-6 ring-1 ring-pink-900/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink-700 px-3 py-1 text-[10px] font-bold text-white">Most Popular</span>
            <h3 className="text-lg font-bold text-[#f9f8fb]">Pro</h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-zinc-300">
              <li className="flex gap-2"><Gauge className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Expanded monthly limits for more flexibility</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Access to all models</li>
              <li className="flex gap-2"><Search className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> File uploads and web search</li>
              <li className="flex gap-2"><ImageIcon className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Image generation</li>
            </ul>
            <p className="mt-4 text-xs font-medium text-zinc-400">Price shown at checkout.</p>
            <button className="mt-3 w-full rounded-md bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-600">Upgrade</button>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-[#0b080b] p-6">
            <h3 className="text-lg font-bold text-[#f9f8fb]">Premier</h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-zinc-300">
              <li className="flex gap-2"><Gauge className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Over 10x Pro limits for power users with heavier usage</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Includes everything in Pro</li>
              <li className="flex gap-2"><Layers className="mt-0.5 size-3.5 shrink-0 text-pink-600" /> Concurrent image generations in canvas</li>
            </ul>
            <p className="mt-4 text-xs font-medium text-zinc-400">Price shown at checkout.</p>
            <button className="mt-3 w-full rounded-md bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-600">Upgrade</button>
          </div>
        </div>

        <div className="md:hidden text-[#f9f8fb] text-xs">Choose the plan that fits your usage. Upgrade anytime from billing.</div>

        <div className="mt-[36px] flex flex-col gap-5">
          <h2 className="text-2xl font-bold text-[#f9f8fb]">Billing Preferences</h2>
          <div className="flex items-center justify-between gap-7">
            <div className="flex flex-col gap-1.5">
              <div className="text-[18px] font-bold leading-tight text-[#f9f8fb]">Email me receipts</div>
              <div className="text-[15.5px] leading-relaxed text-zinc-400">Send receipts to your account email when a payment succeeds.</div>
            </div>
            <button onClick={() => setReceipts((v) => !v)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${receipts ? "bg-zinc-700" : "bg-zinc-800"}`} aria-pressed={receipts}>
              <span className={`inline-block size-5 transform rounded-full bg-white transition ${receipts ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <div className="mt-[36px] flex flex-col gap-7">
          <h2 className="text-2xl font-bold text-[#f9f8fb]">Security & Access</h2>
          <div className="flex flex-col gap-4">
            <h3 className="text-[18px] font-bold leading-tight text-[#f9f8fb]">Account Email</h3>
            <p className="text-[15.5px] leading-relaxed text-zinc-400">Change the email address associated with your account.</p>
            <button className="w-fit rounded-md border border-zinc-800 bg-[#1a1219] px-5 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white">Change Email</button>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-[18px] font-bold leading-tight text-[#f9f8fb]">Devices</h3>
            <p className="text-[15.5px] leading-relaxed text-zinc-400">Manage and sign out from other devices that are currently logged in to your account.</p>
            <button className="w-fit rounded-md border border-zinc-800 bg-[#1a1219] px-5 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white">View Devices</button>
          </div>
        </div>

        <section className="mt-[36px] flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-[16px] text-foreground outline-none ring-1 ring-destructive/10">
          <h2 className="text-xl font-bold text-[#f9f8fb]">Danger Zone</h2>
          <p className="text-[13px] leading-relaxed text-zinc-400">Permanently delete your account and all associated data.</p>
          <button className="h-9 w-fit rounded-md bg-[oklab(0.444_0.15785_0.0800782_/_0.2)] px-4 py-2 text-sm font-bold text-white hover:bg-[oklab(0.5_0.16_0.08_/_0.25)]">Delete Account</button>
        </section>
      </div>
    </div>
  );
}
