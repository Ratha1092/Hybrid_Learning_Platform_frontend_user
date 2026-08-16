import { useCallback, useState } from "react";

export type DashboardView = "teaching" | "learning";

const STORAGE_KEY = "dashboardView";

// Remembers which dashboard (teaching vs. learning) a user who is both an
// instructor and a student last picked, so the navbar's Dashboard link and
// the account-menu switcher stay in sync across visits.
export function useDashboardView(defaultView: DashboardView) {
  const [view, setViewState] = useState<DashboardView>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "teaching" || stored === "learning" ? stored : defaultView;
  });

  const setView = useCallback((next: DashboardView) => {
    localStorage.setItem(STORAGE_KEY, next);
    setViewState(next);
  }, []);

  return [view, setView] as const;
}
