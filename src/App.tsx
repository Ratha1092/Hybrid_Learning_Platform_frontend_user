import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useAuthModal } from "./context/AuthModalContext";
import "./css/index.css";
import Navbar from "./Components/Navbar/Navbar";
import AuthModal from "./Components/AuthModal/AuthModal";
import { AuthModalProvider } from "./context/AuthModalContext";
import Hero from "./Components/Hero";
import Categories from "./Pages/Category/Categories";
import Footer from "./Components/Footer";
import MaintenanceOverlay from "./Components/MaintenanceOverlay/MaintenanceOverlay";

import PageCourses from "./Pages/Courses/Page_Courses";
import FeaturedCourses from "./Components/FeaturedCourses";
import DetailCourse from "./Pages/Courses/DetailCourse";

import PageCategories from "./Pages/Category/Pagecategoires";
import StudentProfileEdit from "./Pages/User/Profile/StudentProfileEdit";
import Profile from "./Pages/User/Profile/StudentProfile";
import InstructorRegister from "./Pages/Auth/Register/Apply_to_Instructor";
import CreateSections from "./Pages/User/Instructor/Sivbar/CreateSection";
import InstructorLayout from "./Pages/User/Instructor/Sivbar/InstructorLayout";
import InstructorDashboard from "./Pages/User/Instructor/Sivbar/InstructorDashboard";
import MyCourses from "./Pages/User/Instructor/Sivbar/MyCourses";
import CreateCourse from "./Pages/User/Instructor/Sivbar/CreateCourse";
import EditCourse from "./Pages/User/Instructor/EditCourse/index";
import Revenue from "./Pages/User/Instructor/Sivbar/Revenue";
import Students from "./Pages/User/Instructor/Sivbar/Students";
import Library from "./Pages/Library/Library";
import Learn from "./Pages/Learn/Learn";
import GitHubCallback from "./Pages/Auth/GitHub/GitHubCallback";
import Login from "./Pages/Auth/Login/Login";
import Register from "./Pages/Auth/Register/Register";

const AUTH_REDIRECT_KEY = "authRedirectTo";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();
  const opened = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !opened.current) {
      opened.current = true;
      sessionStorage.setItem(AUTH_REDIRECT_KEY, location.pathname);
      openLogin();
    }
  }, []);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

function RequireStudent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();
  const opened = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !opened.current) {
      opened.current = true;
      sessionStorage.setItem(AUTH_REDIRECT_KEY, location.pathname);
      openLogin();
    }
  }, []);

  if (!isAuthenticated) return null;

  const isInstructor = user?.role === "instructor" || user?.instructor_status === "approved" || user?.instructor_status === "verified";
  if (isInstructor) return <Navigate to="/instructor/dashboard" replace />;

  return <>{children}</>;
}

function RequireInstructor({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { openLogin } = useAuthModal();
  useEffect(() => { if (!isAuthenticated) openLogin(); }, [isAuthenticated]);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  const isInstructor = user?.role === "instructor" || user?.instructor_status === "approved";
  if (!isInstructor) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoginPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: "24px" }}>
      <Login />
    </div>
  );
}

function RegisterPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: "24px" }}>
      <Register />
    </div>
  );
}

function MainPage() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedCourses />
      <Footer />
    </>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // React Router doesn't reset scroll on navigation like a classic MPA does —
  // without this, a new page renders wherever the previous page was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
}

function App() {
  return (
    <AuthModalProvider>
      <MaintenanceOverlay />
      <Navbar />
      <AuthModal />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MainPage />} />
          <Route path="/courses" element={<PageCourses />} />
          <Route path="/courses/:slug" element={<DetailCourse />} />
          <Route path="/categories" element={<PageCategories />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/PageLogin" element={<LoginPage />} />
          <Route path="/PageRegister" element={<RegisterPage />} />

          {/* Auth-required routes */}
          <Route path="/profile" element={<RequireStudent><Profile /></RequireStudent>} />
          <Route path="/profile/edit" element={<RequireStudent><StudentProfileEdit /></RequireStudent>} />
          <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
          <Route path="/learn/:slug" element={<RequireAuth><Learn /></RequireAuth>} />

          {/* Instructor auth (no sidebar) */}
          <Route path="/instructor/register" element={<InstructorRegister />} />

          {/* Instructor dashboard — requires instructor role */}
          <Route path="/instructor" element={<RequireInstructor><InstructorLayout /></RequireInstructor>}>
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="courses/sections" element={<CreateSections />} />
            <Route path="courses/create" element={<CreateCourse />} />
            <Route path="courses/:id/edit" element={<EditCourse />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="students" element={<Students />} />
          </Route>
        </Routes>
      </PageTransition>
    </AuthModalProvider>
  );
}

export default App;

