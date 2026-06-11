import { useState, type ChangeEvent } from "react";
import { usePlatformStats } from "../../../hooks/usePlatformStats";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";
import "./InstructorLogin.css";

type Status = "idle" | "loading" | "error";

export default function InstructorLogin() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const stats = usePlatformStats();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in as instructor → go straight to dashboard
  if (isAuthenticated && (user as { role?: string })?.role === "instructor") {
    navigate("/instructor/dashboard", { replace: true });
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setStatus("loading");
    try {
      const { data } = await authService.login(form);
      login(data.data.user, data.data.token);
      navigate("/instructor/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || "Login failed. Please check your credentials.");
      setStatus("error");
    }
  };

  return (
    <div className="ilogin-page">
      <div className="ilogin-card">

        {/* ── Left panel ── */}
        <div className="ilogin-left">
          <div className="ilogin-dots" />

          <div className="ilogin-brand">
            <div className="ilogin-brand__logo">HL</div>
            <div>
              <div className="ilogin-brand__name">Hybrid Learning</div>
              <div className="ilogin-brand__sub">Instructor Portal</div>
            </div>
          </div>

          <div className="ilogin-hero">
            <div className="ilogin-hero__code">
              <span className="ca">teach();</span>
              <span className="cb">inspire();</span>
              <span className="cc">create();</span>
              <span className="cd">earn();</span>
            </div>
            <p className="ilogin-hero__desc">
              Build and sell your courses. Reach students worldwide on Hybrid Learning Platform.
            </p>
          </div>

          <div className="ilogin-stats">
            <div className="ilogin-stat">
              <div className="ilogin-stat__num">{stats?.total_courses ?? "—"}</div>
              <div className="ilogin-stat__label">Courses</div>
              <div className="ilogin-stat__trend">↑ 8.3%</div>
            </div>
            <div className="ilogin-stat">
              <div className="ilogin-stat__num">{stats?.total_instructors ?? "—"}</div>
              <div className="ilogin-stat__label">Instructors</div>
              <div className="ilogin-stat__trend">↑ 5.7%</div>
            </div>
            <div className="ilogin-stat">
              <div className="ilogin-stat__num">{stats?.total_students ?? "—"}</div>
              <div className="ilogin-stat__label">Students</div>
              <div className="ilogin-stat__trend">↑ 12.5%</div>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="ilogin-right">
          <div className="ilogin-form-panel">
            <div className="ilogin-badge">🎓 Instructor Access</div>
            <h1 className="ilogin-title">Welcome back_</h1>
            <p className="ilogin-subtitle">
              Sign in to access your instructor dashboard.
            </p>

            {error && <div className="ilogin-alert">⚠ {error}</div>}

            <form onSubmit={handleSubmit} className="ilogin-form" noValidate>
              <div className="ilogin-field">
                <label className="ilogin-label">Email address *</label>
                <div className="ilogin-input-wrap">
                  <span className="ilogin-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                  <input
                    type="email" name="email"
                    value={form.email} onChange={handleChange}
                    placeholder="your@email.com"
                    className="ilogin-input"
                  />
                </div>
              </div>

              <div className="ilogin-field">
                <label className="ilogin-label">Password *</label>
                <div className="ilogin-input-wrap">
                  <span className="ilogin-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="ilogin-input"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="ilogin-eye" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="ilogin-btn" disabled={status === "loading"}>
                {status === "loading" ? <span className="ilogin-spinner" /> : ">_ SIGN IN →"}
              </button>
            </form>

            <p className="ilogin-back" onClick={() => navigate("/")}>← Back to Home</p>
          </div>
        </div>

      </div>
    </div>
  );
}
