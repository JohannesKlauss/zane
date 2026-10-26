import type { Reroute } from "@sveltejs/kit/hooks"

// Electron opens the static entry file rather than the HTTP directory index.
// Match that entry to the same root route without changing its file URL or base.
export const reroute: Reroute = ({ url }) => {
  if (url.protocol === "file:" && url.pathname.endsWith("/index.html")) {
    return url.pathname.slice(0, -"index.html".length)
  }

  return url.pathname
}
