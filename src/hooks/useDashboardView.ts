import { useCallback, useEffect, useState } from "react";

export type DashboardView = "teaching" | "learning";

// Remembers which dashboard (teaching vs. learning) a user who is both an
// instructor and a student last picked, so the navbar's Dashboard link and
// the account-menu switcher stay in sync across visits. Keyed per user id so
// the choice doesn't bleed across accounts sharing the same browser.
export function useDashboardView(userId: number | string | undefined, defaultView: DashboardView) {
  const storageKey = userId != null ? `dashboardView:${userId}` : null;

  const [view, setViewState] = useState<DashboardView>(() => {
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    return stored === "teaching" || stored === "learning" ? stored : defaultView;
  });

  useEffect(() => {
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    setViewState(stored === "teaching" || stored === "learning" ? stored : defaultView);
  }, [storageKey]);

  const setView = useCallback((next: DashboardView) => {
    if (storageKey) localStorage.setItem(storageKey, next);
    setViewState(next);
  }, [storageKey]);

  return [view, setView] as const;
}
