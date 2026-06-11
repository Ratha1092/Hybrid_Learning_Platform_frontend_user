import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";
import Notification from "../Notification/Notification";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const firstName = user?.name?.split(" ")[0] ?? "";
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <nav className="navbar">
      <div className="navbar-main">
        <div className="navbar-main-inner">

          {/* ── Logo ── */}
          <div className="logo">
            <div className="logo-icon">HL</div>
            <span className="logo-text">Hybrid Learning</span>
          </div>

          {/* ── Nav Links ── */}
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/library">Library</Link></li>
            <li><Link to="/contact">Contact</Link></li>
           
          </ul>

          {/* ── Right Side ── */}
          <div className="navbar-right">
            
            <Notification />

            {/* ── Auth ── */}
            {!isAuthenticated ? (
              <>
               
                <Link to="/PageLogin">
                  <button className="btn-sign-in">Login</button>
                </Link>
                <Link to="/PageRegister">
                  <button className="btn-primary">Register</button>
                </Link>
                  

              </>
            ) : (
              <>
                {user?.role === "instructor" || user?.instructor_status === "verified" ? (
                  <Link to="/instructor/dashboard">
                    <button className="btn-primary">Dashboard</button>
                  </Link>
                ) : (
                  <Link to="/instructor/register">
                    <button className="btn-primary">Apply To Instructor</button>
                  </Link>
                )}
              <button className="navbar-profile-btn" onClick={() => navigate("/profile")}>
                <div className="navbar-avatar">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <span className="navbar-username">{firstName}</span>
              </button></>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;