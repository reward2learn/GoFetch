import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/auth.slice";

/**
 * Shared logout handler — clears server cookie, localStorage, Redux, and redirects.
 */
export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed even if server call fails
    }
    localStorage.clear();
    await dispatch(logout());
    router.replace("/login");
  };

  return handleLogout;
}
