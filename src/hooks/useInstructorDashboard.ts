import { useCallback, useEffect, useState } from "react";
import { instructorService, type DashboardStats } from "../services/instructorService";

// Module-level cache so InstructorDashboard and MyCourses — which both need
// this same endpoint for different reasons (stats cards vs. per-course
// student counts) — share one request instead of each firing their own.
// Short TTL since revenue/enrollment numbers change as the instructor works,
// unlike mostly-static data like categories.
const TTL_MS = 30_000;

let cached: DashboardStats | null = null;
let cachedAt = 0;
let pending: Promise<DashboardStats> | null = null;

function isFresh() {
  return !!cached && Date.now() - cachedAt < TTL_MS;
}

function fetchDashboard(force: boolean): Promise<DashboardStats> {
  if (!force && isFresh()) return Promise.resolve(cached!);
  if (pending) return pending;
  pending = instructorService.getDashboard()
    .then((res) => {
      cached = res.data.data;
      cachedAt = Date.now();
      return cached;
    })
    .finally(() => { pending = null; });
  return pending;
}

export function useInstructorDashboard() {
  const [data, setData] = useState<DashboardStats | null>(isFresh() ? cached : null);
  const [loading, setLoading] = useState(!isFresh());

  const refresh = useCallback(() => {
    setLoading(true);
    return fetchDashboard(true)
      .then((d) => { setData(d); return d; })
      .catch(() => { setData(null); return null; })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isFresh()) { setData(cached); setLoading(false); return; }
    setLoading(true);
    fetchDashboard(false)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, refresh };
}
