import { Award, Bell, Search, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const updateToken = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("tokenChanged", updateToken);
    return () => {
      window.removeEventListener("tokenChanged", updateToken);
    };
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <nav className="navbar">
      <div className="navbar-main">
        <div className="navbar-main-inner">

          {/* ── Logo ── */}
          <div className="logo">
            <div className="logo-icon">
              <Award size={22} />
            </div>
            <span className="logo-text">DRC</span>
          </div>

          {/* ── Nav Links ── */}
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/categories">Categories</Link></li>
          </ul>

          {/* ── Right Side ── */}
          <div className="navbar-right">
            <button className="icon-btn">
              <Search size={18} />
            </button>

            <button className="icon-btn">
              <Bell size={18} />
            </button>

            {/* ── Auth ── */}
            {!token ? (
              <>
                <Link to="/PageLogin">
                  <button className="btn-sign-in">Login</button>
                </Link>
                <Link to="/PageRegister">
                  <button className="btn-primary">Register</button>
                </Link>
              </>
            ) : (
              <button className="profile-btn" onClick={handleProfileClick}>
                <User size={20} />
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;