
import { Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar/Navbar";
import AuthModal from "./Components/AuthModal/AuthModal";
import { AuthModalProvider } from "./context/AuthModalContext";
import Hero from "./Components/Hero";
import Categories from "./Pages/Category/Categories";
import Footer from "./Components/Footer";

import Courses from "./Pages/Courses/Courses";
import DetailCourse from "./Pages/Courses/DetailCourse";

import PageCategories from "./Pages/Category/Pagecategoires";
import StudentProfileEdit from "./Pages/User/Profile/StudentProfileEdit";
import PageRegister from "./Pages/Auth/Register/PageRegister";
import Pagelogin from "./Pages/Auth/Login/Pagelogin";
import Profile from "./Pages/User/Profile/StudentProfile";
import InstructorRegister from "./Pages/User/Instructor/InstructorRegister";
import InstructorLogin from "./Pages/User/Instructor/InstructorLogin";
import InstructorLayout from "./Pages/User/Instructor/InstructorLayout";
import InstructorDashboard from "./Pages/User/Instructor/InstructorDashboard";
import MyCourses from "./Pages/User/Instructor/MyCourses";
import CreateCourse from "./Pages/User/Instructor/CreateCourse";
import EditCourse from "./Pages/User/Instructor/EditCourse/index";
import Revenue from "./Pages/User/Instructor/Revenue";
import Students from "./Pages/User/Instructor/Students";
import Library from "./Pages/Library/Library";
import Learn from "./Pages/Learn/Learn";
import FeaturedCourses from "./Components/FeaturedCourses";
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
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<DetailCourse />} />

        <Route path="/categories" element={<PageCategories />} />
        <Route path="/PageRegister" element={<PageRegister />} />
        <Route path="/PageLogin" element={<Pagelogin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<StudentProfileEdit />} />
        {/* Instructor auth (no sidebar) */}
        <Route path="/instructor/register" element={<InstructorRegister />} />
        <Route path="/instructor/login" element={<InstructorLogin />} />

        {/* Instructor dashboard (with sidebar layout) */}
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/:id/edit" element={<EditCourse />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="students" element={<Students />} />
        </Route>
        <Route path="/library" element={<Library />} />
        <Route path="/learn/:slug" element={<Learn />} />

      </Routes>
    </AuthModalProvider>
  );
}

export default App;

