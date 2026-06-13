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

export const categoryService = {
  getAll: () =>
    api.get<{ data: Category[] }>("/categories"),

  getBySlug: (slug: string) =>
    api.get<{ data: CategoryDetail }>(`/categories/${slug}`),
};
