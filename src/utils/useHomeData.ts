import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Category } from "../services/categoryService";
import type { Course } from "../services/courseService";
import type { PlatformStats } from "./usePlatformStats";

export interface HomeInstructor {
  id: number;
  name: string;
  avatar: string | null;
  avatar_url?: string | null;
  bio: string | null;
  courses: number;
  students: number;
}

export interface HomeData {
  stats: PlatformStats;
  categories: Category[];
  featured_courses: Course[];
  top_instructors: HomeInstructor[];
}

// Module-level cache so the Home page's components (Categories,
// FeaturedCourses, TopInstructors) share one /home request instead of each
// firing its own /categories, /courses, /instructors call.
let cached: HomeData | null = null;
let pending: Promise<HomeData> | null = null;

function fetchHomeData(): Promise<HomeData> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = api.get<{ data: HomeData }>("/home")
    .then((r) => { cached = r.data.data; return cached!; })
    .finally(() => { pending = null; });
  return pending;
}

export function useHomeData() {
  const [data, setData] = useState<HomeData | null>(cached);
  useEffect(() => {
    if (cached) { setData(cached); return; }
    fetchHomeData().then(setData).catch(() => {});
  }, []);
  return data;
}
