import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/emailVerification.css";

type Status = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/auth/email/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setMessage(data.message || "Email verified successfully!");
          setStatus("success");
        } else {
          setMessage(data.message || "Invalid or expired verification token.");
          setStatus("error");
        }
      })
      .catch(() => {
        setMessage("Cannot connect to server. Please try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="ev-page">
      <div className="ev-card ev-card--centered">
        {status === "verifying" && (
          <>
            <span className="ev-spinner ev-spinner--lg" />
            <h1 className="ev-title">Verifying your email…</h1>
            <p className="ev-subtitle">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="ev-result-icon ev-result-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={40} height={40}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="ev-title">Email verified!</h1>
            <p className="ev-subtitle">{message}</p>
            <Link to="/" className="ev-btn ev-btn--primary">Go to Home</Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="ev-result-icon ev-result-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={40} height={40}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="ev-title">Verification failed</h1>
            <p className="ev-subtitle">{message}</p>
            <Link to="/PageLogin" className="ev-btn ev-btn--primary">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
