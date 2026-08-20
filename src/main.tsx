import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { SettingsProvider } from "./context/SettingsContext";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";
import "./css/index.css";
import "./css/profile-theme.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
