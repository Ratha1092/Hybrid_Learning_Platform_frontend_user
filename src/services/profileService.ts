import api from "../api/axios";
import type { EnrolledCourse } from "./courseService";
import type { BillingAddress } from "./billingService";

export interface StudentProfile {
  id?: number;
  name?:string;
  phone?:string|null;
  user_id?: number;
  bio?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  learning_goals?: string | null;
  interests?: string[];
  github?: string | null;
  linkedin?: string | null;
}

export interface DashboardData {
  profile: StudentProfile & {
    email?: string;
    role?: string;
    created_at?: string;
  };
  courses: EnrolledCourse[];
  addresses: BillingAddress[];
  notifications: Array<{
    id: number;
    type: string;
    message: string;
    read_at: string | null;
    created_at: string;
  }>;
  stats: {
    enrolled_courses: number;
    completed_courses: number;
    unread_notifications: number;
  };
}

export const profileService = {

  get: async () => {
    const res = await api.get("/users/me");
    const u = res.data.data;
    const sp = u.student_profile ?? {};
    const ip = u.instructor_profile ?? {};
    const localKey = `profile_extra_${u.id}`;
    const local = JSON.parse(localStorage.getItem(localKey) ?? "{}");
    return {
      data: {
        data: {
          bio:            sp.bio            ?? ip.bio            ?? local.bio            ?? null,
          learning_goals: sp.learning_goals ?? local.learning_goals ?? null,
          interests:      sp.interests      ?? local.interests      ?? [],
          github:         sp.github         ?? ip.github         ?? local.github         ?? null,
          linkedin:       sp.linkedin       ?? ip.linkedin       ?? local.linkedin       ?? null,
          avatar:         sp.avatar         ?? ip.avatar         ?? null,
          name:           u.name,
          phone:          u.phone           ?? sp.phone          ?? null,
        } as StudentProfile,
      },
    };
  },

  update: (payload: Partial<StudentProfile>) =>
    api.put<{ data: StudentProfile; message: string }>("/users/profile", payload),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post<{ data: { avatar_url: string }; message: string }>(
      "/users/avatar",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  removeAvatar: () =>
    api.delete<{ message: string }>("/users/avatar"),

  getDashboard: () =>
    api.get<{ data: DashboardData }>("/users/profile/dashboard"),
};
