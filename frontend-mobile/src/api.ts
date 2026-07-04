import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Book, Comment, Loan, User } from "./types";

export const API_BASE = "https://web-library-v2.onrender.com/api";

const TOKEN_KEY = "librumi_token";

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const t = await AsyncStorage.getItem(TOKEN_KEY);
  cachedToken = t;
  return t;
}
export async function setToken(t: string | null) {
  cachedToken = t;
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

/* ---- Auth ---- */
export const authApi = {
  register: (body: { username: string; password: string; full_name?: string; email?: string; library_card_id?: string }) =>
    req<{ token: string; user: { id: number; username: string; role: string }; needs_profile: boolean }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (username: string, password: string) =>
    req<{ token: string; user: { id: number; username: string; role: string }; needs_profile: boolean }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => req<{ user: User | null }>("/auth/me"),
  logout: () => req<{ success: boolean }>("/auth/logout", { method: "POST" }),
};

/* ---- Profile ---- */
export const profileApi = {
  get: () => req<{ profile: User }>("/profile"),
  update: (body: { full_name: string; library_card_id: string; email: string }) =>
    req<{ profile: User; profile_complete: boolean }>("/profile", { method: "PUT", body: JSON.stringify(body) }),
};

/* ---- Books ---- */
export const booksApi = {
  list: (params: { category?: string; search?: string; featured?: number; limit?: number; page?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && v !== "" && qs.append(k, String(v)));
    const s = qs.toString();
    return req<{ items: Book[]; total: number; page: number; limit: number; pages: number }>("/books" + (s ? "?" + s : ""));
  },
  detail: (id: number) => req<Book>("/books/" + id),
  categories: () => req<string[]>("/categories"),
};

/* ---- Comments ---- */
export const commentsApi = {
  ofBook: (id: number) => req<{ items: Comment[] }>("/books/" + id + "/comments"),
  create: (id: number, body: { name: string; email: string; content: string; rating: number }) =>
    req<Comment>("/books/" + id + "/comments", { method: "POST", body: JSON.stringify(body) }),
  reviews: (limit = 9) => req<{ items: (Comment & { book_id: number; book_title: string })[]; summary: { count: number; average: number } }>("/reviews?limit=" + limit),
};

/* ---- Loans ---- */
export const loansApi = {
  mine: () => req<{ items: Loan[] }>("/loans/me"),
  create: (items: { id: number }[], due_date: string) =>
    req<{ success: boolean; created: number }>("/loans", { method: "POST", body: JSON.stringify({ items, due_date }) }),
  adminList: () => req<{ items: Loan[] }>("/admin/loans"),
  setStatus: (id: number, status: "approved" | "rejected" | "returned", reason?: string) =>
    req<{ success: boolean; loan: Loan }>("/admin/loans/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status, reason }) }),
};

/* ---- Contact ---- */
export const contactApi = {
  send: (body: { name: string; email: string; subject: string; message: string }) =>
    req<{ success: boolean }>("/contact", { method: "POST", body: JSON.stringify(body) }),
};

/* ---- Health ---- */
export const healthApi = {
  check: () => req<{ ok: boolean; bookCount: number }>("/health"),
};
