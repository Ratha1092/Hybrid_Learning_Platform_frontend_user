import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import "./InstructorLayout.css";

const MENU_LINKS = [
  { to: "/instructor/dashboard",      label: "Dashboard",     icon: "⊞", end: true },
  { to: "/instructor/courses/create", label: "Create Course", icon: "⊕", end: true },
  { to: "/instructor/courses",        label: "My Courses",    icon: "🎓", end: true },
  { to: "/instructor/students",       label: "Students",      icon: "👤", end: true },
  { to: "/instructor/revenue",        label: "Revenue",       icon: "💵", end: true },
];

export default function InstructorLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/instructor/login", { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="il-wrap">
      {/* ── Sidebar ── */}
      <aside className="il-sidebar">

        {/* MENU section */}
        <div className="il-section-label">MENU</div>
        <nav className="il-nav">
          {MENU_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `il-link${isActive ? " il-link--active" : ""}`
              }
            >
              <span className="il-link__icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="il-footer">
          <div className="il-footer__user">
            <div className="il-footer__avatar">
              {user?.name?.charAt(0).toUpperCase() ?? "I"}
            </div>
            <div>
              <p className="il-footer__name">{user?.name}</p>
              <p className="il-footer__role">Instructor</p>
            </div>
          </div>
          <button className="il-footer__logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="il-content">
        <Outlet />
      </main>
    </div>
  );
}
