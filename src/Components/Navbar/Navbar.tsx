import { Search, Menu, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import Notification from "../Notification/Notification";
import { useLanguage } from "../../context/LanguageContext";
import logo from "../../assets/logo1.png";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const { openLogin, openRegister } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { to: "/",           label: t("nav.home") },
    { to: "/courses",    label: t("nav.courses") },
    { to: "/categories", label: t("nav.categories") },
    { to: "/library",    label: t("nav.library") },
    { to: "/contact",    label: t("nav.contact") },
  ];
  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* ── Logo ── */}
        <NavLink to="/" className="navbar-logo" onClick={closeMenu}>
          <img className="navbar-logo-img" src={logo} alt="Digital Learning" />
          <span className="navbar-logo-text">Digital Learning</span>
        </NavLink>

        {/* ── Desktop Nav Links ── */}
        <ul className="navbar-links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/home"}
                className={({ isActive }) =>
                  isActive ? "navbar-link navbar-link--active" : "navbar-link"
                }
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
          
        {/* ── Right Side ── */}
        {/* Search Bar — logged in only */}
        {isAuthenticated && (
          <div className="navbar-search">
            <input
              className="navbar-search-input"
              type="text"
              placeholder="Search"
            />
            <button className="navbar-search-btn" aria-label="Search">
              <Search size={16} />
            </button>
          </div>
        )}


        <div className="navbar-right">
          {/* Language toggle */}
          <button className="navbar-lang-btn" onClick={toggleLang}>
            <img
              src={`https://flagcdn.com/w20/${lang === "en" ? "kh" : "gb"}.png`}
              alt={lang.toUpperCase()}
            />
            <span>{lang === "kh" ? "EN" : "KH"}</span>
          </button>

          
          {/* Notification */}
          <Notification />

          {/* Auth */}
          {!isAuthenticated ? (
            <div className="navbar-auth">
              <button className="navbar-btn-ghost" onClick={openLogin}>{t("nav.login")}</button>
              <button className="navbar-btn-primary" onClick={openRegister}>{t("nav.register")}</button>
            </div>
          ) : (
            <div className="navbar-auth">
              {user?.role === "instructor" || user?.instructor_status === "verified" ? (
                <NavLink to="/instructor/dashboard">
                  <button className="navbar-btn-primary">{t("nav.dashboard")}</button>
                </NavLink>
              ) : (
                <NavLink to="/instructor/register">
                  <button className="navbar-btn-primary">{t("nav.applyInstructor")}</button>
                </NavLink>
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
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <ul className="navbar-mobile-links">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    isActive ? "navbar-mobile-link navbar-mobile-link--active" : "navbar-mobile-link"
                  }
                  onClick={closeMenu}
                  onDoubleClick={() => { navigate("/home"); closeMenu(); }}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-mobile-footer">
            {!isAuthenticated ? (
              <>
                <button className="navbar-btn-ghost navbar-btn--full" onClick={() => { openLogin(); closeMenu(); }}>{t("nav.login")}</button>
                <button className="navbar-btn-primary navbar-btn--full" onClick={() => { openRegister(); closeMenu(); }}>{t("nav.register")}</button>
              </>
            ) : (
              <button
                className="navbar-btn-primary navbar-btn--full"
                onClick={() => { navigate("/profile"); closeMenu(); }}
              >
                {firstName}'s Profile
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
