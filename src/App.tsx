import { useEffect, useLayoutEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useAuthModal } from "./context/AuthModalContext";
import "./css/index.css";
import Navbar from "./Components/Navbar/Navbar";
import AuthModal from "./Components/AuthModal/AuthModal";
import { AuthModalProvider } from "./context/AuthModalContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WishlistProvider } from "./context/WishlistContext";
import Hero from "./Components/Hero";
import Categories from "./Pages/Category/Categories";
import Footer from "./Components/Footer";
import MaintenanceOverlay from "./Components/MaintenanceOverlay/MaintenanceOverlay";
import LearningPath from "./Components/LearningPath/LearningPath";
import BecomeInstructor from "./Components/BecomeInstructor/BecomeInstructor";
import Stats from "./Components/Stats/Stats";
import TopInstructors from "./Components/TopInstructors/TopInstructors";
import Testimonials from "./Components/Testimonials/Testimonials";
import Faq from "./Components/Faq/Faq";
import FinalCta from "./Components/FinalCta/FinalCta";

import PageCourses from "./Pages/Courses/Page_Courses";
import FeaturedCourses from "./Components/FeaturedCourses";
import DetailCourse from "./Pages/Courses/DetailCourse";

import PageCategories from "./Pages/Category/Pagecategoires";
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
import Contact from "./Pages/Contact/Contact";
import Instructors from "./Pages/Instructors/Instructors";
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
      <LearningPath />
      <BecomeInstructor />
      <Stats />
      <TopInstructors />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="page-transition">
      {children}
    </div>
  );
}

function WithFooter({ children }: { children: React.ReactNode }) {
  return <>{children}<Footer /></>;
}

function App() {
  return (
    <ThemeProvider>
    <WishlistProvider>
    <AuthModalProvider>
      <MaintenanceOverlay />
      <Navbar />
      <AuthModal />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MainPage />} />
          <Route path="/courses" element={<WithFooter><PageCourses /></WithFooter>} />
          <Route path="/courses/:slug" element={<WithFooter><DetailCourse /></WithFooter>} />
          <Route path="/categories" element={<WithFooter><PageCategories /></WithFooter>} />
          <Route path="/instructors" element={<WithFooter><Instructors /></WithFooter>} />
          <Route path="/contact" element={<WithFooter><Contact /></WithFooter>} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/PageLogin" element={<LoginPage />} />
          <Route path="/PageRegister" element={<RegisterPage />} />

          {/* Auth-required routes */}
          <Route path="/profile" element={<RequireStudent><Profile /></RequireStudent>} />
          <Route path="/profile/edit" element={<Navigate to="/profile?view=edit" replace />} />
          <Route path="/library" element={<RequireAuth><WithFooter><Library /></WithFooter></RequireAuth>} />
          <Route path="/learn/:slug" element={<RequireAuth><Learn /></RequireAuth>} />

          {/* Instructor auth (no sidebar) */}
          <Route path="/instructor/register" element={<WithFooter><InstructorRegister /></WithFooter>} />

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
    </WishlistProvider>
    </ThemeProvider>
  );
}

export default App;

