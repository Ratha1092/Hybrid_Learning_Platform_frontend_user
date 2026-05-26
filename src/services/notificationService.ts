import api from "../api/axios";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  action_text?: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    unread_count: number;
    notifications: {
      data: AppNotification[];
      current_page: number;
      per_page: number;
      total: number;
    };
  };
}

export const notificationService = {
  getAll: () => api.get<NotificationResponse>("/users/notifications"),

  markRead: (id: string) => api.post(`/users/notifications/${id}/read`),

  markAllRead: () => api.post("/users/notifications/read-all"),
};
