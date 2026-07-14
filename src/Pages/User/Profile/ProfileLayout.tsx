import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Award, Heart, Star,
  ShoppingBag, User, Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  search?: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview",     path: "/profile",                                  Icon: LayoutDashboard },
  { label: "My courses",   path: "/profile", search: "view=courses",          Icon: BookOpen },
  { label: "Certificates", path: "/profile", search: "view=certificates",     Icon: Award },
  { label: "Wishlist",     path: "/profile", search: "view=wishlist",         Icon: Heart },
  { label: "Reviews",      path: "/profile", search: "view=reviews",          Icon: Star },
  { label: "Orders",       path: "/profile", search: "view=orders",           Icon: ShoppingBag },
  { label: "Profile",      path: "/profile", search: "view=edit",             Icon: User },
  { label: "Settings",     path: "/profile", search: "view=settings",         Icon: Settings },
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
    const active = navRef.current?.querySelector("[data-active='true']") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [location.pathname, location.search, activeLabel]);

  const isActive = (item: NavItem) => {
    if (activeLabel) return item.label === activeLabel;
    if (item.label === "Overview") return location.pathname === "/profile" && !location.search;
    if (item.search) return location.pathname === "/profile" && location.search === `?${item.search}`;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#EEF1F6] dark:bg-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* Sidebar */}
          <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Student</p>
            <nav
              ref={navRef}
              className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-e1 lg:flex-col lg:overflow-visible dark:border-slate-700 dark:bg-slate-800"
            >
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={item.label}
                    data-active={active ? "true" : undefined}
                    onClick={() => navigate(item.search ? `${item.path}?${item.search}` : item.path)}
                    className={`group flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? "grad-blue text-white shadow-glow"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <item.Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      }`}
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 pb-24">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
