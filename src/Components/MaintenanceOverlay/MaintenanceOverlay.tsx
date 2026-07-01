import { useEffect, useState } from "react";
import { MAINTENANCE_EVENT } from "../../api/axios";
import "./MaintenanceOverlay.css";

export default function MaintenanceOverlay() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onMaintenance = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail || "The platform is currently undergoing maintenance. Please check back shortly.");
    };
    window.addEventListener(MAINTENANCE_EVENT, onMaintenance);
    return () => window.removeEventListener(MAINTENANCE_EVENT, onMaintenance);
  }, []);

  if (!message) return null;

  return (
    <div className="maintenance-backdrop">
      <div className="maintenance-card">
        <div className="maintenance-icon">🛠</div>
        <h2 className="maintenance-title">Under Maintenance</h2>
        <p className="maintenance-message">{message}</p>
        <button className="maintenance-retry" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </div>
  );
}
