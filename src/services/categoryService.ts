import api from "../api/axios";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
  courses_count: number;
}

export interface CategoryDetail extends Category {
  courses: {
    id: number;
    title: string;
    slug: string;
    thumbnail_url: string | null;
  }[];
}

// Module-level cache so every component that calls getAll() shares one
// in-flight request and one resolved result instead of each firing its own.
let cachedCategories: Category[] | null = null;
let pendingCategories: Promise<Category[]> | null = null;

function fetchCategories(): Promise<Category[]> {
  if (cachedCategories) return Promise.resolve(cachedCategories);
  if (pendingCategories) return pendingCategories;
  pendingCategories = api.get<{ data: Category[] }>("/categories")
    .then((res) => { cachedCategories = res.data.data; return cachedCategories; })
    .finally(() => { pendingCategories = null; });
  return pendingCategories;
}

export const categoryService = {
  getAll: () =>
    fetchCategories().then((data) => ({ data: { data } })),

  getBySlug: (slug: string) =>
    api.get<{ data: CategoryDetail }>(`/categories/${slug}`),
};
