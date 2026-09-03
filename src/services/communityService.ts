import api from "../api/axios";

export interface CommunityPost {
  id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  likes_count: number;
  liked_by_me: boolean;
  reported_by_me: boolean;
  created_at: string;
  user?: { id: number; name: string; avatar?: string | null; avatar_url?: string | null } | null;
  replies?: CommunityPost[];
}

export interface CommunityPage {
  data: CommunityPost[];
  current_page: number;
  last_page: number;
  total: number;
}

export const communityService = {
  getAll: (page = 1) =>
    api.get<{ data: CommunityPage }>(`/community/posts`, { params: { page } }),

  create: (payload: { body: string; parent_id?: number }) =>
    api.post<{ data: CommunityPost; message: string }>(`/community/posts`, payload),

  like: (postId: number) =>
    api.post<{ data: { likes_count: number; liked_by_me: boolean } }>(`/community/posts/${postId}/like`),

  remove: (postId: number) =>
    api.delete<{ message: string }>(`/community/posts/${postId}`),

  report: (postId: number, reason?: string) =>
    api.post<{ message: string }>(`/community/posts/${postId}/report`, { reason }),
};
