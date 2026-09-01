import api from "../api/axios";

export interface LessonComment {
  id: number;
  lesson_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  video_timestamp: number | null;
  video_id: number | null;
  likes_count: number;
  liked_by_me: boolean;
  created_at: string;
  user?: { id: number; name: string; avatar?: string | null; avatar_url?: string | null } | null;
  replies?: LessonComment[];
}

export interface CommentPage {
  data: LessonComment[];
  current_page: number;
  last_page: number;
  total: number;
}

export const lessonCommentService = {
  getByLesson: (lessonId: number, page = 1) =>
    api.get<{ data: CommentPage }>(`/lessons/${lessonId}/comments`, { params: { page } }),

  create: (lessonId: number, payload: { body: string; parent_id?: number; video_timestamp?: number; video_id?: number }) =>
    api.post<{ data: LessonComment; message: string }>(`/lessons/${lessonId}/comments`, payload),

  like: (commentId: number) =>
    api.post<{ data: { likes_count: number; liked_by_me: boolean } }>(`/comments/${commentId}/like`),
};
