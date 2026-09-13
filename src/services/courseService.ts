import api from "../api/axios";

export interface Course {
  id: number;
  slug?: string;
  title: string;
  short_description: string;
  thumbnail_url: string | null;
  price: string;
  level: string;
  language: string;
  duration: number;
  total_duration_seconds?: number | null;
  students_count?: number;
  views_count?: number;
  average_rating?: number | null;
  reviews_count?: number;
  sections_count?: number;
  category?: { id: number; name: string; slug: string } | null;
  instructor?: {
    id: number;
    name: string;
    avatar?: string | null;
    avatar_url?: string | null;
  } | null;
  requirements?: string | null;
  what_you_will_learn?: string | null;
  target_audience?: string | null;
  required_tools_materials?: string | null;
  preview_video_url?: string | null;
  resources_downloadable?: boolean;
}

export interface LessonObjective {
  id: number;
  objective: string;
  order: number;
}

export interface LessonContentBlock {
  id: number;
  type: "text" | "video" | "image" | "code" | "resource" | "external" | string;
  title?: string | null;
  content?: string | null;
  media_path?: string | null;
  media_url?: string | null;
  language?: string | null;
  metadata?: Record<string, unknown> | null;
  order: number;
}

export interface LessonTakeaway {
  id: number;
  takeaway: string;
  order: number;
}

export interface LessonAssessmentQuestion {
  id: number;
  question: string;
  type: "single_choice" | "multiple_choice" | "true_false" | string;
  options?: string[] | null;
  points?: number | null;
  explanation?: string | null;
  order: number;
}

export interface LessonAssessment {
  id: number;
  title: string;
  description?: string | null;
  passing_score?: number | null;
  attempts?: number | null;
  is_required?: boolean;
  order?: number;
  questions?: LessonAssessmentQuestion[];
}

export interface LessonAssignment {
  id: number;
  title: string;
  instructions?: string | null;
  submission_type?: "file" | "text" | "url" | string | null;
  max_score?: number | null;
  is_required?: boolean;
  order?: number;
}

export interface LessonCompletionRule {
  watch_video?: boolean;
  read_content?: boolean;
  pass_quiz?: boolean;
  submit_assignment?: boolean;
}

// A lesson can hold several videos (e.g. a lecture split into parts).
export interface LessonVideo {
  id: number;
  video_url?: string | null;
  duration?: number | null;
  order: number;
}

export interface Lesson {
  id: number;
  title: string;
  type: string;
  description?: string;
  is_preview: boolean;
  video_url?: string | null;
  videos?: LessonVideo[];
  content?: string;
  order: number;
  duration: number;
  objectives?: LessonObjective[];
  content_blocks?: LessonContentBlock[];
  takeaways?: LessonTakeaway[];
  assessments?: LessonAssessment[];
  assignments?: LessonAssignment[];
  completion_rule?: LessonCompletionRule | null;
}

export interface Section {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseDetail extends Course {
  slug: string;
  description: string;
  sections: Section[];
  is_enrolled?: boolean;
  access_expired?: boolean;
  access_expires_at?: string | null;
}

function sortByOrder<T extends { order?: number }>(items?: T[] | null): T[] {
  return [...(items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function normalizeStructuredLesson(lesson: Lesson): Lesson {
  const assessments = (lesson.assessments ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const assignments = (lesson.assignments ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    ...lesson,
    objectives: sortByOrder(lesson.objectives ?? []),
    content_blocks: sortByOrder(lesson.content_blocks ?? []),
    takeaways: sortByOrder(lesson.takeaways ?? []),
    assessments: assessments.map((assessment: LessonAssessment) => ({
      ...assessment,
      questions: sortByOrder(assessment.questions ?? []),
    })),
    assignments: assignments.map((assignment: LessonAssignment) => ({ ...assignment })),
    videos: sortByOrder(lesson.videos ?? []),
  };
}

export function normalizeCourseDetail(course: CourseDetail): CourseDetail {
  return {
    ...course,
    sections: sortByOrder(course.sections ?? []).map((section) => ({
      ...section,
      lessons: sortByOrder(section.lessons ?? []).map((lesson) => normalizeStructuredLesson(lesson)),
    })),
  };
}

export interface EnrolledCourse {
  enrollment_id: number;
  course_id: number;
  course_slug?: string;
  course_title: string;
  course_thumbnail: string | null;
  course_level: string;
  average_rating: number | null;
  reviews_count: number;
  progress_percentage: number;
  // Some backend responses still send this pre-rename key instead of progress_percentage.
  progress?: number;
  enrolled_at: string;
  completed_at: string | null;
}

// Guards against progress_percentage arriving as the legacy `progress` key
// (or missing) on either endpoint that returns EnrolledCourse[].
export function normalizeEnrolledCourses(courses: EnrolledCourse[]): EnrolledCourse[] {
  return courses.map((c) => ({
    ...c,
    progress_percentage: c.progress_percentage ?? c.progress ?? 0,
  }));
}

export interface CoursePage {
  data: Course[];
  current_page: number;
  last_page: number;
  total: number;
}

export const courseService = {
  getAll: (search?: string, page = 1, per_page = 12) =>
    api.get<{ data: CoursePage }>("/courses", {
      params: { page, per_page, ...(search ? { search } : {}) },
    }),

  getByInstructor: (instructorId: number, search?: string, page = 1, per_page = 12) =>
    api.get<{ data: CoursePage }>("/courses", {
      params: { instructor_id: instructorId, page, per_page, ...(search ? { search } : {}) },
    }),

  getByCategory: (categorySlug: string) =>
    api.get<{ data: { courses: Course[] } }>(`/categories/${categorySlug}`),

  getEnrolled: () => api.get<{ data: EnrolledCourse[] }>("/users/courses"),

  getBySlug: (slug: string) =>
    api.get<{ data: CourseDetail }>(`/courses/${slug}`),
};
