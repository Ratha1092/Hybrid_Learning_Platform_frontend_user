import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { instructorService, type DashboardStats } from "../../../../services/instructorService";
import "../css/InstructorDashboard.css";

function greeting(name: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${period}, ${name}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    instructorService.getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const nameParts = (user?.name ?? "Instructor").split(" ");
  const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
  const avatarLetter = (user?.name ?? "I").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="id2-state">
        <div className="id2-spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="id2-state id2-state--err">
        <p>Failed to load dashboard.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const STATS = [
    {
      label: "Total Courses",
      value: data.courses.total,
      mod: "gold",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z"/>
        </svg>
      ),
    },
    {
      label: "Published",
      value: data.courses.published,
      mod: "pine",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>
        </svg>
      ),
    },
    {
      label: "Students",
      value: data.students.total_unique,
      mod: "ink",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Revenue",
      value: `$${Number(data.revenue.total_earned).toFixed(2)}`,
      mod: "teal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="id2-root">

      {/* ── Greeting row ── */}
      <div className="id2-top">
        <div className="id2-hello">
          <p className="id2-eyebrow">{formatDate()}</p>
          <h1 className="id2-h1">{greeting(firstName)} 👋</h1>
          <p className="id2-sub">Manage your courses and track your students' progress.</p>
        </div>

        <div className="id2-pf-chip card">
          <div className="id2-pf-av">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.name} />
              : <span>{avatarLetter}</span>
            }
          </div>
          <div className="id2-pf-info">
            <div className="id2-pf-name">{user?.name ?? "Instructor"}</div>
            <span className="id2-pf-badge">INSTRUCTOR</span>
          </div>
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div className="id2-tiles card">
        {STATS.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="id2-tile">
              <div className={`id2-tile-icon id2-tile-icon--${s.mod}`}>{s.icon}</div>
              <div className="id2-tile-body">
                <div className="id2-tile-n">{s.value}</div>
                <div className="id2-tile-l">{s.label}</div>
              </div>
            </div>
            {i < STATS.length - 1 && <div className="id2-tile-div" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Bottom row: quick actions + recent students ── */}
      <div className="id2-row">

        {/* Quick actions */}
        <div className="id2-actions card">
          <div className="id2-card-head">Quick actions</div>
          <button className="id2-action-btn id2-action-btn--primary" onClick={() => navigate("/instructor/courses/create")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
            </svg>
            Create new course
          </button>
          <button className="id2-action-btn" onClick={() => navigate("/instructor/courses")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z"/>
            </svg>
            View my courses
          </button>
          <button className="id2-action-btn" onClick={() => navigate("/instructor/students")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Manage students
          </button>
          <button className="id2-action-btn" onClick={() => navigate("/instructor/revenue")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>
            </svg>
            Revenue report
          </button>
        </div>

        {/* Recent students */}
        <div className="id2-recent card">
          <div className="id2-card-head">
            <span>Recent students</span>
            <button className="id2-view-all" onClick={() => navigate("/instructor/students")}>VIEW ALL →</button>
          </div>

          {data.recent_enrollments.length === 0 ? (
            <div className="id2-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <p>No students enrolled yet.</p>
            </div>
          ) : (
            <div className="id2-student-list">
              {data.recent_enrollments.map((e, i) => (
                <div key={i} className="id2-student-row">
                  <div className="id2-student-av">
                    {e.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="id2-student-info">
                    <div className="id2-student-name">{e.student_name}</div>
                    <div className="id2-student-email">{e.student_email}</div>
                  </div>
                  <div className="id2-student-right">
                    <div className="id2-student-course">{e.course_title}</div>
                    <div className="id2-student-date">
                      {new Date(e.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
