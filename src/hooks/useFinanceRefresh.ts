import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getEcho } from "../utils/echo";

const POLL_INTERVAL = 5 * 60_000;
export function useFinanceRefresh(onUpdate: () => void) {
  const { isAuthenticated, user } = useAuth();
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);
    const handler = (incoming: { type?: string }) => {
      if (incoming.type === "finance") onUpdateRef.current();
    };
    channel.listen(".notification.received", handler);

    const id = setInterval(() => onUpdateRef.current(), POLL_INTERVAL);

    return () => {
      channel.stopListening(".notification.received", handler);
      clearInterval(id);
    };
  }, [isAuthenticated, user?.id]);
}
