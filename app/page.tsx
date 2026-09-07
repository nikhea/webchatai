"use client";

import { Assistant } from "./assistant";

export default function Home() {
  return (
    <div suppressHydrationWarning>
      <Assistant threadId={undefined} />
    </div>
  );
}
