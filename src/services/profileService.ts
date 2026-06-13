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
    const sp = u.student_profile ?? {};
    const ip = u.instructor_profile ?? {};
    // For instructors, student_profile is null — read local fallback for fields not on instructor_profile
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
};
