import { BookOpen, CheckCircle2,  Play, Users } from "lucide-react";

import { Link} from "react-router-dom";
function Hero() {
  const token = localStorage.getItem("token");
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Online Learning Platform
          </div>
          <h1 className="hero-title">
            <span className="hero-highlight">Studying</span> Online is now
            <br />
            much easier
          </h1>
          <p className="hero-desc">
            TOTC is an interesting platform that will teach you in a more
            interactive way.
          </p>
          <div className="hero-actions">
            {token ? (
              <Link to="/courses" className="btn btn-white">
                Play Now
              </Link>
            ) : (
              <Link to="/PageRegister" className="btn btn-white">
                Join for free
              </Link>
            )}
            <button className="btn btn-ghost-white">
              <span className="play-icon">
                <Play size={14} fill="white" />
              </span>
              Watch how it works
            </button>
          </div>
          <div className="floating-stat">
            <div className="floating-stat-icon">
              <Users size={20} />
            </div>
            <div>
              <div className="floating-stat-value">250k+</div>
              <div className="floating-stat-label">Assisted Students</div>
            </div>
          </div>
        </div>

        <div className="hero-image-wrap">
          <div className="hero-img-backdrop" />
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&q=80"
            alt="Student learning online"
            className="hero-img"
          />

          <div className="floating-course-card">
            <div className="fcc-thumb">
              <BookOpen size={18} />
            </div>
            <div className="fcc-info">
              <div className="fcc-title">User Experience Class</div>
              <div className="fcc-meta">Tutor: 120,674</div>
            </div>
            <button className="fcc-btn">Join Now</button>
          </div>

          <div className="floating-congrats-card">
            <CheckCircle2 size={22} className="congrats-icon" />
            <div>
              <div className="congrats-title">Congratulations</div>
              <div className="congrats-sub">Your admission completed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}
export default Hero;