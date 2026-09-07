import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/auth.slice";

/**
 * Clear every cookie visible to JavaScript by expiring it on every path/domain
 * variant the browser may have stored it under.
 */
function clearAllCookies() {
  if (typeof document === "undefined") return;
  const cookies = document.cookie ? document.cookie.split(";") : [];
  const hostname = window.location.hostname;
  // Build a list of domains to try: bare hostname, ".hostname", and ""
  const domains = [""];
  if (hostname) {
    domains.push(hostname);
    if (!hostname.startsWith(".")) domains.push("." + hostname);
  }
  for (const rawCookie of cookies) {
    const eqPos = rawCookie.indexOf("=");
    const name = (eqPos > -1 ? rawCookie.slice(0, eqPos) : rawCookie).trim();
    if (!name) continue;
    for (const d of domains) {
      const host = d ? `; domain=${d}` : "";
      // Set past expiry + root path so the browser actually evicts it
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${host}`;
    }
  }
}

/**
 * Shared logout handler — clears the server cookie, every browser cookie,
 * local/session storage, Redux, and redirects to the landing page with a
 * hard reload so no in-memory state survives.
 */
export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // proceed even if server call fails
    }
    // Clear all client-side storage
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    // Clear all browser cookies
    clearAllCookies();
    // Reset Redux auth state
    await dispatch(logout());
    // Hard navigate to landing page so every layout / page resets
    if (typeof window !== "undefined") {
      window.location.replace("/");
    } else {
      router.replace("/");
    }
  };

  return handleLogout;
}
