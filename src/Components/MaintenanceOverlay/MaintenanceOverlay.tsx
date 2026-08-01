import { useEffect, useState } from "react";
import { MAINTENANCE_EVENT } from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";
import "./MaintenanceOverlay.css";

export default function MaintenanceOverlay() {
  const [message, setMessage] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const onMaintenance = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail || t("maintenance.defaultMessage"));
    };
    window.addEventListener(MAINTENANCE_EVENT, onMaintenance);
    return () => window.removeEventListener(MAINTENANCE_EVENT, onMaintenance);
  }, [t]);

  if (!message) return null;

  return (
    <div className="maintenance-backdrop">
      <div className="maintenance-card">
        <div className="maintenance-icon">🛠</div>
        <h2 className="maintenance-title">{t("maintenance.title")}</h2>
        <p className="maintenance-message">{message}</p>
        <button className="maintenance-retry" onClick={() => window.location.reload()}>
          {t("maintenance.retry")}
        </button>
      </div>
    </div>
  );
}
