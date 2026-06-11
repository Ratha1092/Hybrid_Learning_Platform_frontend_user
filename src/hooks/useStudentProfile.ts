import { useEffect, useState } from "react";
import { profileService, type StudentProfile } from "../services/profileService";

interface UseStudentProfileResult {
  profile: StudentProfile | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useStudentProfile(): UseStudentProfileResult {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
  const [tick, setTick]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    profileService.get()
      .then(({ data }) => {
        if (!cancelled) setProfile(data.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  const reload = () => setTick((t) => t + 1);

  return { profile, loading, error, reload };
}
