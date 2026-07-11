import { useEffect, useState } from "react";
import api from "../api/axios";

export interface PlatformStats {
  total_students: number;
  total_courses: number;
  total_instructors: number;
  top_instructor_monthly_earnings: number;
}

// Module-level cache so every component that calls this hook
// shares one in-flight request and one resolved result.
let cached: PlatformStats | null = null;
let pending: Promise<PlatformStats> | null = null;

function fetchStats(): Promise<PlatformStats> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = api.get<{ data: PlatformStats }>("/stats")
    .then(r => { cached = r.data.data; return cached!; })
    .catch(() => ({ total_students: 0, total_courses: 0, total_instructors: 0, top_instructor_monthly_earnings: 0 }))
    .finally(() => { pending = null; });
  return pending;
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(cached);
  useEffect(() => {
    if (cached) { setStats(cached); return; }
    fetchStats().then(s => setStats(s));
  }, []);
  return stats;
}
