import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";

type State = "loading" | "error";

export default function GitHubCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");

    const savedState = localStorage.getItem("github_oauth_state");
    localStorage.removeItem("github_oauth_state");

    if (!code) {
      setState("error");
      setErrorMsg("GitHub did not return an authorization code.");
      return;
    }

    if (!returnedState || returnedState !== savedState) {
      setState("error");
      setErrorMsg("Invalid state parameter — possible CSRF attack. Please try again.");
      return;
    }

    authService.csrf()
      .then(() => authService.githubOAuth(code))
      .then(({ data }) => {
        if (!data.success) {
          setState("error");
          setErrorMsg(data.message || "GitHub login failed.");
          return;
        }
        login(data.data.user);
        const from = localStorage.getItem("github_oauth_from");
        localStorage.removeItem("github_oauth_from");
        navigate(from || "/", { replace: true });
      })
      .catch((err: unknown) => {
        const e = err as { code?: string; response?: { data?: { message?: string } } };
        const msg = e.code === "ECONNABORTED"
          ? "GitHub sign-in timed out. Please try again."
          : e.response?.data?.message ?? "GitHub login failed. Please try again.";
        setState("error");
        setErrorMsg(msg);
      });
  }, []);

  if (state === "loading") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Nunito, Inter, system-ui, sans-serif" }}>
        <svg style={{ animation: "spin 0.8s linear infinite", width: 36, height: 36, color: "#2ec4b6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
        </svg>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Completing GitHub sign-in…</p>
        <button
          onClick={() => navigate("/")}
          style={{ marginTop: 8, background: "none", border: "none", color: "#94a3b8", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}
        >
          Taking too long? Return home
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Nunito, Inter, system-ui, sans-serif" }}>
      <div style={{ fontSize: 40 }}>⚠</div>
      <p style={{ color: "#dc2626", fontSize: 15, margin: 0, maxWidth: 360, textAlign: "center" }}>{errorMsg}</p>
      <button
        onClick={() => navigate("/")}
        style={{ marginTop: 8, padding: "10px 24px", background: "linear-gradient(135deg,#2ec4b6,#0ea5e9)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
      >
        Back to Login
      </button>
    </div>
  );
}
