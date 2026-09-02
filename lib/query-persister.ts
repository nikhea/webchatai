"use client";

import { get, set, del, entries } from "idb-keyval";
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";

const idbStorage = {
  getItem: async (key: string) => (await get(key)) ?? null,
  setItem: async (key: string, value: string) => {
    await set(key, value);
  },
  removeItem: async (key: string) => {
    await del(key);
  },
  entries: async () => {
    const all = await entries();
    return all as Array<[string, string]>;
  },
};

export const BUSTER = "praxis-v3";

export const queryPersister = experimental_createQueryPersister({
  storage: idbStorage,
  maxAge: 1000 * 60 * 60 * 24,
  prefix: "praxis-query",
  buster: BUSTER,
  refetchOnRestore: "always",
});

export const persistFilter = {
  predicate: (query: { queryKey: unknown[] }) => {
    const key = query.queryKey as unknown[];
    if (key[0] !== "memory") return false;
    if (key[1] === "thread" && key[3] === "messages") return false;
    return true;
  },
};
