import { useEffect, useState } from "react";
import api from "../api/axios";

export interface PlatformStats {
  total_students: number;
  total_courses: number;
  total_instructors: number;
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.get<{ data: PlatformStats }>("/stats")
      .then(({ data }) => setStats(data.data))
      .catch(() => {});
  }, []);

  return stats;
}
