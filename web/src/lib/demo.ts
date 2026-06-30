/* Shared demo-mode state for the "데모 보기" flow.

   The home "데모 보기" button links to /portfolio?demo=1. That flag should let a
   visitor explore the example portfolio AND keep exploring Chat/Learn as demo
   content even after navigating away from the original URL. We persist the flag
   in sessionStorage so it survives client-side route changes (the ?demo=1 query
   param is only present on the first page).

   Rules:
   - demo is active when the URL has ?demo=1 OR sessionStorage holds the flag.
   - seeing ?demo=1 persists the flag (so /chat and /learn stay in demo mode).
   - a signed-in user always sees real content: demo is ignored and the stored
     flag is cleared (so logging in exits demo automatically). */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/context";

export const DEMO_STORAGE_KEY = "fincoach_demo";

export function useDemoMode(): boolean {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const urlDemo = searchParams.get("demo") === "1";

  /* Persist / clear the flag as a side effect of URL + auth state. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      // Signed in → real content. Drop any lingering demo flag.
      window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
      return;
    }
    if (urlDemo) {
      window.sessionStorage.setItem(DEMO_STORAGE_KEY, "1");
    }
  }, [urlDemo, user]);

  // Signed-in users never see demo content.
  if (user) return false;

  if (urlDemo) return true;
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_STORAGE_KEY) === "1";
}
