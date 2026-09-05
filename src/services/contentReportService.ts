import api from "../api/axios";

export type ReportableType = "course" | "review";

export const contentReportService = {
  create: (payload: {
    reportable_type: ReportableType;
    reportable_id: number;
    reason: string;
    details?: string;
  }) => api.post<{ message: string }>("/reports", payload),
};
