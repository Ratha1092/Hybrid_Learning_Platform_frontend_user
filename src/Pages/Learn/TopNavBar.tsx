import { PanelLeft, Search, Sun, Moon, GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";

interface TopNavBarProps {
  courseTitle: string;
  courseSlug: string;
  lessonTitle: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function TopNavBar({ courseTitle, courseSlug, lessonTitle, sidebarCollapsed, onToggleSidebar }: TopNavBarProps) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();

  const siteName = settings.site_name || "Hybrid Learning";
  const initial = (user?.name?.charAt(0) ?? "U").toUpperCase();

  return (
    <header className="lesson-topnav">
      <div className="lesson-topnav__left">
        <button
          className="lesson-topnav__icon-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Show curriculum" : "Hide curriculum"}
          aria-label={sidebarCollapsed ? "Show curriculum" : "Hide curriculum"}
        >
          <PanelLeft size={17} />
        </button>

        <NavLink to="/" className="lesson-topnav__logo">
          {settings.site_logo ? (
            <img src={settings.site_logo} alt={siteName} />
          ) : (
            <span className="lesson-topnav__logo-fallback"><GraduationCap size={16} /></span>
          )}
          <span className="lesson-topnav__logo-text">{siteName}</span>
        </NavLink>

        <nav className="lesson-topnav__breadcrumb" aria-label="Breadcrumb">
          <span className="lesson-topnav__crumb-sep">/</span>
          <NavLink to={`/courses/${courseSlug}`} className="lesson-topnav__crumb">
            {courseTitle}
          </NavLink>
          <span className="lesson-topnav__crumb-sep">/</span>
          <span className="lesson-topnav__crumb lesson-topnav__crumb--current">{lessonTitle}</span>
        </nav>
      </div>

      <div className="lesson-topnav__right">
        <button className="lesson-topnav__icon-btn" title="Search" aria-label="Search">
          <Search size={16} />
        </button>
        <button
          className="lesson-topnav__icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {isAuthenticated ? (
          <NavLink to="/profile" className="lesson-topnav__avatar" title={user?.name}>
            {user?.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : <span>{initial}</span>}
          </NavLink>
        ) : (
          <>
            <button className="lesson-topnav__signin" onClick={openLogin}>Sign In</button>
            <button className="lesson-topnav__cta" onClick={openRegister}>Get Started</button>
          </>
        )}
      </div>
    </header>
  );
}
