import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { usePlatformStats } from "../../../hooks/usePlatformStats";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";
import "./Register.css";

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

type Step = "form" | "otp";
type Status = "idle" | "loading" | "success" | "error";

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function getStrength(pw: string): { level: number; label: string } {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak" };
  if (score === 2) return { level: 2, label: "Fair" };
  if (score === 3) return { level: 3, label: "Medium" };
  return { level: 4, label: "Strong" };
}

const OTP_LENGTH = 6;
const OTP_TTL = 300; // 5 minutes in seconds

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const stats = usePlatformStats();

  // Step state
  const [step, setStep] = useState<Step>("form");

  // Form step state
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sendStatus, setSendStatus] = useState<Status>("idle");

  // OTP step state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpStatus, setOtpStatus] = useState<Status>("idle");
  const [otpError, setOtpError] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_TTL);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittingRef = useRef(false);

  const strength = getStrength(form.password);
  const strengthColor = ["", "#ef4444", "#f59e0b", "#60a5fa", "#22c55e"][strength.level];

  // Countdown timer
  useEffect(() => {
    if (step !== "otp") return;
    setTimeLeft(OTP_TTL);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Form validation
  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(form.password)) e.password = "Password must contain at least one uppercase letter.";
    else if (!/[0-9]/.test(form.password)) e.password = "Password must contain at least one number.";
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = "Password must contain at least one symbol (e.g. @, #, !).";
    if (!form.password_confirmation) e.password_confirmation = "Please confirm your password.";
    else if (form.password !== form.password_confirmation) e.password_confirmation = "Passwords do not match.";
    return e;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Step 1: send OTP
  const handleSendOtp = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!agreed) { setErrors((e) => ({ ...e, name: undefined })); return; }

    setSendStatus("loading");
    try {
      await authService.sendOtp(form.email);
      setSendStatus("idle");
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch {
      setSendStatus("error");
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError("");
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...Array(OTP_LENGTH).fill("")];
    digits.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  // Step 2: verify OTP then register
  const handleVerify = async () => {
    if (submittingRef.current) return; // block double-submit
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setOtpError("Please enter the full 6-digit code."); return; }

    submittingRef.current = true;
    setOtpStatus("loading");
    setOtpError("");

    // 1. Verify OTP
    let otpData: { success: boolean; message: string; data?: { verified: boolean } };
    try {
      const res = await authService.verifyOtp(form.email, code);
      otpData = res.data;
      console.log("[OTP verify response]", otpData);
    } catch (err: unknown) {
      submittingRef.current = false;
      setOtpStatus("idle");
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "OTP verification failed. Please try again.";
      setOtpError(`[OTP] ${msg}`);
      return;
    }

    if (!otpData.success) {
      submittingRef.current = false;
      setOtpStatus("idle");
      setOtpError(`[OTP] ${otpData.message || "Verification failed."}`);
      return;
    }

    // 2. Register — pass otp_code so the backend knows email was verified
    try {
      const { data: regData } = await authService.register({ ...form, otp_code: code });
      console.log("[Register response]", regData);
      login(regData.data.user, regData.data.token);
      setOtpStatus("success");
      setTimeout(() => navigate("/"), 800);
    } catch (err: unknown) {
      setOtpStatus("idle");
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      console.error("[Register error]", errData);
      let msg = errData?.message ?? "Registration failed after verification.";
      if (errData?.errors) {
        const details = Object.entries(errData.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join(" | ");
        msg += ` — ${details}`;
      }
      setOtpError(`[Register] ${msg}`);
    } finally {
      submittingRef.current = false;
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setResendStatus("sending");
    try {
      await authService.sendOtp(form.email);
      setResendStatus("sent");
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setTimeLeft(OTP_TTL);
      setTimeout(() => { setResendStatus("idle"); }, 3000);
      otpRefs.current[0]?.focus();
    } catch {
      setResendStatus("idle");
    }
  };

  // Left panel content by step
  const leftContent = step === "form" ? (
    <>
      <div className="rg-tag">✦ Online Learning</div>
      <h2 className="rg-left-heading">join();<br />learn();<br />succeed();</h2>
      <p className="rg-left-desc">Join thousands of students and unlock premium courses on Hybrid Learning Platform.</p>
      <div className="rg-stats">
        <div><div className="rg-stat-num">{stats?.total_students ?? "—"}</div><div className="rg-stat-lbl">Students</div></div>
        <div><div className="rg-stat-num">{stats?.total_courses ?? "—"}</div><div className="rg-stat-lbl">Courses</div></div>
        <div><div className="rg-stat-num">{stats?.total_instructors ?? "—"}</div><div className="rg-stat-lbl">Instructors</div></div>
      </div>
    </>
  ) : (
    <>
      <div className="rg-tag">✦ One step left</div>
      <h2 className="rg-left-heading">verify();<br />confirm();<br />join();</h2>
      <p className="rg-left-desc">Enter the 6-digit code we sent to your email to confirm your identity before creating your account.</p>
      <div className="rg-otp-info">
        <div className="rg-otp-info__row">🔐 Code expires in {formatTime(timeLeft)}</div>
        <div className="rg-otp-info__row">📧 Sent to {form.email}</div>
        <div className="rg-otp-info__row">🔄 Single-use code</div>
      </div>
    </>
  );

  return (
    <div className="rg-page">
      <div className="rg-card">

        {/* Left panel */}
        <div className="rg-left">
          <div className="rg-left-bg">
            <div className="rg-circle rg-circle--1" />
            <div className="rg-circle rg-circle--2" />
            <div className="rg-dots" />
          </div>
          <div className="rg-brand">
            <div className="rg-brand__logo">HL</div>
            <div>
              <div className="rg-brand__name">Hybrid Learning</div>
              <div className="rg-brand__sub">Learning Platform</div>
            </div>
          </div>
          <div className="rg-left-content">{leftContent}</div>
          <p className="rg-left-footer">🛡 Secure · Free forever · No credit card</p>
        </div>

        {/* Right panel */}
        <div className="rg-right">

          {/* Step indicator */}
          <div className="rg-steps">
            <div className={`rg-step ${step === "form" ? "rg-step--active" : "rg-step--done"}`}>
              <span className="rg-step__dot">{step === "otp" ? "✓" : "1"}</span>
              <span>Your details</span>
            </div>
            <div className="rg-step__line" />
            <div className={`rg-step ${step === "otp" ? "rg-step--active" : ""}`}>
              <span className="rg-step__dot">2</span>
              <span>Verify email</span>
            </div>
          </div>

          {/* ══════════════ STEP 1 — FORM ══════════════ */}
          {step === "form" && (
            <>
              <h1 className="rg-title">Create account_</h1>
              <p className="rg-subtitle">Fill in your details — we'll send a code to verify your email</p>

              {sendStatus === "error" && (
                <div className="rg-alert rg-alert--error">⚠ Failed to send verification code. Please try again.</div>
              )}

              <div className="rg-field">
                <label className="rg-label">Full name</label>
                <div className={`rg-input-row ${errors.name ? "rg-input-row--err" : ""}`}>
                  <span className="rg-input-icon">👤</span>
                  <input name="name" type="text" placeholder="Your Full Name" value={form.name} onChange={handleChange} className="rg-input" />
                </div>
                {errors.name && <p className="rg-err-msg">{errors.name}</p>}
              </div>

              <div className="rg-field">
                <label className="rg-label">Email address</label>
                <div className={`rg-input-row ${errors.email ? "rg-input-row--err" : ""}`}>
                  <span className="rg-input-icon"><IconMail /></span>
                  <input name="email" type="email" placeholder="Your Email Address" value={form.email} onChange={handleChange} className="rg-input" />
                </div>
                {errors.email && <p className="rg-err-msg">{errors.email}</p>}
              </div>

              <div className="rg-field">
                <label className="rg-label">Password</label>
                <div className={`rg-input-row ${errors.password ? "rg-input-row--err" : ""}`}>
                  <span className="rg-input-icon"><IconLock /></span>
                  <input name="password" type={showPass ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={handleChange} className="rg-input" />
                  <button type="button" className="rg-eye" onClick={() => setShowPass((v) => !v)}>
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {form.password && (
                  <div className="rg-strength">
                    <div className="rg-strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rg-strength-bar" style={{ background: i <= strength.level ? strengthColor : undefined }} />
                      ))}
                    </div>
                    <span className="rg-strength-lbl" style={{ color: strengthColor }}>{strength.label}</span>
                  </div>
                )}
                <p className="rg-hint">Must include <strong>uppercase</strong>, <strong>number</strong>, and <strong>special character</strong>.</p>
                {errors.password && <p className="rg-err-msg">{errors.password}</p>}
              </div>

              <div className="rg-field">
                <label className="rg-label">Confirm password</label>
                <div className={`rg-input-row ${errors.password_confirmation ? "rg-input-row--err" : ""}`}>
                  <span className="rg-input-icon"><IconLock /></span>
                  <input name="password_confirmation" type={showConfirm ? "text" : "password"} placeholder="Repeat password" value={form.password_confirmation} onChange={handleChange} className="rg-input" />
                  <button type="button" className="rg-eye" onClick={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {errors.password_confirmation && <p className="rg-err-msg">{errors.password_confirmation}</p>}
              </div>

              <div className="rg-terms">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} id="terms" />
                <label htmlFor="terms">
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>

              <button className="rg-btn" onClick={handleSendOtp} disabled={sendStatus === "loading" || !agreed}>
                {sendStatus === "loading" ? <span className="rg-spinner" /> : "Send verification code →"}
              </button>

              <p className="rg-footer">Already have an account? <Link to="/PageLogin">Sign in</Link></p>
            </>
          )}

          {/* ══════════════ STEP 2 — OTP ══════════════ */}
          {step === "otp" && (
            <>
              <h1 className="rg-title">Check your email_</h1>
              <p className="rg-subtitle">
                We sent a 6-digit code to <strong>{form.email}</strong>
              </p>

              {otpStatus === "success" && (
                <div className="rg-alert rg-alert--success">✓ Email verified! Creating your account…</div>
              )}

              {/* OTP boxes */}
              <div className="rg-otp-boxes">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    className={`rg-otp-box ${digit ? "rg-otp-box--filled" : ""} ${otpError ? "rg-otp-box--err" : ""}`}
                    disabled={otpStatus === "loading" || otpStatus === "success"}
                  />
                ))}
              </div>

              {otpError && <p className="rg-err-msg" style={{ textAlign: "center", marginBottom: 8 }}>{otpError}</p>}

              {/* Timer */}
              <div className="rg-otp-timer">
                {timeLeft > 0 ? (
                  <span>Code expires in <strong>{formatTime(timeLeft)}</strong></span>
                ) : (
                  <span className="rg-otp-timer--expired">Code expired</span>
                )}
              </div>

              <button
                className="rg-btn"
                onClick={handleVerify}
                disabled={otpStatus === "loading" || otpStatus === "success" || otp.join("").length < OTP_LENGTH}
              >
                {otpStatus === "loading" ? <span className="rg-spinner" /> : "Verify & Create Account →"}
              </button>

              {/* Resend */}
              <div className="rg-otp-resend">
                {resendStatus === "sent" ? (
                  <span className="rg-otp-resend--ok">✓ New code sent!</span>
                ) : (
                  <button
                    className="rg-otp-resend__btn"
                    onClick={handleResend}
                    disabled={resendStatus === "sending"}
                  >
                    {resendStatus === "sending" ? "Sending…" : "Resend code"}
                  </button>
                )}
              </div>

              <button className="rg-back-btn" onClick={() => setStep("form")}>
                ← Back to form
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
