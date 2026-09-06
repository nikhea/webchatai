import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function getKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "better-auth-secret-12345678901234567890";
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${enc.toString("base64")}.${tag.toString("base64")}`;
}

export function decrypt(cipherText: string): string {
  const key = getKey();
  const [ivB64, encB64, tagB64] = cipherText.split(".");
  if (!ivB64 || !encB64 || !tagB64) throw new Error("Invalid cipher");
  const iv = Buffer.from(ivB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export const SUPPORTED_PROVIDERS = [
  { id: "openai", label: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
  { id: "google", label: "Google AI", placeholder: "AIza..." },
  { id: "groq", label: "Groq", placeholder: "gsk_..." },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-..." },
  { id: "cerebras", label: "Cerebras", placeholder: "csk-..." },
  { id: "nvidia", label: "NVIDIA", placeholder: "nvapi-..." },
  { id: "ollama", label: "Ollama Cloud", placeholder: "ollama-..." },
  { id: "tavily", label: "Tavily", placeholder: "tvly-..." },
] as const;
