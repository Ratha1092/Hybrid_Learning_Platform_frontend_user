import { GraduationCap, Menu, X, ChevronDown, LogOut, User, Settings, Users, Sun, Moon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import SearchBar from "../Search/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { useSettings } from "../../context/SettingsContext";
import Notification from "../Notification/Notification";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { openLogin, openRegister } = useAuthModal();
  const { settings } = useSettings();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const siteName = settings.site_name || "Hybrid Learning";
  const nameParts = siteName.split(" ");
  const brandFirst = nameParts[0];
  const brandRest = nameParts.slice(1).join(" ");

  const initial = (user?.name?.charAt(0) ?? "U").toUpperCase();
  const showAvatarImg = !!user?.avatar_url && !avatarBroken;

  const isStudent = isAuthenticated && user?.role !== "instructor" && user?.instructor_status !== "verified";
  const isInstructor = isAuthenticated && (user?.role === "instructor" || user?.instructor_status === "verified");

  const navLinks = [
    { to: "/home",       label: t("nav.home") },
    { to: "/courses",    label: t("nav.courses") },
    { to: "/instructors", label: t("nav.instructors") },
    { to: "/library",    label: t("nav.library") },
    { to: "/contact",    label: t("nav.contact") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setAvatarBroken(false); }, [user?.avatar_url]);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => { setDropdownOpen(false); logout(); navigate("/"); };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "glass shadow-soft dark:bg-slate-900/90 dark:border-b dark:border-slate-800" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMenu}>
            {settings.site_logo ? (
              <img src={settings.site_logo} alt={siteName} className="h-9 w-9 rounded-xl object-cover shadow-glow" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-xl grad-blue text-white shadow-glow">
                <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
              </span>
            )}
            <span className="font-display text-lg font-extrabold ink">
              {brandFirst}<span className="brand-blue">{brandRest ? ` ${brandRest}` : ""}</span>
            </span>
          </NavLink>

          {/* ── Desktop Nav Links ── */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/home"}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                      isActive ? "text-blue-500" : "text-slate-600 dark:text-slate-300"
                    }`
                  }
                  onClick={closeMenu}
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      <span
                        className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full grad-blue transition-transform duration-300 ${
                          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <SearchBar />

            {/* Notifications */}
            {isAuthenticated && <Notification />}

            {/* Language toggle */}
            <button
              className="hidden h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-2.5 text-xs font-semibold text-slate-600 shadow-e1 transition-colors hover:bg-white sm:flex dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={toggleLang}
              title="Toggle language"
            >
              <img
                src={`https://flagcdn.com/w20/${lang === "en" ? "kh" : "gb"}.png`}
                alt={lang.toUpperCase()}
                className="h-3.5 w-5 rounded-sm object-cover"
              />
              <span>{lang === "kh" ? "EN" : "KH"}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/60 text-slate-600 shadow-e1 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Divider */}
            <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

            {/* Auth */}
            {!isAuthenticated ? (
              <>
                <button
                  onClick={openLogin}
                  className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:block"
                >
                  {t("nav.login")}
                </button>
                <button
                  onClick={openRegister}
                  className="hidden h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 hover:bg-blue-700 sm:inline-flex items-center"
                >
                  {t("nav.register")}
                </button>
              </>
            ) : (
              <>
                {/* Dashboard link — all authenticated users */}
                {isAuthenticated && (
                  <NavLink
                    to={isInstructor ? "/instructor/dashboard" : "/profile"}
                    className="hidden h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold ink shadow-e1 transition-colors hover:border-blue-300 hover:text-blue-600 md:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  >
                    Dashboard
                  </NavLink>
                )}

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-e1 transition-colors hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
                    onClick={() => setDropdownOpen(v => !v)}
                    aria-expanded={dropdownOpen}
                  >
                    <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
                      {showAvatarImg ? (
                        <img src={user!.avatar_url!} alt={user!.name} className="h-7 w-7 object-cover" onError={() => setAvatarBroken(true)} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <span className="hidden max-w-[80px] truncate text-sm font-semibold ink sm:block">
                      {user?.name?.split(" ")[0] ?? ""}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
                      {/* User info */}
                      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                          {showAvatarImg ? (
                            <img src={user!.avatar_url!} alt={user!.name} className="h-9 w-9 object-cover" onError={() => setAvatarBroken(true)} />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold ink">{user?.name ?? "—"}</p>
                          <p className="truncate text-[11.5px] text-slate-400">{user?.email ?? "—"}</p>
                        </div>
                      </div>

                      <div className="p-1.5">
                        {isStudent && (
                          <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                          >
                            <User className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Dashboard
                          </button>
                        )}
                        <button
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={() => { setDropdownOpen(false); navigate("/profile/edit"); }}
                        >
                          <Settings className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Account settings
                        </button>
                        {isStudent && user?.instructor_status !== "pending" && (
                          <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            onClick={() => { setDropdownOpen(false); navigate("/instructor/register"); }}
                          >
                            <Users className="h-4 w-4" /> Become an Instructor
                          </button>
                        )}
                        {user?.instructor_status === "pending" && (
                          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                            <span className="h-4 w-4 text-center">⏳</span> Application pending
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                        <button
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" /> Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden focus-ring"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="pb-4 lg:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <ul className="flex flex-col">
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/home"}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                          isActive ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`
                      }
                      onClick={closeMenu}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
                {isAuthenticated && (
                  <li>
                    <NavLink to={isInstructor ? "/instructor/dashboard" : "/profile"} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={closeMenu}>
                      Dashboard
                    </NavLink>
                  </li>
                )}
              </ul>

              <div className="mt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                <button
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={toggleLang}
                >
                  <img src={`https://flagcdn.com/w20/${lang === "en" ? "kh" : "gb"}.png`} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                  {lang === "kh" ? "EN" : "KH"}
                </button>
                {!isAuthenticated ? (
                  <>
                    <button className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => { openLogin(); closeMenu(); }}>
                      {t("nav.login")}
                    </button>
                    <button className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => { openRegister(); closeMenu(); }}>
                      {t("nav.register")}
                    </button>
                  </>
                ) : (
                  <button className="flex-1 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50" onClick={() => { handleLogout(); closeMenu(); }}>
                    Log out
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
