import api from "../api/axios";
// បញ្ជាក់ structure នៃ data ដែល backend return មក:
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
//   → function getAll — ផ្ញើ GET request ទៅ /api/v1/users/notifications
// ដើម្បី ទាញយក notifications ទាំងអស់ របស់ user ដែល login
  getAll: () => api.get<NotificationResponse>("/users/notifications"),
//   → function markRead — ទទួល id (លេខ notification) ហើយផ្ញើ POST request
// ដើម្បី mark notification មួយ​ ថា "អានហើយ"
  markRead: (id: string) => api.post(`/users/notifications/${id}/read`),
//   → function markAllRead — ផ្ញើ POST request 
// ដើម្បី mark notifications ទាំងអស់ ថា "អានហើយ" ក្នុងតែ 1 request
  markAllRead: () => api.post("/users/notifications/read-all"),
};
