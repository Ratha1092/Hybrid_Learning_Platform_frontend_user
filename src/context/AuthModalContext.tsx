import { createContext, useContext, useState } from "react";
import { useLocation } from "react-router-dom";

type ModalType = "login" | "register" | null;

interface AuthModalContextValue {
  modal: ModalType;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// Read by Login.tsx / Register.tsx after a successful sign-in to send the
// user back where they were, instead of always landing on "/".
const AUTH_REDIRECT_KEY = "authRedirectTo";

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);
  const location = useLocation();

  // Captured here rather than by each caller — every "Sign In" trigger
  // (navbar, enroll button, session-expired prompt, a protected route) then
  // gets this for free instead of a subset of them silently bouncing to home.
  const rememberCurrentLocation = () => {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, `${location.pathname}${location.search}`);
  };

  return (
    <AuthModalContext.Provider value={{
      modal,
      openLogin:    () => { rememberCurrentLocation(); setModal("login"); },
      openRegister: () => { rememberCurrentLocation(); setModal("register"); },
      close:        () => setModal(null),
    }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
