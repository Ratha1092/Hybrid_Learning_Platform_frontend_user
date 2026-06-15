import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./css/index.css";
import Navbar from "./Components/Navbar/Navbar";
import AuthModal from "./Components/AuthModal/AuthModal";
import { AuthModalProvider } from "./context/AuthModalContext";
import Hero from "./Components/Hero";
import Categories from "./Pages/Category/Categories";
import Footer from "./Components/Footer";

import PageCourses from "./Pages/Courses/Page_Courses";
import FeaturedCourses from "./Components/FeaturedCourses";
import DetailCourse from "./Pages/Courses/DetailCourse";

import PageCategories from "./Pages/Category/Pagecategoires";
import StudentProfileEdit from "./Pages/User/Profile/StudentProfileEdit";
import PageRegister from "./Pages/Auth/Register/PageRegister";
import Pagelogin from "./Pages/Auth/Login/Pagelogin";
import Profile from "./Pages/User/Profile/StudentProfile";
import InstructorRegister from "./Pages/Auth/Register/Apply_to_Instructor";

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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/PageLogin" replace />;
}

function RequireInstructor({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/PageLogin" replace />;
  const isInstructor = user?.role === "instructor" || user?.instructor_status === "approved";
  if (!isInstructor) return <Navigate to="/" replace />;
  return <>{children}</>;
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

function App() {
  return (
    <AuthModalProvider>
      <Navbar />
      <AuthModal />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/courses" element={<PageCourses />} />
        <Route path="/courses/:slug" element={<DetailCourse />} />
        <Route path="/categories" element={<PageCategories />} />
        <Route path="/PageRegister" element={<PageRegister />} />
        <Route path="/PageLogin" element={<Pagelogin />} />
        <Route path="/auth/github/callback" element={<GitHubCallback />} />

        {/* Auth-required routes */}
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/profile/edit" element={<RequireAuth><StudentProfileEdit /></RequireAuth>} />
        <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
        <Route path="/learn/:slug" element={<RequireAuth><Learn /></RequireAuth>} />

        {/* Instructor auth (no sidebar) */}
        <Route path="/instructor/register" element={<InstructorRegister />} />

        {/* Instructor dashboard — requires instructor role */}
        <Route path="/instructor" element={<RequireInstructor><InstructorLayout /></RequireInstructor>}>
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/:id/edit" element={<EditCourse />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="students" element={<Students />} />
        </Route>
      </Routes>
    </AuthModalProvider>
  );
}

export default App;

