import { useState, type ChangeEvent } from "react";

import "../css/Register.css";
import { Link } from "react-router-dom";


interface FormState {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

type Status = "idle" | "loading" | "success" | "error";

// Inline SVG icons
const IconUser = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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
    className="register-spinner"
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

export default function Register() {


  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState<string>("");
  const [showPass, setShowPass] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};

    if (!form.name.trim()) {
      e.name = "Name is required.";
    }

    if (!form.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Invalid email format.";
    }

    if (!form.password) {
      e.password = "Password is required.";
    } else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }

    if (!form.password_confirmation) {
      e.password_confirmation = "Please confirm your password.";
    } else if (form.password !== form.password_confirmation) {
      e.password_confirmation = "Passwords do not match.";
    }

    return e;
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
        "http://127.0.0.1:8000/api/v1/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

     if (res.ok) {
  setStatus("success");

  setServerMessage(
    data.message || "Registration successful!"
  );

  // Save token if returned
  if (data.data?.token) {
    localStorage.setItem("token", data.data.token);
    window.dispatchEvent(new Event("tokenChanged"));
  }

  setForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  // Auto navigate
  setTimeout(() => {
                  window.location.href = "/";
  }, 1000);
} else {
        setStatus("error");

        if (data.errors) {
          const apiErrors: FormErrors = {};

          Object.keys(data.errors).forEach((key) => {
            (apiErrors as Record<string, string>)[key] =
              Array.isArray(data.errors[key])
                ? data.errors[key][0]
                : data.errors[key];
          });

          setErrors(apiErrors);
        }

        setServerMessage(
          data.message || "Registration failed."
        );
      }
    } catch {
      setStatus("error");
      setServerMessage(
        "Cannot connect to server. Please try again."
      );
    }
  };

  function handleChange(event: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="register-page">
      <div className="register-card">

        {/* Left Image */}
        <div className="register-image-wrap">
          <img src={CLASSROOM_IMAGE} alt="Classroom" />
        </div>

        {/* Right Form */}
        <div className="register-form-panel">
          <h1 className="register-title">
            Create Account
          </h1>

          {/* Success */}
          {status === "success" && (
            <div className="register-alert register-alert--success">
              <IconCheck />
              {serverMessage}
            </div>
          )}

          {/* Error */}
          {status === "error" && serverMessage && (
            <div className="register-alert register-alert--error">
              <IconAlert />
              {serverMessage}
            </div>
          )}

          <div className="register-fields">

            {/* Name */}
            <div>
              <div className="register-input-wrap">
                <span className="register-input-icon">
                  <IconUser />
                </span>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Full Name *"
                  value={form.name}
                 onChange={handleChange}
                  className={`register-input${
                    errors.name
                      ? " register-input--error"
                      : ""
                  }`}
                />
              </div>

              {errors.name && (
                <p className="register-error-msg">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="register-input-wrap">
                <span className="register-input-icon">
                  <IconMail />
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={handleChange}
                  className={`register-input${
                    errors.email
                      ? " register-input--error"
                      : ""
                  }`}
                />
              </div>

              {errors.email && (
                <p className="register-error-msg">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="register-input-wrap">
                <span className="register-input-icon">
                  <IconLock />
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Password *"
                  value={form.password}
                  onChange={handleChange}
                  className={`register-input register-input--with-toggle${
                    errors.password
                      ? " register-input--error"
                      : ""
                  }`}
                />

                <button
                  type="button"
                  className="register-eye-btn"
                  onClick={() =>
                    setShowPass((v) => !v)
                  }
                >
                  {showPass ? (
                    <IconEyeOff />
                  ) : (
                    <IconEye />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="register-error-msg">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="register-input-wrap">
                <span className="register-input-icon">
                  <IconLock />
                </span>

                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password *"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  className={`register-input register-input--with-toggle${
                    errors.password_confirmation
                      ? " register-input--error"
                      : ""
                  }`}
                />

                <button
                  type="button"
                  className="register-eye-btn"
                  onClick={() =>
                    setShowConfirm((v) => !v)
                  }
                >
                  {showConfirm ? (
                    <IconEyeOff />
                  ) : (
                    <IconEye />
                  )}
                </button>
              </div>

              {errors.password_confirmation && (
                <p className="register-error-msg">
                  {errors.password_confirmation}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            className="register-submit"
            onClick={handleSubmit}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <IconSpinner />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </button>

          {/* Footer */}
          <p className="register-footer">
            Already have an account?{" "}
            <Link to="/PageLogin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
