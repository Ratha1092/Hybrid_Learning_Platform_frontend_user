import { NavLink, Outlet, } from "react-router-dom";

import "../css/InstructorLayout.css";

const MENU_LINKS = [
  { to: "/instructor/dashboard",      label: "Dashboard",     icon: "⊞", end: true },
  { to: "/instructor/courses/sections", label: "Create Sections", icon: "⊕", end: true },
  { to: "/instructor/courses/create", label: "Create Course", icon: "⊕", end: true },
  { to: "/instructor/courses",        label: "My Courses",    icon: "🎓", end: true },
  { to: "/instructor/students",       label: "Students",      icon: "👤", end: true },
  { to: "/instructor/revenue",        label: "Revenue",       icon: "💵", end: true },
];

export default function InstructorLayout() {
 
 

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

       
      </aside>

      {/* ── Content ── */}
      <main className="il-content">
        <Outlet />
      </main>
    </div>
  );
}
