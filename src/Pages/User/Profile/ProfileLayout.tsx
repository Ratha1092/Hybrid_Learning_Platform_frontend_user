import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ProfileLayout.css";

interface NavItem {
  label: string;
  path?: string;
  search?: string;
  icon: React.ReactNode;
  stub?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    path: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9h14v-9"/>
      </svg>
    ),
  },
  {
    label: "My courses",
    path: "/profile",
    search: "view=courses",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z"/>
      </svg>
    ),
  },
  {
    label: "Certificates",
    stub: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>
      </svg>
    ),
  },
  {
    label: "Wishlist",
    stub: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.5-1.5 2-3.3 2-5a4 4 0 0 0-7-2.6A4 4 0 0 0 7 4 4 4 0 0 0 3 9c0 1.7.5 3.5 2 5l7 7Z"/>
      </svg>
    ),
  },
  {
    label: "Reviews",
    stub: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5L7.2 17l.9-5.4L4.2 9.7l5.4-.8L12 4Z"/>
      </svg>
    ),
  },
  {
    label: "Orders",
    path: "/profile",
    search: "view=orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="17" rx="2"/><path d="M4 9h16M8 3v3M16 3v3"/>
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/profile/edit",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>
      </svg>
    ),
  },
  {
    label: "Settings",
    stub: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.3 1 2-3.4L19.4 13Z"/>
      </svg>
    ),
  },
];

interface Props {
  children: React.ReactNode;
  activeLabel?: string;
}

export default function ProfileLayout({ children, activeLabel }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = navRef.current?.querySelector(".pl-snav__item--active") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [location.pathname, location.search, activeLabel]);

  const isActive = (item: NavItem) => {
    if (activeLabel) return item.label === activeLabel;
    if (item.path === "/profile/edit") return location.pathname === "/profile/edit";
    if (item.label === "Overview") return location.pathname === "/profile" && !location.search;
    if (item.path === "/profile" && item.search) {
      return location.pathname === "/profile" && location.search === `?${item.search}`;
    }
    return false;
  };

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <aside className="pl-side">
          <nav className="pl-snav" ref={navRef}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className={`pl-snav__item${isActive(item) ? " pl-snav__item--active" : ""}${item.stub ? " pl-snav__item--stub" : ""}`}
                onClick={() => {
                  if (!item.stub && item.path) {
                    navigate(item.search ? `${item.path}?${item.search}` : item.path);
                  }
                }}
                disabled={item.stub}
              >
                <span className="pl-snav__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="pl-main">
          {children}
        </main>
      </div>
    </div>
  );
}
