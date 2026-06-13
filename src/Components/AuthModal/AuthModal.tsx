import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthModal } from "../../context/AuthModalContext";
import Login from "../../Pages/Auth/Login/Login";
import Register from "../../Pages/Auth/Register/Register";
import "./AuthModal.css";

export default function AuthModal() {
  const { modal, close } = useAuthModal();
  const location = useLocation();

  // close when the user navigates (after successful login/register)
  useEffect(() => {
    close();
  }, [location.pathname]);

  // lock scroll + Escape key
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modal, close]);

  if (!modal) return null;

  return (
    <div
      className="auth-backdrop"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="auth-modal-wrap">
        <button className="auth-close" onClick={close} aria-label="Close">✕</button>
        {modal === "login" ? <Login /> : <Register />}
      </div>
    </div>
  );
}
