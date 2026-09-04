import api from "../api/axios";

// Interfaces
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
  hold_period_days?: number;
  next_release_at?: string | null;
}

// Represents monthly earnings data for charts.
export interface MonthlyTrend {
  month: string;
  total: number;
  // Some backend responses still use the pre-rename key for this value.
  amount?: number;
}

// Represents instructor earnings summary.
export interface EarningsData {
  total_earned: number;
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

export interface InstructorPayoutAccount {
  id: number;
  instructor_id: number;
  method: string;
  account_name: string;
  account_number: string | null;
  phone_number: string | null;
  qr_code_path: string | null;
  qr_code_url: string | null;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutRequest {
  id: number;
  amount: number;
  currency?: string;
  payment_method: string;
  source: "manual" | "monthly_auto";
  status: "pending" | "approved" | "rejected";
  notes?: string | null;
  rejection_reason?: string | null;
  transaction_reference?: string | null;
  requested_at?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
  receipt_id?: number | null;
  receipt?: PayoutReceipt | null;
  payout_account?: InstructorPayoutAccount | null;
}

export interface PayoutReceipt {
  id: number;
  payout_request_id: number;
  number: string;
  amount: number;
  issued_at: string;
}

// Represents a student enrolled in instructor's course.
export interface StudentEnrollment {
  id?: number;
  student_id?: number;
  course_id?: number;
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
  per_course: {
    course_id: number;
    student_count: number;
  }[];
  recent_enrollments: {
    student_name: string;
    student_email: string;
    course_title: string;
    enrolled_at: string;
  }[];
}

// Represents a standalone section (course_id is null until attached).
export interface StandaloneSection {
  id: number;
  title: string;
  sort_order: number;
  course_id: null;
  lessons_count: number;
  lessons?: InstructorLesson[];
  created_at?: string;
}

// Represents an instructor course.
export interface InstructorCourse {
  id: number;
  title: string;
  slug?: string;
  short_description?: string;
  description?: string;
  status: string;
  level: string;
  price: string;
  category_id?: number | string;
  language?: string;
  thumbnail_url: string | null;
  students_count?: number;
  created_at: string;
  preview_video_url?: string;
  requirements?: string;
  what_you_will_learn?: string;
  visibility?: string;
  commission_percentage?: number;
}

// Represents a lesson inside a section.
export interface InstructorLesson {
  id: number;
  title: string;
  type: string;
  description?: string;
  duration: number;
  is_preview: boolean;
  order: number;
  video_url?: string;
  content?: string;
  videos_count?: number;
}

// Represents a file attached to a lesson as a downloadable resource.
export interface LessonResource {
  id: number;
  lesson_id: number;
  title: string;
  type: string;
  file_path: string;
  file_url?: string;
  preview_url?: string;
}

// Represents one of possibly several videos attached to a lesson.
export interface InstructorLessonVideo {
  id: number;
  lesson_id: number;
  video_url?: string | null;
  video_path?: string | null;
  video_source?: string | null;
  duration?: number | null;
  order: number;
}

// Represents a course section containing lessons.
export interface InstructorSection {
  id: number;
  
