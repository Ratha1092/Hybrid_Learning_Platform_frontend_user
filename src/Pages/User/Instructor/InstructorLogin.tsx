import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";
import "./InstructorLogin.css";

type Status = "idle" | "loading" | "error";

export default function InstructorLogin() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

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

        <div className="ilogin-badge">🎓 Instructor Portal</div>
        <h1 className="ilogin-title">Welcome, Instructor</h1>
        <p className="ilogin-subtitle">
          Your application has been approved.<br />
          Sign in to access your dashboard.
        </p>

        {error && <div className="ilogin-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="ilogin-form" noValidate>
          <div className="ilogin-field">
            <label className="ilogin-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="ilogin-input"
            />
          </div>

          <div className="ilogin-field">
            <label className="ilogin-label">Password</label>
            <div className="ilogin-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                className="ilogin-input"
              />
              <button
                type="button"
                className="ilogin-eye"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="ilogin-btn" disabled={status === "loading"}>
            {status === "loading" ? (
              <span className="ilogin-spinner" />
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        <p className="ilogin-back" onClick={() => navigate("/")}>
          ← Back to Home
        </p>
      </div>
    </div>
  );
}
