import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API = `${BASE}/api`;
export const TOKEN_KEY = "trustmule_token";

export function fileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/")) return `${BASE}${path}`;
  return `${API}/files/${path}`;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = (data && data.detail) || (typeof data === "string" ? data : "Request failed");
    throw new Error(detail);
  }
  return data;
}

export const api = {
  async get(path: string) {
    const res = await fetch(`${API}${path}`, { headers: { ...(await authHeader()) } });
    return handle(res);
  },
  async post(path: string, body?: any) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handle(res);
  },
  async patch(path: string, body?: any) {
    const res = await fetch(`${API}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handle(res);
  },
  async uploadImage(uri: string): Promise<string> {
    const form = new FormData();
    const name = `photo_${Date.now()}.jpg`;
    // web needs a real Blob; native needs the {uri,name,type} shape
    // @ts-ignore
    if (typeof window !== "undefined" && uri.startsWith("blob:")) {
      const blob = await (await fetch(uri)).blob();
      form.append("file", blob, name);
    } else if (typeof document !== "undefined" && !uri.startsWith("file:")) {
      const blob = await (await fetch(uri)).blob();
      form.append("file", blob, name);
    } else {
      // @ts-ignore native multipart shape
      form.append("file", { uri, name, type: "image/jpeg" });
    }
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { ...(await authHeader()) },
      body: form,
    });
    const data = await handle(res);
    return data.path;
  },
};
