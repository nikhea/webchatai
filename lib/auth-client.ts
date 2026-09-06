"use client";
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, usernameClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  plugins: [adminClient(), organizationClient(), usernameClient(), apiKeyClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
