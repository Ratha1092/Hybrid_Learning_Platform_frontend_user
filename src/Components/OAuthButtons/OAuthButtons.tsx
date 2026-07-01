import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import "./OAuthButtons.css";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const GITHUB_CALLBACK_URL = `${window.location.origin}/auth/github/callback`;

function randomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface Props {
  onError?: (msg: string) => void;
  onSuccess?: () => void;
  from?: string;
}

// google.accounts.id.initialize() must run at most once per page load — calling it
// again every time OAuthButtons remounts (e.g. switching the Login/Register modal)
// triggers GSI's "called multiple times" warning and can point it at a stale callback.
let googleInitialized = false;

export default function OAuthButtons({ onError, onSuccess, from }: Props) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // The GSI callback below is registered once and reused across remounts, so it
  // must always act on the currently mounted instance's props/state rather than
  // a closure captured at the first mount.
  const latestRef = useRef({ onError, onSuccess, from, login, navigate, setGoogleLoading });
  latestRef.current = { onError, onSuccess, from, login, navigate, setGoogleLoading };

  // Initialise Google Identity Services once the SDK is ready
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const renderBtn = () => {
      if (typeof google === "undefined" || !googleBtnRef.current) return;

      if (!googleInitialized) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const { onError, onSuccess, from, login, navigate, setGoogleLoading } = latestRef.current;
            setGoogleLoading(true);
            try {
              const payload = JSON.parse(atob(response.credential.split(".")[1])) as {
                sub: string;
                email: string;
                name: string;
                picture?: string;
              };
              const { data } = await authService.googleOAuth({
                id_token: response.credential,
                provider_id: payload.sub,
                email: payload.email,
                name: payload.name,
                avatar: payload.picture ?? null,
              });
              if (!data.success) {
                onError?.(data.message || "Google sign-in failed.");
                return;
              }
              login(data.data.user, data.data.token);
              onSuccess?.();
              navigate(from ?? "/", { replace: true });
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
                "Google sign-in failed. Please try again.";
              onError?.(msg);
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        googleInitialized = true;
      }

      google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth || 320,
        text: "continue_with",
      });
    };

    // SDK may already be loaded or still loading
    if (typeof google !== "undefined") {
      renderBtn();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="accounts.google.com/gsi/client"]'
      );
      if (existing) {
        existing.addEventListener("load", renderBtn, { once: true });
      }
    }
  }, []);

  const handleGitHub = () => {
    const state = randomState();
    sessionStorage.setItem("github_oauth_state", state);
    if (from) sessionStorage.setItem("github_oauth_from", from);
    else sessionStorage.removeItem("github_oauth_from");
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_CALLBACK_URL,
      scope: "read:user,user:email",
      state,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  return (
    <div className="oauth-wrap">
      <div className="oauth-divider">
        <span className="oauth-divider__line" />
        <span className="oauth-divider__text">or continue with</span>
        <span className="oauth-divider__line" />
      </div>

      <div className="oauth-btns">
        {/* GitHub */}
        <button className="oauth-btn oauth-btn--github" onClick={handleGitHub} type="button">
          <svg className="oauth-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Continue with GitHub
        </button>

        {/* Google — rendered by GSI SDK into this div */}
        <div className="oauth-btn--google-wrap" ref={googleBtnRef}>
          {googleLoading && (
            <div className="oauth-btn oauth-btn--google-loading">
              <svg style={{ animation: "spin 0.8s linear infinite", width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
              </svg>
              Signing in…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
