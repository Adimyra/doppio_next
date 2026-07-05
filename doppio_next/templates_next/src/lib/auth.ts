/**
 * Cookie-based session helpers (Frappe sets `user_id` on login).
 * For React components, prefer `useFrappeAuth()` from frappe-react-sdk.
 */
import { frappeCall } from "./frappe";

export function getCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  return Object.fromEntries(
    document.cookie
      .split("; ")
      .filter(Boolean)
      .map((part) => part.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v ?? "")])
  );
}

export function getSessionUser(): string | null {
  const { user_id: userId } = getCookies();
  if (!userId || userId === "Guest") return null;
  return userId;
}

export function isLoggedIn(): boolean {
  return getSessionUser() !== null;
}

export async function login(email: string, password: string) {
  return frappeCall("login", { usr: email, pwd: password });
}

export async function logout() {
  await frappeCall("logout");
  window.location.reload();
}
