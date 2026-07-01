import "./Footer.css";
import fallbackLogo from "../assets/logo1.png";
import { Mail, Phone, MapPin, Share2, Send, CirclePlay } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { NavLink } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveLogoUrl(url: string | undefined): string {
  if (!url) return fallbackLogo;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function Footer() {
  const { settings } = useSettings();
  const siteName = settings.site_name || "Digital Learning";
  const logoUrl = resolveLogoUrl(settings.logo_url);

  const nameParts = siteName.split(" ");
  const brandFirst = nameParts[0];
  const brandRest = nameParts.slice(1).join(" ");

  const exploreRef = useRef<HTMLDetailsElement>(null);
  const programsRef = useRef<HTMLDetailsElement>(null);
  const contactRef = useRef<HTMLDetailsElement>(null);

  // <details> defaults to open (matches the old static desktop layout exactly).
  // On mobile only, collapse on mount so the footer isn't a giant wall of links.
  useLayoutEffect(() => {
    if (!window.matchMedia("(max-width: 600px)").matches) return;
    [exploreRef, programsRef, contactRef].forEach(ref => {
      if (ref.current) ref.current.open = false;
    });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-col footer-col--brand">
            <NavLink to="/" className="footer-logo">
              <div className="footer-logo-mark">
                <img src={logoUrl} alt={siteName} />
              </div>
              <span className="footer-logo-text">
                <span className="footer-logo-w1">{brandFirst}</span>
                {brandRest && <span className="footer-logo-w2"> {brandRest}</span>}
              </span>
            </NavLink>
            <p className="footer-desc">
              {settings.site_description ||
                "An interactive learning platform designed to help you grow your skills with expert-led courses and hands-on practice."}
            </p>
            <div className="footer-socials">
              <a href="#" className="footer-social" aria-label="GitHub"><Share2 size={16} /></a>
              <a href="#" className="footer-social" aria-label="LinkedIn"><Send size={16} /></a>
              <a href="#" className="footer-social" aria-label="YouTube"><CirclePlay size={16} /></a>
            </div>
          </div>

          {/* Explore — collapsible on mobile, always expanded on desktop */}
          <details className="footer-col footer-col--collapsible" open ref={exploreRef}>
            <summary className="footer-heading">Explore</summary>
            <ul className="footer-links">
              <li><NavLink to="/courses">All Courses</NavLink></li>
              <li><NavLink to="/categories">Categories</NavLink></li>
              <li><NavLink to="/library">Library</NavLink></li>
              <li><a href="#">Certificates</a></li>
            </ul>
          </details>

          {/* Programs — collapsible on mobile, always expanded on desktop */}
          <details className="footer-col footer-col--collapsible" open ref={programsRef}>
            <summary className="footer-heading">Programs</summary>
            <ul className="footer-links">
              {["Art & Design", "Business", "IT & Software", "Languages", "Programming"].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </details>

          {/* Contact — collapsible on mobile, always expanded on desktop */}
          <details className="footer-col footer-col--collapsible" open ref={contactRef}>
            <summary className="footer-heading">Contact</summary>
            <ul className="footer-links footer-links--contact">
              <li>
                <MapPin size={13} />
                8 Charter Street, Bldg 1295, Natalie Tower
              </li>
              <li>
                <Phone size={13} />
                {settings.support_phone || "+855 12 345 678"}
              </li>
              <li>
                <Mail size={13} />
                {settings.support_email || "hello@digitallearning.com"}
              </li>
            </ul>
          </details>

        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            {settings.footer_text || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
