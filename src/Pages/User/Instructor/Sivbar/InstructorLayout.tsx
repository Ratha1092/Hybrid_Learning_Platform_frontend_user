import { useEffect, useRef, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import DashboardModeToggle from "../../../../Components/DashboardModeToggle/DashboardModeToggle";
import "../css/InstructorLayout.css";

type MenuLink = {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
  children?: MenuLink[];
};

const MENU_LINKS: MenuLink[] = [
  {
    to: "/instructor/dashboard",
    label: "Dashboard",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },

  {
    to: "/instructor/courses",
    label: "My Courses",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z" />
      </svg>
    ),
    children: [
      {
        to: "/instructor/courses/create",
        label: "Create Course",
        end: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        ),
      },

      {
        to: "/instructor/courses/sections",
        label: "Create Sections",
        end: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        ),
      },
    ],
  },

  {
    to: "/instructor/students",
    label: "Students",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },

  {
    to: "/instructor/revenue",
    label: "Revenue",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
      </svg>
    ),
    children: [
      {
        to: "/instructor/revenue",
        label: "Payout History",
        end: true,
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5h16" />
            <path d="M4 9h16" />
            <path d="M4 13h10" />
            <path d="M4 17h8" />
            <circle cx="18" cy="16" r="3" />
            <path d="m20.2 18.2 1.3 1.3" />
          </svg>
        ),
      },
    ],
  },

  {
    to: "/instructor/payout-account",
    label: "Payout Account",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    ),
  },
];

const BOTTOM_LINKS: MenuLink[] = [
  {
    to: "/instructor/profile",
    label: "Profile",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function InstructorLayout() {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active =
      navRef.current?.querySelector<HTMLElement>(".il-link--active");

    active?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [location.pathname]);

  return (
    <div className="il-page">
      <div className="il-wrap">
        {/* Sidebar */}
        <aside className="il-sidebar">
          <p className="il-section-label">Instructor</p>

          <DashboardModeToggle className="mb-3.5" />

          <nav className="il-nav" ref={navRef}>
            {MENU_LINKS.map((link) => (
              <div key={link.to} className="il-link-group">
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `il-link${isActive ? " il-link--active" : ""}`
                  }
                >
                  <span className="il-link__icon">
                    {link.icon}
                  </span>

                  {link.label}
                </NavLink>

                {link.children?.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    end={child.end}
                    className={({ isActive }) =>
                      `il-link il-link--sub${
                        isActive ? " il-link--active" : ""
                      }`
                    }
                  >
                    <span className="il-link__icon">
                      {child.icon}
                    </span>

                    {child.label}
                  </NavLink>
                ))}
              </div>
            ))}

            <div className="il-sidebar-div" />

            {BOTTOM_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `il-link${isActive ? " il-link--active" : ""}`
                }
              >
                <span className="il-link__icon">
                  {link.icon}
                </span>

                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="il-content">
          <div
            className="page-fade"
            key={location.pathname}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}