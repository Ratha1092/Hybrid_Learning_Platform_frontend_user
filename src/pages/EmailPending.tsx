import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../css/emailVerification.css";

export default function EmailPending() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "your inbox";

  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleResend = async () => {
    setResendStatus("sending");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/email/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        setResendStatus("sent");
      } else {
        setResendStatus("error");
      }
    } catch {
      setResendStatus("error");
    }
  };

  return (
    <div className="ev-page">
      <div className="ev-card">
        {/* Left panel */}
        <div className="ev-left">
          <div className="ev-left-bg">
            <div className="ev-circle ev-circle--1" />
            <div className="ev-circle ev-circle--2" />
            <div className="ev-dots" />
          </div>
          <div className="ev-brand">
            <div className="ev-brand__logo">HL</div>
            <div>
              <div className="ev-brand__name">Hybrid Learning</div>
              <div className="ev-brand__sub">Learning Platform</div>
            </div>
          </div>
          <div className="ev-left-content">
            <div className="ev-tag">✦ One step left</div>
            <h2 className="ev-left-heading">verify();<br />unlock();<br />learn();</h2>
            <p className="ev-left-desc">
              Verifying your email keeps your account secure and unlocks all platform features.
            </p>
          </div>
          <p className="ev-left-footer">🛡 Secure · Free forever · No credit card</p>
        </div>

        {/* Right panel */}
        <div className="ev-right">
          <div className="ev-icon-wrap">
            <svg className="ev-envelope" viewBox="0 0 64 64" fill="none">
              <rect x="4" y="12" width="56" height="40" rx="6" fill="#0ea5e9" opacity=".15" />
              <rect x="4" y="12" width="56" height="40" rx="6" stroke="#0ea5e9" strokeWidth="2.5" />
              <path d="M4 18l28 18 28-18" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="48" cy="20" r="8" fill="#22c55e" />
              <path d="M44.5 20l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="ev-title">Check your email</h1>
          <p className="ev-subtitle">
            We sent a verification link to <strong>{email}</strong>.
            <br />Click it to activate your account.
          </p>

          <div className="ev-steps">
            <div className="ev-step">
              <span className="ev-step__num">1</span>
              <span>Open the email from Hybrid Learning</span>
            </div>
            <div className="ev-step">
              <span className="ev-step__num">2</span>
              <span>Click the <strong>Verify Email</strong> button</span>
            </div>
            <div className="ev-step">
              <span className="ev-step__num">3</span>
              <span>You'll be redirected back and ready to learn</span>
            </div>
          </div>

          {resendStatus === "sent" && (
            <div className="ev-alert ev-alert--success">✓ Verification email resent successfully.</div>
          )}
          {resendStatus === "error" && (
            <div className="ev-alert ev-alert--error">⚠ Failed to resend. Please try again.</div>
          )}

          <button
            className="ev-btn ev-btn--outline"
            onClick={handleResend}
            disabled={resendStatus === "sending" || resendStatus === "sent"}
          >
            {resendStatus === "sending" ? <span className="ev-spinner" /> : "Resend verification email"}
          </button>

          <p className="ev-footer">
            Wrong account? <Link to="/PageLogin">Sign in with a different account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