  title: string;
  order: number;
  lessons: InstructorLesson[];
}

// Service
// Centralized API methods for instructor-related actions.

export const instructorService = {
  // Standalone sections

  // Create a standalone section with no course attached.
  createStandaloneSection: (title: string, sort_order?: number) =>
    api.post<{ data: StandaloneSection }>("/instructor/sections", { title, sort_order }),

  // List the instructor's standalone sections (course_id = null).
  getStandaloneSections: () =>
    api.get<{ data: StandaloneSection[] }>("/instructor/sections/standalone"),

  // Rename a standalone section.
  updateStandaloneSection: (id: number | string, title: string) =>
    api.put<{ data: StandaloneSection }>(`/instructor/sections/${id}`, { title }),

  // Delete a standalone section (backend rejects if it still has lessons).
  deleteStandaloneSection: (id: number | string) =>
    api.delete(`/instructor/sections/${id}`),

  // Attach one or more standalone sections to a course.
  attachSections: (courseId: number | string, section_ids: number[]) =>
    api.post<{ success: boolean; data: { course_id: number; attached_count: number } }>(
      `/instructor/courses/${courseId}/attach-sections`,
      { section_ids }
    ),

  // Fetch a single section (standalone or course-attached) with its full lessons array.
  getSectionDetail: (sectionId: number | string) =>
    api.get<{ data: StandaloneSection }>(`/instructor/sections/${sectionId}`),

  // Section-scoped lessons (works for standalone or course-attached sections)

  getSectionLessons: (sectionId: number | string) =>
    api.get<{ data: InstructorLesson[] }>(`/instructor/sections/${sectionId}/lessons`),

  createSectionLesson: (
    sectionId: number | string,
    data: {
      title: string;
      type: string;
      description?: string;
      duration?: number;
      is_preview?: boolean;
      video_url?: string;
      content?: string;
    }
  ) =>
    api.post<{ data: InstructorLesson }>(`/instructor/sections/${sectionId}/lessons`, data),

  updateSectionLesson: (
    sectionId: number | string,
    lessonId: number | string,
    data: Partial<InstructorLesson>
  ) =>
    api.put(`/instructor/sections/${sectionId}/lessons/${lessonId}`, data),

  deleteSectionLesson: (sectionId: number | string, lessonId: number | string) =>
    api.delete(`/instructor/sections/${sectionId}/lessons/${lessonId}`),

  uploadSectionLessonVideo: (
    sectionId: number | string,
    lessonId: number | string,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const form = new FormData();
    form.append("video", file);
    return api.post<{ data: { video_path: string; video_url: string } }>(
      `/instructor/sections/${sectionId}/lessons/${lessonId}/upload-video`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    );
  },

  getSectionLessonResources: (sectionId: number | string, lessonId: number | string) =>
    api.get<{ data: LessonResource[] }>(`/instructor/sections/${sectionId}/lessons/${lessonId}/resources`),

  uploadSectionLessonResource: (
    sectionId: number | string,
    lessonId: number | string,
    formData: FormData,
    onProgress?: (pct: number) => void
  ) =>
    api.post<{ data: LessonResource }>(
      `/instructor/sections/${sectionId}/lessons/${lessonId}/resources`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    ),

  deleteSectionLessonResource: (
    sectionId: number | string,
    lessonId: number | string,
    resourceId: number | string
  ) =>
    api.delete(`/instructor/sections/${sectionId}/lessons/${lessonId}/resources/${resourceId}`),

  // A lesson can hold several videos — these append a new one rather than
  // overwriting, unlike uploadSectionLessonVideo above.
  getSectionLessonVideos: (sectionId: number | string, lessonId: number | string) =>
    api.get<{ data: InstructorLessonVideo[] }>(`/instructor/sections/${sectionId}/lessons/${lessonId}/videos`),

  addSectionLessonVideo: (
    sectionId: number | string,
    lessonId: number | string,
    formData: FormData,
    onProgress?: (pct: number) => void
  ) =>
    api.post<{ data: InstructorLessonVideo }>(
      `/instructor/sections/${sectionId}/lessons/${lessonId}/videos`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    ),

  deleteSectionLessonVideo: (
    sectionId: number | string,
    lessonId: number | string,
    videoId: number | string
  ) =>
    api.delete(`/instructor/sections/${sectionId}/lessons/${lessonId}/videos/${videoId}`),

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
    data: Partial<InstructorCourse>
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

  // Upload course-level preview/trailer video.
  uploadPreviewVideo: (
    id: number | string,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const form = new FormData();
    form.append("preview_video", file);
    return api.post<{ data: { preview_video_path: string; preview_video_url: string } }>(
      `/instructor/courses/${id}/upload-preview-video`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    );
  },

  // Delete a course.
  deleteCourse: (id: number | string) =>
    api.delete(`/instructor/courses/${id}`),

  // Submit course for admin review before publishing.
  submitForReview: (id: number | string) =>
    api.post(`/instructor/courses/${id}/submit-review`),

  // Sections─

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

  // Lessons─

  // Create a lesson inside a section.
  createLesson: (
    courseId: number | string,
    sectionId: number | string,
    data: {
      title: string;
      type: string;
      description?: string;
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
    data: Partial<InstructorLesson> & { video_url?: string; content?: string }
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

  // Lesson Resources─

  getLessonResources: (courseId: number | string, sectionId: number | string, lessonId: number | string) =>
    api.get<{ data: LessonResource[] }>(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/resources`
    ),

  uploadLessonResource: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string,
    formData: FormData,
    onProgress?: (pct: number) => void
  ) =>
    api.post<{ data: LessonResource }>(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/resources`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    ),

  deleteLessonResource: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string,
    resourceId: number | string
  ) =>
    api.delete(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/resources/${resourceId}`
    ),

  // Lesson Videos── (a lesson can hold several; these append rather than overwrite)

  getLessonVideos: (courseId: number | string, sectionId: number | string, lessonId: number | string) =>
    api.get<{ data: InstructorLessonVideo[] }>(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/videos`
    ),

  addLessonVideo: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string,
    formData: FormData,
    onProgress?: (pct: number) => void
  ) =>
    api.post<{ data: InstructorLessonVideo }>(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/videos`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    ),

  deleteLessonVideo: (
    courseId: number | string,
    sectionId: number | string,
    lessonId: number | string,
    videoId: number | string
  ) =>
    api.delete(
      `/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/videos/${videoId}`
    ),

  // Students─

  // Fetch all students enrolled in instructor courses.
  getStudents: () =>
    api.get<{ data: { total: number; students: StudentEnrollment[] } }>("/instructor/students"),

  // Finance─

  // Fetch instructor wallet balance.
  getWallet: () =>
    api.get<{ data: WalletData }>("/finance/wallet"),

  // Fetch earnings summary and monthly trend.
  getEarnings: () =>
    api.get<{ data: EarningsData }>("/finance/earnings"),

  // Fetch transaction history.
  getTransactions: () =>
    api.get<{ data: Transaction[] }>("/finance/transactions"),

  // Fetch the instructor's registered payout account.
  getPayoutAccount: () =>
    api.get<{ data: InstructorPayoutAccount | null }>("/finance/payout-account"),

  // Create or update payout account (multipart — may include qr_code file).
  savePayoutAccount: (formData: FormData) =>
    api.post<{ data: InstructorPayoutAccount }>("/finance/payout-account", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Request payout from available balance.
  requestPayout: (data: { amount: number }) =>
    api.post("/finance/payout-request", data),

  // Paginated payout request history.
  getPayoutRequests: (page = 1) =>
    api.get<{ data: { data: PayoutRequest[]; current_page: number; last_page: number } }>(
      `/finance/payout-requests?page=${page}`
    ),

  // Fetch a single payout request by id.
  getPayoutById: (id: number | string) =>
    api.get<{ data: PayoutRequest }>(`/finance/payout-requests/${id}`),

  // List payout receipts.
  getPayoutReceipts: () =>
    api.get<{ data: PayoutReceipt[] }>("/finance/payout-receipts"),

  // Download a single payout receipt PDF (returns blob).
  downloadPayoutReceipt: async (receiptId: number, receiptNumber: string) => {
    const res = await api.get(`/finance/payout-receipts/${receiptId}/download`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-receipt-${receiptNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
