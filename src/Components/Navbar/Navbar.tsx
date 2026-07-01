import { Search, Menu, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { useSettings } from "../../context/SettingsContext";
import Notification from "../Notification/Notification";
import { useLanguage } from "../../context/LanguageContext";
import fallbackLogo from "../../assets/logo1.png";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveLogoUrl(url: string | undefined): string {
  if (!url) return fallbackLogo;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const { openLogin, openRegister } = useAuthModal();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const siteName = settings.site_name || "Digital Learning";
  const logoUrl = resolveLogoUrl(settings.logo_url);

  const nameParts = siteName.split(" ");
  const brandFirst = nameParts[0];
  const brandRest = nameParts.slice(1).join(" ");

  const userNameParts = user?.name?.split(" ") ?? [];
  const lastName = userNameParts.length > 1 ? userNameParts[userNameParts.length - 1] : userNameParts[0] ?? "";
  const initial = (user?.name?.charAt(0) ?? "U").toUpperCase();

  const isStudent = isAuthenticated && user?.role !== "instructor" && user?.instructor_status !== "verified";
  const isInstructor = isAuthenticated && (user?.role === "instructor" || user?.instructor_status === "verified");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Retry the image whenever the URL itself changes (e.g. refreshUser() resolves a working one).
  useEffect(() => { setAvatarBroken(false); }, [user?.avatar_url]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/home",       label: t("nav.home") },
    { to: "/courses",    label: t("nav.courses") },
    { to: "/categories", label: t("nav.categories") },
    { to: "/library",    label: t("nav.library") },
    { to: "/contact",    label: t("nav.contact") },
  ];

  const [avatarBroken, setAvatarBroken] = useState(false);
  const showAvatarImg = !!user?.avatar_url && !avatarBroken;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* ── Logo ── */}
        <NavLink to="/" className="navbar-logo" onClick={closeMenu}>
          <div className="navbar-logo-mark">
            <img src={logoUrl} alt={siteName} className="navbar-logo-img" />
          </div>
          <span className="navbar-logo-text">
            <span className="navbar-logo-word1">{brandFirst}</span>
            {brandRest && <span className="navbar-logo-word2"> {brandRest}</span>}
          </span>
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

        {/* ── Search ── */}
        {isAuthenticated && (
          <div className="navbar-search">
            <Search size={15} className="navbar-search-icon" />
            <input
              className="navbar-search-input"
              type="text"
              placeholder="Search courses, topics…"
            />
          </div>
        )}

        {/* ── Become an Instructor (desktop, logged-in students only) ── */}
        {isStudent && user?.instructor_status !== "pending" && (
          <button
            className="navbar-become-instructor-btn"
            onClick={() => navigate("/instructor/register")}
          >
            Become an Instructor
          </button>
        )}

        <div className="navbar-right">
          {/* Language toggle */}
          <button className="navbar-lang-btn" onClick={toggleLang} title="Toggle language">
            <img
              src={`https://flagcdn.com/w20/${lang === "en" ? "kh" : "gb"}.png`}
              alt={lang.toUpperCase()}
            />
            <span>{lang === "kh" ? "EN" : "KH"}</span>
          </button>

          {/* Notification */}
          {isAuthenticated && <Notification />}

          {/* Auth */}
          {!isAuthenticated ? (
            <div className="navbar-auth">
              <button className="navbar-btn-ghost" onClick={openLogin}>{t("nav.login")}</button>
              <button className="navbar-btn-primary" onClick={openRegister}>{t("nav.register")}</button>
            </div>
          ) : (
            <div className="navbar-auth">
              {/* Instructor dashboard */}
              {isInstructor && (
                <NavLink to="/instructor/dashboard">
                  <button className="navbar-btn-secondary">{t("nav.dashboard")}</button>
                </NavLink>
              )}

              {/* Student dashboard button — sits right before the profile pill */}
              {isStudent && (
                <button
                  className="navbar-dashboard-btn"
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    btn.classList.remove("navbar-dashboard-btn--clicked");
                    void btn.offsetWidth; // force reflow to restart animation
                    btn.classList.add("navbar-dashboard-btn--clicked");
                    navigate("/profile");
                  }}
                >
                  <svg className="navbar-dash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  </svg>
                  Dashboard
                </button>
              )}

              {/* Profile dropdown */}
              <div className="navbar-profile-wrap" ref={dropdownRef}>
                <button
                  className="navbar-profile-btn"
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="navbar-avatar">
                    {showAvatarImg ? (
                      <img src={user!.avatar_url!} alt={user!.name} onError={() => setAvatarBroken(true)} />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <span className="navbar-username">{lastName}</span>
                  <svg
                    className={`navbar-chevron${dropdownOpen ? " navbar-chevron--up" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="navbar-dropdown">
                    <div className="navbar-dd-user">
                      <div className="navbar-dd-avatar">
                        {showAvatarImg ? (
                          <img src={user!.avatar_url!} alt={user!.name} onError={() => setAvatarBroken(true)} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="navbar-dd-info">
                        <span className="navbar-dd-name">{user?.name ?? "—"}</span>
                        <span className="navbar-dd-email">{user?.email ?? "—"}</span>
                      </div>
                    </div>

                    <div className="navbar-dd-sep" />

                    <button
                      className="navbar-dd-item"
                      onClick={() => { setDropdownOpen(false); navigate("/profile/edit"); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit profile
                    </button>

                    <button
                      className="navbar-dd-item"
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.3 1 2-3.4L19.4 13Z"/>
                      </svg>
                      Account settings
                    </button>

                    {isStudent && user?.instructor_status !== "pending" && (
                      <>
                        <button
                          className="navbar-dd-item navbar-dd-item--instructor"
                          onClick={() => { setDropdownOpen(false); navigate("/instructor/register"); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          Become an Instructor
                        </button>
                      </>
                    )}

                    {user?.instructor_status === "pending" && (
                      <div className="navbar-dd-item navbar-dd-item--pending">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                        </svg>
                        Application pending
                      </div>
                    )}

                    <div className="navbar-dd-sep" />

                    <button className="navbar-dd-item navbar-dd-item--logout" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hamburger */}
          <button className="navbar-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
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
                  end={to === "/home"}
                  className={({ isActive }) =>
                    isActive ? "navbar-mobile-link navbar-mobile-link--active" : "navbar-mobile-link"
                  }
                  onClick={closeMenu}
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {isStudent && (
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    isActive ? "navbar-mobile-link navbar-mobile-link--active" : "navbar-mobile-link"
                  }
                  onClick={closeMenu}
                >
                  Dashboard
                </NavLink>
              </li>
            )}
            {isStudent && user?.instructor_status !== "pending" && (
              <li>
                <NavLink
                  to="/instructor/register"
                  className={({ isActive }) =>
                    isActive ? "navbar-mobile-link navbar-mobile-link--active" : "navbar-mobile-link"
                  }
                  onClick={closeMenu}
                >
                  Become an Instructor
                </NavLink>
              </li>
            )}
          </ul>
          <div className="navbar-mobile-footer">
            {!isAuthenticated ? (
              <>
                <button className="navbar-btn-ghost navbar-btn--full" onClick={() => { openLogin(); closeMenu(); }}>{t("nav.login")}</button>
                <button className="navbar-btn-primary navbar-btn--full" onClick={() => { openRegister(); closeMenu(); }}>{t("nav.register")}</button>
              </>
            ) : (
              <button className="navbar-btn-primary navbar-btn--full" onClick={() => { navigate("/profile/edit"); closeMenu(); }}>Edit Profile</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
