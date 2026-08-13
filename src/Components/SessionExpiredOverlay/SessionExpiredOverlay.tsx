import { useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT } from "../../api/axios";
import { useAuthModal } from "../../context/AuthModalContext";
import "./SessionExpiredOverlay.css";

export default function SessionExpiredOverlay() {
  const [visible, setVisible] = useState(false);
  const { openLogin } = useAuthModal();

  useEffect(() => {
    const onExpired = () => setVisible(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  if (!visible) return null;

  return (
    <div className="session-expired-backdrop">
      <div className="session-expired-card">
        <div className="session-expired-icon">⏱️</div>
        <h2 className="session-expired-title">Session Expired</h2>
        <p className="session-expired-message">
          You've been signed out for your security. Please log in again to continue.
        </p>
        <button
          className="session-expired-action"
          onClick={() => { setVisible(false); openLogin(); }}
        >
          Log In
        </button>
        <button
          className="session-expired-dismiss"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
