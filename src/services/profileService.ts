import api from "../api/axios";

export interface StudentProfile {
  id?: number;
  name?:string;
  phone?:string|null;
  user_id?: number;
  bio?: string | null;
  avatar?: string | null;
  learning_goals?: string | null;
  interests?: string[];
  github?: string | null;
  linkedin?: string | null;
}

export const profileService = {

  get: async () => {
    const res = await api.get("/users/me");
    const u = res.data.data;
    return {
      data: {
        data: {
          ...u.student_profile,
          name: u.name,
          phone: u.phone,
        } as StudentProfile,
      },
    };
  },

  update: (payload: Partial<StudentProfile>) =>
    api.put<{ data: StudentProfile; message: string }>("/users/profile", payload),
};
