import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

const cols = [
  { title: "Explore",  items: [{ label: "All Courses",    to: "/courses" }, { label: "Categories",    to: "/categories" }, { label: "Library",      to: "/library" }, { label: "Certificates", to: "/courses" }] },
  { title: "Programs", items: [{ label: "Design",         to: "/courses?category=design" }, { label: "Programming",  to: "/courses?category=programming" }, { label: "AI & Data",    to: "/courses?category=ai" }, { label: "Business",     to: "/courses?category=business" }] },
  { title: "Company",  items: [{ label: "About",          to: "/contact" }, { label: "Become Instructor", to: "/instructor/register" }, { label: "Contact",      to: "/contact" }, { label: "Blog",         to: "/" }] },
  { title: "Support",  items: [{ label: "Help Center",    to: "/contact" }, { label: "Contact",      to: "/contact" }, { label: "Privacy",      to: "/" }, { label: "Terms",        to: "/" }] },
];

const socialIcons: { key: "social_facebook" | "social_twitter" | "social_youtube" | "social_linkedin"; path: string }[] = [
  { key: "social_facebook", path: "M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9h2.8L15.7 15h-2.2v7A10 10 0 0 0 22 12Z" },
  { key: "social_twitter", path: "M18.9 2H22l-7.5 8.6L23 22h-6.9l-5.4-7-6.2 7H1.4l8-9.2L1 2h7l4.9 6.5L18.9 2Zm-1.2 18h1.9L6.4 4H4.3l13.4 16Z" },
  { key: "social_youtube", path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5l6.3 3.5-6.3 3.5Z" },
  { key: "social_linkedin", path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9Z" },
];

export default function Footer() {
  const { settings } = useSettings();
  const siteName = settings.site_name || "Hybrid Learning";
  const nameParts = siteName.split(" ");
  const brandFirst = nameParts[0];
  const brandRest = nameParts.slice(1).join(" ");

  const address = settings.contact_address || "8 Charter Street, Natalie Tower";
  const phone   = settings.support_phone   || "+855 12 345 678";
  const email   = settings.support_email   || "support@hybridlearning.com";

  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto max-w-[1400px] px-4 py-11 sm:px-6">

        {/* Main grid */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <NavLink to="/" className="flex items-center gap-2.5">
              {settings.site_logo ? (
                <img src={settings.site_logo} alt={siteName} className="h-9 w-9 rounded-xl object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-xl grad-blue text-white">
                  <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
                </span>
              )}
              <span className="font-display text-lg font-extrabold text-white">
                {brandFirst}<span className="brand-blue">{brandRest ? ` ${brandRest}` : ""}</span>
              </span>
            </NavLink>
            <p className="mt-3.5 max-w-xs text-[13.5px] leading-relaxed text-slate-400">
              {settings.site_description || "A modern learning marketplace helping students and instructors grow — without limits."}
            </p>
            <div className="mt-4 space-y-2 text-[13px] text-slate-400">
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 brand-blue" /> {address}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 brand-blue" /> {phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 brand-blue" /><span className="break-all">{email}</span></p>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:contents">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="font-display text-sm font-bold text-white">{c.title}</h4>
                <ul className="mt-4 space-y-3 text-sm">
                  {c.items.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="text-slate-400 transition-colors hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-9 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            {settings.footer_text || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </p>
          <div className="flex gap-2">
            {socialIcons
              .filter(({ key }) => settings[key])
              .map(({ key, path }) => (
                <a
                  key={key}
                  href={settings[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-brand hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d={path} /></svg>
                </a>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
