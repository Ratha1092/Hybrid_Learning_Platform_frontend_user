import api from "../api/axios";
// បញ្ជាក់ structure នៃ data ដែល backend return មក:
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
//   → function get — ផ្ញើ GET request ទៅ /api/v1/user/profile
// ដើម្បី ទាញ​យក profile data របស់ user
  get: () => api.get<{ data: StudentProfile }>("/user/profile"),
//  → function update — ទទួល payload 
// (fields ដែលចង់ update) ហើយផ្ញើ PUT
//  request ទៅ /api/v1/user/profile
// ដើម្បី រក្សាទុក ការផ្លាស់ប្ដូរ profile
  update: (payload: Partial<StudentProfile>) =>
    api.put<{ data: StudentProfile; message: string }>("/user/profile", payload),
};
