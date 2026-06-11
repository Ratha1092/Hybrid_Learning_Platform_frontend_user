import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  notificationService,
  type AppNotification,
} from "../../services/notificationService";
import "./Notification.css";

const POLL_INTERVAL = 30_000;

const TYPE_CONFIG: Record<string, { icon: string; accent: string }> = {
  instructor_approved: { icon: "🎉", accent: "#d97706" },
  instructor_rejected: { icon: "❌", accent: "#ef4444" },
  default:             { icon: "🔔", accent: "#3b82f6" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
}

export default function Notification() {
  const { isAuthenticated, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationService.getAll();
      const list = data.data.notifications.data;
      setNotifications(list);
      setUnreadCount(data.data.unread_count);
      if (list.some((n) => n.type === "instructor_approved")) {
        refreshUser();
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await notificationService.markRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notif-wrap" ref={dropdownRef}>
      <button className="notif-bell" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header__title">
              Notifications
              {unreadCount > 0 && (
                <span className="notif-header__count">{unreadCount}</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button className="notif-header__mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty__icon">🔔</span>
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = getConfig(n.type);
                return (
                  <div
                    key={n.id}
                    className={`notif-item${!n.read ? " notif-item--unread" : ""}`}
                    onClick={() => handleMarkRead(n)}
                  >
                    <div
                      className="notif-item__icon"
                      style={{ background: `${cfg.accent}18`, color: cfg.accent }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="notif-item__body">
                      <p className="notif-item__title">{n.title}</p>
                      <p className="notif-item__msg">{n.message}</p>
                      <span className="notif-item__time">{formatTime(n.created_at)}</span>
                    </div>
                    {!n.read && <div className="notif-item__dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
