import { createContext, useContext, useState } from "react";

type ModalType = "login" | "register" | null;

interface AuthModalContextValue {
  modal: ModalType;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);
  return (
    <AuthModalContext.Provider value={{
      modal,
      openLogin:    () => setModal("login"),
      openRegister: () => setModal("register"),
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
