import "./Footer.css";
import logo from "../assets/logo1.png";
import { Mail, Phone, MapPin, Share2, Send, CirclePlay } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

function Footer() {
  const { settings } = useSettings();
  const siteName = settings.site_name || "Hybrid Learning";

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-col">
            <div className="footer-logo-wrap">
              <img src={logo} alt={siteName} className="footer-logo-img" />
              <span className="footer-logo-name">{siteName}</span>
            </div>
            <p className="footer-desc">
              {settings.site_description ||
                "DRC is an interactive learning platform designed to help you grow your skills with expert-led courses and hands-on practice."}
            </p>
            <div className="social-links">
              <a href="#" className="social-btn" aria-label="GitHub">
                <Share2 size={15} />
              </a>
              <a href="#" className="social-btn" aria-label="LinkedIn">
                <Send size={15} />
              </a>
              <a href="#" className="social-btn" aria-label="YouTube">
                <CirclePlay size={15} />
              </a>
            </div>
          </div>

          {/* Get Help */}
          <div className="footer-col">
            <h4 className="footer-heading">Get Help</h4>
            <ul className="footer-links">
              {["Contact Us", "Latest Articles", "FAQ"].map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div className="footer-col">
            <h4 className="footer-heading">Programs</h4>
            <ul className="footer-links">
              {["Art & Design", "Business", "IT & Software", "Languages", "Programming"].map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-links contact-list">
              <li className="footer-contact-row">
                <MapPin size={14} className="footer-contact-icon" />
                8 Charter Street, Bldg 1295, Natalie 2219 Tower
              </li>
              <li className="footer-contact-row">
                <Phone size={14} className="footer-contact-icon" />
                {settings.support_phone || "+923 11 1234567"}
              </li>
              <li className="footer-contact-row">
                <Mail size={14} className="footer-contact-icon" />
                {settings.support_email || "admin@yoursite.com"}
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>{settings.footer_text || `Copyright 2026 ${siteName} · Powered by ${siteName}`}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
