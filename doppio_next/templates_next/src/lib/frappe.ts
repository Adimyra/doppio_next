/**
 * Typed wrapper around Frappe's /api/method endpoints.
 * TypeScript port of doppio's call.js controller.
 *
 * Note: most data fetching should go through frappe-react-sdk hooks
 * (useFrappeGetDocList, useFrappeGetCall, ...). Use this for one-off
 * imperative calls outside React.
 */

declare global {
  interface Window {
    csrf_token?: string;
  }
}

export class FrappeError extends Error {
  excType?: string;
  exc?: string;
  messages: string[] = [];
  httpStatus?: number;
}

export async function frappeCall<T = unknown>(
  method: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
    "X-Frappe-Site-Name": window.location.hostname,
  };

  if (window.csrf_token && window.csrf_token !== "{{ csrf_token }}") {
    headers["X-Frappe-CSRF-Token"] = window.csrf_token;
  }

  const res = await fetch(`/api/method/${method}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });

  if (res.ok) {
    const data = await res.json();
    if (data.docs || method === "login") {
      return data as T;
    }
    return data.message as T;
  }

  // ---- error handling (Frappe's _server_messages / exc format) ----
  const text = await res.text();
  let error: Record<string, unknown> = {};
  try {
    error = JSON.parse(text);
  } catch {
    /* not JSON */
  }

  const e = new FrappeError(
    [method, error.exc_type, error._error_message].filter(Boolean).join(" ")
  );
  e.excType = error.exc_type as string | undefined;
  e.httpStatus = res.status;

  let messages: string[] = [];
  if (typeof error._server_messages === "string") {
    try {
      messages = JSON.parse(error._server_messages);
    } catch {
      /* ignore */
    }
  }
  if (typeof error.message === "string") messages.push(error.message);

  e.messages = messages
    .map((m) => {
      try {
        return JSON.parse(m).message ?? m;
      } catch {
        return m;
      }
    })
    .filter(Boolean);

  if (!e.messages.length) {
    e.messages = [
      (error._error_message as string) || "Internal Server Error",
    ];
  }

  throw e;
}
