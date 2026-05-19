
import { Routes, Route } from "react-router-dom";

import Navbar from "./component/nabar";
import Hero from "./component/hero";
import Categories from "./component/categories";
import Footer from "./component/footer";

import Courses from "./pages/courses";
import HowItWorks from "./pages/how_it_work";
import PageCategories from "./pages/pagecategoires";

import PageRegister from "./pages/PageRegister";
import Pagelogin from "./pages/Pagelogin";
import Profile from "./pages/profile";

function MainPage() {
  return (
    <>
      <Hero />
      <Categories />
      <Footer />
    </>
  );
}

function Home() {
    
  return (
    <>
      {/* IMPORTANT */}
      <Navbar />

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/courses"element={<Courses />}/>

        <Route path="/categories" element={<PageCategories />}/>

        <Route path="/how_it_works" element={<HowItWorks />} />

        <Route path="/PageRegister" element={<PageRegister />} />
        <Route path="/PageLogin" element={<Pagelogin />}/>

        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

export default Home;

