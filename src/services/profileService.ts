import api from "../api/axios";

export interface StudentProfile {
  id?: number;
  user_id?: number;
  bio?: string | null;
  avatar?: string | null;
  learning_goals?: string | null;
  interests?: string[];
  github?: string | null;
  linkedin?: string | null;
}

export const profileService = {
  get: () => api.get<{ data: StudentProfile }>("/user/profile"),

  update: (payload: Partial<StudentProfile>) =>
    api.put<{ data: StudentProfile; message: string }>("/user/profile", payload),
};
