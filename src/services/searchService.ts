import api from "../api/axios";

export interface SearchCourse {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  instructor: string;
  category: string;
  enrollments: number;
  type: "course";
}

export interface SearchInstructor {
  id: number;
  name: string;
  avatar: string | null;
  courses: number;
  type: "instructor";
}

export interface SearchCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  courses: number;
  type: "category";
}

export interface SearchResults {
  courses: SearchCourse[];
  instructors: SearchInstructor[];
  categories: SearchCategory[];
  query: string;
  total: number;
}

export type SearchType = "all" | "courses" | "instructors" | "categories";

export const searchService = {
  search: (q: string, type: SearchType = "all", limit = 10) =>
    api.get<{ data: SearchResults }>("/search", { params: { q, type, limit } }),
};
