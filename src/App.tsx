import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
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
import SuspendedOverlay from "./Components/SuspendedOverlay/SuspendedOverlay";
import SessionExpiredOverlay from "./Components/SessionExpiredOverlay/SessionExpiredOverlay";
import LearningPath from "./Components/LearningPath/LearningPath";
import BecomeInstructor from "./Components/BecomeInstructor/BecomeInstructor";
import Stats from "./Components/Stats/Stats";
import Testimonials from "./Components/Testimonials/Testimonials";
import TopInstructors from "./Components/TopInstructors/TopInstructors";
import Faq from "./Components/Faq/Faq";
import FinalCta from "./Components/FinalCta/FinalCta";
import { useHomeData } from "./utils/useHomeData";
import { useTopCoursesAndCategories } from "./utils/useTopCoursesAndCategories";

import PageCourses from "./Pages/Courses/Page_Courses";
import FeaturedCourses from "./Components/FeaturedCourses";
import DetailCourse from "./Pages/Courses/DetailCourse";

import Profile from "./Pages/User/Profile/StudentProfile";
import InstructorRegister from "./Pages/Auth/Register/Apply_to_Instructor";

const CreateSections = lazy(() => import("./Pages/User/Instructor/Sivbar/CreateSection"));
const InstructorLayout = lazy(() => import("./Pages/User/Instructor/Sivbar/InstructorLayout"));
const InstructorDashboard = lazy(() => import("./Pages/User/Instructor/Sivbar/InstructorDashboard"));
const MyCourses = lazy(() => import("./Pages/User/Instructor/Sivbar/MyCourses"));
const CreateCourse = lazy(() => import("./Pages/User/Instructor/Sivbar/CreateCourse"));
const EditCourse = lazy(() => import("./Pages/User/Instructor/EditCourse/index"));
const Revenue = lazy(() => import("./Pages/User/Instructor/Sivbar/Revenue"));
const PayoutDetail = lazy(() => import("./Pages/User/Instructor/Sivbar/PayoutDetail"));
const PayoutAccount = lazy(() => import("./Pages/User/Instructor/Sivbar/PayoutAccount"));
const Students = lazy(() => import("./Pages/User/Instructor/Sivbar/Students"));
const InstructorProfile = lazy(() => import("./Pages/User/Instructor/Sivbar/InstructorProfile"));
import Library from "./Pages/Library/Library";
import Learn from "./Pages/Learn/Learn";
import Contact from "./Pages/Contact/Contact";
import Help from "./Pages/Help/Help";
import Terms from "./Pages/Legal/Terms";
import Privacy from "./Pages/Legal/Privacy";
const Instructors = lazy(() => import("./Pages/Instructors/Instructors"));
import About from "./Pages/About/About";
import GitHubCallback from "./Pages/Auth/GitHub/GitHubCallback";
import Login from "./Pages/Auth/Login/Login";
import Register from "./Pages/Auth/Register/Register";

function AuthRequiredNotice() {
  const { openLogin } = useAuthModal();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-semibold ink dark:text-slate-100">Please log in to continue</p>
      <p className="muted2 dark:text-slate-400">You need to be signed in to view this page.</p>
      <button
        onClick={openLogin}
        className="mt-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Log in
      </button>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const opened = useRef(false);

  useEffect(() => {
    // openLogin() itself remembers the current location — see AuthModalContext.
    if (!isAuthenticated && !opened.current) {
      opened.current = true;
      openLogin();
    }
  }, []);

  if (!isAuthenticated) return <AuthRequiredNotice />;
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
  const home = useHomeData();
  const top = useTopCoursesAndCategories();
  return (
    <>
      <Hero />
      <Categories categories={top?.topCategories} />
      <FeaturedCourses courses={top?.topCourses} />
      <LearningPath />
      <BecomeInstructor />
      <Stats />
      <Testimonials />
      <TopInstructors instructors={home?.top_instructors} />
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

  // Instructor dashboard routes share a persistent sidebar layout (see
  // InstructorLayout), which handles its own inner content transition —
  // collapse them to one key here so the outer shell doesn't refade every
  // time the sidebar navigates to a sibling route.
  const transitionKey = location.pathname.startsWith("/instructor")
    ? "/instructor"
    : location.pathname;

  return (
    <div className="page-transition page-fade" key={transitionKey}>
      {children}
    </div>
  );
}

function WithFooter({ children }: { children: React.ReactNode }) {
  return <>{children}<Footer /></>;
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700" />
    </div>
  );
}

function App() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/learn/");

  return (
    <ThemeProvider>
    <WishlistProvider>
    <AuthModalProvider>
      <MaintenanceOverlay />
      <SuspendedOverlay />
      <SessionExpiredOverlay />
      {!hideNavbar && <Navbar />}
      <AuthModal />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MainPage />} />
          <Route path="/courses" element={<WithFooter><PageCourses /></WithFooter>} />
          <Route path="/courses/:slug" element={<WithFooter><DetailCourse /></WithFooter>} />
          <Route path="/instructors" element={<Suspense fallback={<PageLoader />}><WithFooter><Instructors /></WithFooter></Suspense>} />
          <Route path="/about" element={<WithFooter><About /></WithFooter>} />
          <Route path="/contact" element={<WithFooter><Contact /></WithFooter>} />
          <Route path="/help" element={<WithFooter><Help /></WithFooter>} />
          <Route path="/terms" element={<WithFooter><Terms /></WithFooter>} />
          <Route path="/privacy" element={<WithFooter><Privacy /></WithFooter>} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/PageLogin" element={<LoginPage />} />
          <Route path="/PageRegister" element={<RegisterPage />} />

          {/* Auth-required routes */}
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/profile/edit" element={<Navigate to="/profile?view=edit" replace />} />
          <Route path="/library" element={<RequireAuth><WithFooter><Library /></WithFooter></RequireAuth>} />
          <Route path="/learn/:slug" element={<RequireAuth><Learn /></RequireAuth>} />

          {/* Instructor auth (no sidebar) */}
          <Route path="/instructor/register" element={<RequireAuth><WithFooter><InstructorRegister /></WithFooter></RequireAuth>} />

          {/* Instructor dashboard — requires instructor role. One Suspense
              boundary at the layout level covers every lazy child route
              rendered through its <Outlet />. */}
          <Route
            path="/instructor"
            element={
              <Suspense fallback={<PageLoader />}>
                <RequireInstructor><InstructorLayout /></RequireInstructor>
              </Suspense>
            }
          >
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="courses/sections" element={<CreateSections />} />
            <Route path="courses/create" element={<CreateCourse />} />
            <Route path="courses/:id/edit" element={<EditCourse />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="finance/payouts/:id" element={<PayoutDetail />} />
            <Route path="payout-account" element={<PayoutAccount />} />
            <Route path="students" element={<Students />} />
            <Route path="profile" element={<InstructorProfile />} />
          </Route>
        </Routes>
      </PageTransition>
    </AuthModalProvider>
    </WishlistProvider>
    </ThemeProvider>
  );
}

export default App;

