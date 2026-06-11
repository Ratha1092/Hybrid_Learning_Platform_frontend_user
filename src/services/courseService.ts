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
  students_count?: number;
  views_count?: number;
  reviews_count?: number;
}

export interface Lesson {
  id: number;
  title: string;
  type: string;
  is_preview: boolean;
  video_url?: string;
  content?: string;
  order: number;
  duration: number;
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
}

export interface EnrolledCourse {
  enrollment_id: number;
  course_id: number;
  course_slug?: string;
  course_title: string;
  course_thumbnail: string | null;
  course_level: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
}

export const courseService = {
  getAll: () => api.get<{ data: Course[] }>("/courses"),

  getByCategory: (categorySlug: string) =>
    api.get<{ data: { courses: Course[] } }>(`/categories/${categorySlug}`),

  getEnrolled: () => api.get<{ data: EnrolledCourse[] }>("/users/courses"),

  getEnrollmentStatus: (courseId: number) =>
    api.get<{ data: { enrolled: boolean } }>(`/users/courses/${courseId}/enrollment-status`),

  getBySlug: (slug: string) =>
    api.get<{ data: CourseDetail }>(`/courses/${slug}`),
};
