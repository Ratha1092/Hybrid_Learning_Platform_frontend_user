import { useEffect, useState } from "react";
import api from "../api/axios";
import { type Course } from "../services/courseService";
import { type Category } from "../services/categoryService";

// How many courses to sample when ranking — large enough that the
// student-count ranking for both courses and categories is representative.
const SAMPLE_SIZE = 100;
const TOP_COURSES = 8;
const TOP_CATEGORIES = 12;

export interface TopCoursesAndCategories {
  topCourses: Course[];
  topCategories: Category[];
}

function extractCourses(raw: unknown): Course[] {
  if (Array.isArray(raw)) return raw as Course[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as Course[]) : [];
}

// Module-level cache so every component sharing this hook fires one request.
let cached: TopCoursesAndCategories | null = null;
let pending: Promise<TopCoursesAndCategories> | null = null;

async function fetchTop(): Promise<TopCoursesAndCategories> {
  const [coursesRes, categoriesRes] = await Promise.all([
    api.get("/courses", { params: { per_page: SAMPLE_SIZE, page: 1 } }),
    api.get<{ data: Category[] }>("/categories"),
  ]);

  const courses = extractCourses(coursesRes.data.data);
  const topCourses = [...courses]
    .sort((a, b) => (b.students_count ?? 0) - (a.students_count ?? 0))
    .slice(0, TOP_COURSES);

  // Categories don't carry a student count of their own — derive one by
  // summing students_count across the sampled courses in each category.
  const studentsByCategory = new Map<number, number>();
  for (const c of courses) {
    if (!c.category) continue;
    studentsByCategory.set(
      c.category.id,
      (studentsByCategory.get(c.category.id) ?? 0) + (c.students_count ?? 0)
    );
  }

  const allCategories = categoriesRes.data.data ?? [];
  const topCategories = [...allCategories]
    .sort((a, b) => (studentsByCategory.get(b.id) ?? 0) - (studentsByCategory.get(a.id) ?? 0))
    .slice(0, TOP_CATEGORIES);

  return { topCourses, topCategories };
}

function load(): Promise<TopCoursesAndCategories> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetchTop()
    .then((r) => { cached = r; return r; })
    .finally(() => { pending = null; });
  return pending;
}

export function useTopCoursesAndCategories() {
  const [data, setData] = useState<TopCoursesAndCategories | null>(cached);
  useEffect(() => {
    if (cached) { setData(cached); return; }
    load().then(setData).catch(() => {});
  }, []);
  return data;
}
