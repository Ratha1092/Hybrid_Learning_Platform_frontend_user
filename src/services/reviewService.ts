import api from "../api/axios";

export interface Review {
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  user?: { id: number; name: string; avatar: string | null; avatar_url?: string | null } | null;
  course?: { id: number; title: string; slug: string; thumbnail_url: string | null } | null;
}

export interface ReviewPage {
  data: Review[];
  current_page: number;
  last_page: number;
  total: number;
}

export const reviewService = {
  getByCourse: (courseId: number, page = 1) =>
    api.get<{ data: ReviewPage }>(`/courses/${courseId}/reviews`, { params: { page } }),

  create: (courseId: number, payload: { rating: number; title?: string; comment?: string }) =>
    api.post<{ data: Review; message: string }>(`/courses/${courseId}/reviews`, payload),

  getMine: (page = 1) =>
    api.get<{ data: ReviewPage }>("/users/reviews", { params: { page } }),

  getFeatured: (limit = 6) =>
    api.get<{ data: Review[] }>("/reviews/featured", { params: { limit } }),
};
