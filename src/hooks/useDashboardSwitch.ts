import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboardView, type DashboardView } from "./useDashboardView";

// Shared eligibility check + navigation action for the teaching/learning
// switcher, so every place that needs to offer "switch to the other
// dashboard" (navbar, instructor sidebar, student profile) agrees on who's
// eligible and where each destination actually is.
export function useDashboardSwitch() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isInstructor = isAuthenticated && (user?.role === "instructor" || user?.instructor_status === "verified");
  const canSwitch = isInstructor && !!user?.has_enrollments;
  const [, setDashboardView] = useDashboardView(isInstructor ? "teaching" : "learning");

  const switchTo = (view: DashboardView) => {
    setDashboardView(view);
    navigate(view === "teaching" ? "/instructor/dashboard" : "/profile");
  };

  return { canSwitch, switchTo };
}
