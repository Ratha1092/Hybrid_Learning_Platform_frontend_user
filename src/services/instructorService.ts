import api from "../api/axios";

// ── Interfaces ────────────────────────────────────────────────────────────────
// Defines the shape of data returned from backend APIs.
export interface InstructorProfile {
  id: number;
  user_id: number;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

export interface WalletData {
  balance: number;
  pending_balance: number;
  currency: string;
}

// Represents monthly earnings data for charts.
export interface MonthlyTrend {
  month: string;
  amount: number;
}

// Represents instructor earnings summary.
export interface EarningsData {
  total: number;
  this_month: number;
  monthly_trend: MonthlyTrend[];
}

// Represents a wallet transaction record.
export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

// Represents a student enrolled in instructor's course.
export interface StudentEnrollment {
  id?: number;
  student_id?: number;
  student_name: string;
  student_email: string;
  course_title: string;
  course_slug?: string;
  enrolled_at: string;
  progress?: number;
  progress_percentage?: number;
}

// Dashboard overview statistics.
export interface DashboardStats {
  courses: { total: number; published: number; draft: number };
  students: { total_unique: number };
  revenue: { total_earned: number };
  recent_enrollments: {
    student_name: string;
    student_email: string;
    course_title: string;
    enrolled_at: string;
  }[];
}

// Represents an instructor course.
export interface InstructorCourse {
  id: number;
  title: string;
  short_description?: string;
  description?: string;
  status: string;
  level: string;
  price: string;
  category_id?: number;
  thumbnail_url: string | null;
  students_count?: number;
  created_at: string;
  preview_video_url?: string;
  requirements?: string;
  what_you_will_learn?: string;
  certificate_enabled?: boolean;
  visibility?: string;
}

// Represents a lesson inside a section.
export interface InstructorLesson {
  id: number;
  title: string;
  type: string;
  duration: number;
  is_preview: boolean;
  order: number;
}

// Represents a course section containing lessons.
export interface InstructorSection {
  id: number;
  title: string;
  order: number;
  lessons: InstructorLesson[];
}

// ── Service ────────────────────────────────────────────────────────────────────
// Centralized API methods for instructor-related actions.

export const instructorService = {
  // Submit application to become an instructor.
  apply: (formData: FormData) =>
    api.post("/users/instructor/apply", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Fetch instructor dashboard statistics.
  getDashboard: () =>
    api.get<{ data: DashboardStats }>("/instructor/dashboard"),

  // Fetch all courses created by instructor.
  getMyCourses: () =>
    api.get<{ data: InstructorCourse[] }>("/instructor/courses"),

  // Fetch single course details by ID.
  getCourseById: (id: number | string) =>
    api.get<{ data: InstructorCourse }>(`/instructor/courses/${id}`),

  // Create a new course.
  createCourse: (data: {
    title: string;
    short_description?: string;
    description?: string;
    level: string;
    language?: string;
    category_id?: string | number;
    price?: string | number;
  }) =>
    api.post<{ success: boolean; data: InstructorCourse }>(
      "/instructor/courses",
      data
    ),

  // Update existing course.
  updateCourse: (
    id: number | string,
    data: Partial<InstructorCourse> & {
      description?: string;
      category_id?: string;
    }
  ) =>
    api.put<{ data: InstructorCourse }>(
      `/instructor/courses/${id}`,
      data
    ),

  // Upload course thumbnail via PUT with method spoofing.
  uploadThumbnail: (id: number | string, file: File) => {
    const form = new FormData();
    form.append("thumbnail", file);
    form.append("_method", "PUT");
    return api.post(`/instructor/courses/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete a course.
  deleteCourse: (id: number | string) =>
    api.delete(`/instructor/courses/${id}`),

  // Submit course for admin review before publishing.
  submitForReview: (id: number | string) =>
    api.post(`/instructor/courses/${id}/submit-review`),

  // ── Sections ─────────────────────────────────────────

  // Fetch all sections of a course.
  getSections: (courseId: number | string) =>
    api.get<{ data: InstructorSection[] }>(
      `/instructor/courses/${courseId}/sections`
    ),

  // Create a new section inside a course.
  createSection: (courseId: number | string, title: string) =>
    api.post<{ data: InstructorSection }>(
      `/instructor/courses/${courseId}/sections`,
      { title }
    ),

  // Update section title.
  updateSection: (
    courseId: number | string,
    sectionId: number | string,
    title: string
  ) =>
    api.put(
      `/instructor/courses/${courseId}/sections/${sectionId}`,
      { title }
    ),

  // Delete a section.
  deleteSection: (
    courseId: number | string,
    sectionId: number | string
  ) =>
    api.delete(
      `/instructor/courses/${courseId}/sections/${sectionId}`
    ),

  // ── Lessons ─────────────────────────────────────────

  // Create a lesson inside a section.
  createLesson: (
    courseId: number | string,
    sectionId: number | string,
    data: {
      title: string;
      type: string;
      duration?: number;
      is_preview?: boolean;
      video_url?: string;
      content?: string;
    }
  ) =>
    api.post<{ data: InstructorLesson }>(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons`,
      data
    ),

  // Update lesson details.
  updateLesson: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string,
    data: Partial<InstructorLesson>
  ) =>
    api.put(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
      data
    ),

  // Upload video file to a lesson.
  uploadVideo: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const form = new FormData();
    form.append("video", file);
    return api.post<{ data: { video_path: string; video_url: string } }>(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/upload-video`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    );
  },

  // Delete a lesson.
  deleteLesson: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string
  ) =>
    api.delete(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`
    ),

  // ── Students ─────────────────────────────────────────

  // Fetch all students enrolled in instructor courses.
  getStudents: () =>
    api.get<{ data: { total: number; students: StudentEnrollment[] } }>("/instructor/students"),

  // ── Finance ─────────────────────────────────────────

  // Fetch instructor wallet balance.
  getWallet: () =>
    api.get<{ data: WalletData }>("/finance/wallet"),

  // Fetch earnings summary and monthly trend.
  getEarnings: () =>
    api.get<{ data: EarningsData }>("/finance/earnings"),

  // Fetch transaction history.
  getTransactions: () =>
    api.get<{ data: Transaction[] }>("/finance/transactions"),

  // Request payout from available balance.
  requestPayout: (data: {
    amount: number;
    payment_method: string;
  }) =>
    api.post("/finance/payout-request", data),
};