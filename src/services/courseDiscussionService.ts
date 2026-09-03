import api from "../api/axios";

export interface CourseDiscussion {
  id: number;
  course_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  likes_count: number;
  liked_by_me: boolean;
  is_instructor: boolean;
  created_at: string;
  user?: { id: number; name: string; avatar?: string | null; avatar_url?: string | null } | null;
  replies?: CourseDiscussion[];
}

export interface DiscussionPage {
  data: CourseDiscussion[];
  current_page: number;
  last_page: number;
  total: number;
}

export const courseDiscussionService = {
  getByCourse: (courseId: number, page = 1) =>
    api.get<{ data: DiscussionPage }>(`/courses/${courseId}/discussions`, { params: { page } }),

  create: (courseId: number, payload: { body: string; parent_id?: number }) =>
    api.post<{ data: CourseDiscussion; message: string }>(`/courses/${courseId}/discussions`, payload),

  like: (discussionId: number) =>
    api.post<{ data: { likes_count: number; liked_by_me: boolean } }>(`/discussions/${discussionId}/like`),
};
