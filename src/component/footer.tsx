import { Award, CirclePlay, Send, Share2 } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <div className="logo-icon">
                <Award size={22} />
              </div>
              <span className="logo-text">DRC</span>
            </div>
            <p className="footer-desc">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className="social-links">
              <a href="#" className="social-btn" aria-label="Facebook">
                <Share2 size={16} />
              </a>
              <a href="#" className="social-btn" aria-label="Twitter">
                <Send size={16} />
              </a>
              <a href="#" className="social-btn" aria-label="Youtube">
                <CirclePlay size={16} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">GET HELP</h4>
            <ul className="footer-links">
              {['Contact Us', 'Latest Articles', 'FAQ'].map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">PROGRAMS</h4>
            <ul className="footer-links">
              {['Art & Design', 'Business', 'IT & Software', 'Languages', 'Programming'].map(
                (link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">CONTACT US</h4>
            <ul className="footer-links contact-list">
              <li>Address: 8 Charter Street, Bldg 1295, Natalie 2219 Tower</li>
              <li>Tel: +923 11 1234567</li>
              <li>Mail: admin@yoursite.com</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Copyright 2024 DRC | Powered by DRC</p>
        </div>
      </div>
    </footer>
  )
}
export default Footer;