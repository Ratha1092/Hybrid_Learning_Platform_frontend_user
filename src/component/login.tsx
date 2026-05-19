import { useState, type ChangeEvent } from "react";

import "../css/login.css";
import { Link } from "react-router-dom";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

type Status = "idle" | "loading" | "success" | "error";

// Icons
const IconMail = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconCheck = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconAlert = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSpinner = () => (
  <svg
    className="login-spinner"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CLASSROOM_IMAGE =
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=520&q=80";

export default function Login() {





  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): LoginErrors => {
    const e: LoginErrors = {};

    if (!form.email.trim()) {
      e.email = "Email is required.";
    }

    if (!form.password) {
      e.password = "Password is required.";
    }

    return e;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = async () => {
   
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("loading");
    setServerMessage("");

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json(); console.log(data);

      if (res.ok) {
        setStatus("success");

        setServerMessage(
          data.message || "Login successful!"
        );

              if (data.data?.token) {
              localStorage.setItem(
                "token",
                data.data.token
              );

              window.dispatchEvent(
                new Event("tokenChanged")
              );
                setTimeout(() => {
                  window.location.href = "/";
                }, 1000);
            }
      } else {
        setStatus("error");

        if (data.errors) {
          const apiErrors: LoginErrors = {};

          Object.keys(data.errors).forEach((key) => {
            (apiErrors as Record<string, string>)[key] =
              Array.isArray(data.errors[key])
                ? data.errors[key][0]
                : data.errors[key];
          });

          setErrors(apiErrors);
        }

        setServerMessage(
          data.message || "Login failed."
        );
      }
    } catch {
      setStatus("error");
      setServerMessage(
        "Cannot connect to server."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Left Image */}
        <div className="login-image-wrap">
          <img src={CLASSROOM_IMAGE} alt="Classroom" />
        </div>

        {/* Right Form */}
        <div className="login-form-panel">
          <h1 className="login-title">
            Welcome Back
          </h1>

          {/* Success */}
          {status === "success" && (
            <div className="login-alert login-alert--success">
              <IconCheck />
              {serverMessage}
            </div>
          )}

          {/* Error */}
          {status === "error" && serverMessage && (
            <div className="login-alert login-alert--error">
              <IconAlert />
              {serverMessage}
            </div>
          )}

          <div className="login-fields">

            {/* Email */}
            <div>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <IconMail />
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={handleChange}
                  className={`login-input${
                    errors.email
                      ? " login-input--error"
                      : ""
                  }`}
                />
              </div>

              {errors.email && (
                <p className="login-error-msg">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <IconLock />
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Password *"
                  value={form.password}
                  onChange={handleChange}
                  className={`login-input login-input--with-toggle${
                    errors.password
                      ? " login-input--error"
                      : ""
                  }`}
                />

                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                >
                  {showPassword ? (
                    <IconEyeOff />
                  ) : (
                    <IconEye />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="login-error-msg">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            className="login-submit"
            onClick={handleSubmit}
            
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <IconSpinner />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* Footer */}
          <p className="login-footer">
            Don't have an account?{" "}
            <Link to="/PageRegister">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}