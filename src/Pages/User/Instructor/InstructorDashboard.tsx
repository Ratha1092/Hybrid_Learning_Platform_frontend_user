import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function InstructorDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/instructor/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>🎓 Instructor Dashboard</div>
        <h1 style={styles.title}>Welcome, {user?.name?.split(" ")[0]}!</h1>
        <p style={styles.subtitle}>You are now an Instructor on DRC Platform.</p>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "24px",
    padding: "48px 40px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  badge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: 700,
    padding: "6px 16px",
    borderRadius: "999px",
    marginBottom: "20px",
  },
  title: { fontSize: "28px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 10px" },
  subtitle: { fontSize: "15px", color: "#6b7280", margin: "0 0 32px" },
  logoutBtn: {
    padding: "11px 32px",
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
