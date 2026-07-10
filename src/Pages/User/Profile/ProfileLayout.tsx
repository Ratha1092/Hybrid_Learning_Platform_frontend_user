import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Award, Heart, Star,
  ShoppingBag, User, Settings,
} from "lucide-react";
import "./ProfileLayout.css";

interface NavItem {
  label: string;
  path: string;
  search?: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview",     path: "/profile",                icon: <LayoutDashboard size={18} /> },
  { label: "My courses",   path: "/profile", search: "view=courses",      icon: <BookOpen size={18} /> },
  { label: "Certificates", path: "/profile", search: "view=certificates", icon: <Award size={18} /> },
  { label: "Wishlist",     path: "/profile", search: "view=wishlist",     icon: <Heart size={18} /> },
  { label: "Reviews",      path: "/profile", search: "view=reviews",      icon: <Star size={18} /> },
  { label: "Orders",       path: "/profile", search: "view=orders",       icon: <ShoppingBag size={18} /> },
  { label: "Profile",      path: "/profile/edit",                         icon: <User size={18} /> },
  { label: "Settings",     path: "/profile", search: "view=settings",     icon: <Settings size={18} /> },
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
    if (item.search) return location.pathname === "/profile" && location.search === `?${item.search}`;
    return false;
  };

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <aside className="pl-side">
          <p className="pl-snav-label">Student</p>
          <nav className="pl-snav" ref={navRef}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className={`pl-snav__item${isActive(item) ? " pl-snav__item--active" : ""}`}
                onClick={() => navigate(item.search ? `${item.path}?${item.search}` : item.path)}
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
