/**
 * socket.io connection to Frappe's realtime server.
 * In dev (any port, e.g. :8080) it connects straight to :9000;
 * in production it uses the same origin (nginx proxies /socket.io).
 *
 * For React components, prefer `useFrappeEventListener()` from
 * frappe-react-sdk. This is for imperative, non-React usage.
 */
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() can only be used in the browser");
  }

  if (!socket) {
    const host = window.location.hostname;
    const port = window.location.port ? ":9000" : "";
    const protocol = port ? "http" : "https";
    socket = io(`${protocol}://${host}${port}`, {
      withCredentials: true,
    });
  }

  return socket;
}
