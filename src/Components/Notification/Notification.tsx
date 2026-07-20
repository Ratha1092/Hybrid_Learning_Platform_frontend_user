import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  notificationService,
  type AppNotification,
} from "../../services/notificationService";
import { getEcho, disconnectEcho } from "../../utils/echo";
import "./Notification.css";

// Polling is kept as a silent fallback in case the WebSocket drops.
// 5 min is enough — real-time events handle the instant updates.
const POLL_INTERVAL = 5 * 60_000;

const TYPE_CONFIG: Record<string, { icon: string; accent: string }> = {
  instructor_approved: { icon: "🎉", accent: "#d97706" },
  instructor_rejected: { icon: "❌", accent: "#ef4444" },
  course_purchased:    { icon: "🛒", accent: "#10b981" },
  course_completed:    { icon: "🏆", accent: "#6366f1" },
  default:             { icon: "🔔", accent: "#3b82f6" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
}

export default function Notification() {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── REST fetch (initial load + fallback polling) ──────────────────────────
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

  // ── Pusher real-time subscription ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);

    channel.listen(".notification.received", (incoming: AppNotification) => {
      setNotifications((prev) => {
        // Deduplicate in case the fallback poll already added it.
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
      setUnreadCount((c) => c + 1);

      if (incoming.type === "instructor_approved") {
        refreshUser();
      }
    });

    return () => {
      echo.leave(`user.${user.id}`);
    };
  }, [isAuthenticated, user?.id]);

  // ── Disconnect Echo when the user logs out ────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectEcho();
    }
  }, [isAuthenticated]);

  // ── Close dropdown on outside click ──────────────────────────────────────
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
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
                <p>You're all caught up!</p>
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
                      style={{ background: `${cfg.accent}15`, color: cfg.accent }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="notif-item__body">
                      <p className="notif-item__title">{n.title}</p>
                      <p className="notif-item__msg">{n.message}</p>
                      <span className="notif-item__time">· {formatTime(n.created_at)}</span>
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
