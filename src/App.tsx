
import { Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar/Navbar";
import Hero from "./Components/Hero";
import Categories from "./Pages/Category/Categories";
import Footer from "./Components/Footer";

import Courses from "./Pages/Courses/Courses";
import DetailCourse from "./Pages/Courses/DetailCourse";

import PageCategories from "./Pages/Category/Pagecategoires";

import PageRegister from "./Pages/Auth/Register/PageRegister";
import Pagelogin from "./Pages/Auth/Login/Pagelogin";
import Profile from "./Pages/User/Profile/StudentProfile";
import InstructorRegister from "./Pages/User/Instructor/InstructorRegister";
import InstructorLogin from "./Pages/User/Instructor/InstructorLogin";
import InstructorDashboard from "./Pages/User/Instructor/InstructorDashboard";
function MainPage() {
  return (
    <>
      <Hero />
      <Categories />
      <Footer />
    </>
  );
}

function App() {
    
  return (
    <>
      {/* IMPORTANT */}
      <Navbar />

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/courses" element={<Courses />}/>
        <Route path="/courses/:slug" element={<DetailCourse />}/>

        <Route path="/categories" element={<PageCategories />}/>
        <Route path="/PageRegister" element={<PageRegister />} />
        <Route path="/PageLogin" element={<Pagelogin />}/>

        <Route path="/profile" element={<Profile />} />
        <Route path="/instructor/register" element={<InstructorRegister />} />
        <Route path="/instructor/login" element={<InstructorLogin />} />
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      </Routes>
    </>
  );
}

export default App;

