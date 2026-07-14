import { NavLink, Outlet } from "react-router-dom";
import "../css/InstructorLayout.css";

const MENU_LINKS = [
  {
    to: "/instructor/dashboard",
    label: "Dashboard",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: "/instructor/courses",
    label: "My Courses",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z"/>
      </svg>
    ),
  },
  {
    to: "/instructor/courses/create",
    label: "Create Course",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
      </svg>
    ),
  },
  {
    to: "/instructor/courses/sections",
    label: "Create Sections",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  },
  {
    to: "/instructor/students",
    label: "Students",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: "/instructor/revenue",
    label: "Revenue",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>
      </svg>
    ),
  },
  {
    to: "/instructor/payout-account",
    label: "Payout Account",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
        <path d="M6 15h4"/>
      </svg>
    ),
  },
];

export default function InstructorLayout() {
  return (
    <div className="il-page">
      <div className="il-wrap">
        {/* ── Sidebar ── */}
        <aside className="il-sidebar">
          <p className="il-section-label">Instructor</p>
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
    </div>
  );
}
