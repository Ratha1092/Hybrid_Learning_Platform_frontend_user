import { useEffect, useState } from "react";
import { SUSPENDED_EVENT } from "../../api/axios";
import "./SuspendedOverlay.css";

export default function SuspendedOverlay() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onSuspended = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail || "Your account has been suspended. Please contact support.");
    };
    window.addEventListener(SUSPENDED_EVENT, onSuspended);
    return () => window.removeEventListener(SUSPENDED_EVENT, onSuspended);
  }, []);

  if (!message) return null;

  return (
    <div className="suspended-backdrop">
      <div className="suspended-card">
        <div className="suspended-icon">🚫</div>
        <h2 className="suspended-title">Account Suspended</h2>
        <p className="suspended-message">{message}</p>
        <button className="suspended-action" onClick={() => window.location.href = "/"}>
          Return to Homepage
        </button>
      </div>
    </div>
  );
}
