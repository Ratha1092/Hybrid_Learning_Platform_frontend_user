import { BookOpen, CheckCircle2, Play, Users, BookMarked, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import heroImage from "../assets/image1.png";
import "./Hero.css";

interface PlatformStats {
  total_students: number;
  total_instructors: number;
  total_courses: number;
}

function Hero() {
  const token = localStorage.getItem("token");
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.get("/stats").then((res) => setStats(res.data.data)).catch(() => {});
  }, []);

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k+`;
    return `${n}`;
  };

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-inner">
        {/* ── Left: Content ── */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Online Learning Platform
          </div>

          <h1 className="hero-title">
            <span className="hero-highlight">Studying</span> Online is now much easier
          </h1>

          <p className="hero-desc">
            Hybrid Learning is a modern platform that will teach you in a more
            interactive and engaging way.
          </p>

          <div className="hero-actions">
            {token ? (
              <Link to="/courses" className="btn btn-white">Start Learning</Link>
            ) : (
              <Link to="/PageRegister" className="btn btn-white">Join for free</Link>
            )}
            <button className="btn btn-ghost-white">
              <span className="play-icon"><Play size={13} fill="white" /></span>
              Watch how it works
            </button>
          </div>

          {/* Stats row */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon"><Users size={16} /></div>
              <div className="hero-stat-value">{stats ? fmt(stats.total_students) : "—"}</div>
              <div className="hero-stat-label">Students</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-icon"><BookMarked size={16} /></div>
              <div className="hero-stat-value">{stats ? fmt(stats.total_courses) : "—"}</div>
              <div className="hero-stat-label">Courses</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-icon"><GraduationCap size={16} /></div>
              <div className="hero-stat-value">{stats ? fmt(stats.total_instructors) : "—"}</div>
              <div className="hero-stat-label">Instructors</div>
            </div>
          </div>
        </div>

        {/* ── Right: Image ── */}
        <div className="hero-image-wrap">
          <div className="hero-img-backdrop" />
          <img
            src={heroImage}
            alt="Student learning online"
            className="hero-img"
          />

          <div className="floating-course-card">
            <div className="fcc-thumb"><BookOpen size={18} /></div>
            <div className="fcc-info">
              <div className="fcc-title">User Experience Class</div>
              <div className="fcc-meta">120,674 enrolled</div>
            </div>
             {token ? (
                <Link to="/courses" className="fcc-btn">
                  Join Now
                </Link>
              ) : (
                <Link to="/PageLogin" className="fcc-btn">
                  Start Now
                </Link>
              )}
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
  );
}

export default Hero;
