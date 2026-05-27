import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paymentService, type PaymentData } from "../../services/paymentService";
import type { CourseDetail } from "../../services/courseService";

type Step = "idle" | "loading" | "qr" | "verifying" | "done" | "error";

interface Props {
  course: CourseDetail;
}

export default function EnrollButton({ course }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (paymentId: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await paymentService.getStatus(paymentId);
        const status = data.data?.status;
        if (status === "paid") {
          stopPolling();
          setStep("done");
        } else if (status === "expired" || status === "failed") {
          stopPolling();
          setErrorMsg("Payment expired or failed.");
          setStep("error");
        }
      } catch {
        // keep polling
      }
    }, 5000);
  };

  const handleVerify = async (paymentId: number) => {
    stopPolling();
    setStep("verifying");
    try {
      const { data } = await paymentService.verify(paymentId);
      if (data.data?.status === "paid" || data.success) {
        setStep("done");
      } else {
        setErrorMsg(data.message ?? "Payment not confirmed yet.");
        setStep("qr");
        if (payment) startPolling(paymentId);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? "Verification failed.");
      setStep("qr");
      if (payment) startPolling(paymentId);
    }
  };

  const handleEnroll = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/PageLogin");
      return;
    }
    setStep("loading");
    setErrorMsg("");
    try {
      const { data } = await paymentService.checkout(course.id);
      if (!data.success) {
        setErrorMsg(data.message ?? "Failed to create order.");
        setStep("error");
        return;
      }
      const pay = data.data.payment;
      setPayment(pay);
      if (Number(course.price) === 0) {
        await handleVerify(pay.id);
      } else {
        setStep("qr");
        startPolling(pay.id);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? "Network error.");
      setStep("error");
    }
  };

  if (step === "done") {
    return (
      <div className="enroll-success">
        <div className="enroll-success__icon">🎉</div>
        <h3 className="enroll-success__title">Enrolled Successfully!</h3>
        <p className="enroll-success__sub">You can now access all course content.</p>
        <a href={`/learn/${course.slug}`} className="enroll-success__link">
          Start Learning →
        </a>
      </div>
    );
  }

  if (step === "qr" && payment) {
    const expiresIn = payment.expires_at
      ? Math.max(0, Math.floor((new Date(payment.expires_at).getTime() - Date.now()) / 60000))
      : null;

    return (
      <div className="enroll-qr">
        <h3 className="enroll-qr__title">Scan to Pay</h3>
        <p className="enroll-qr__meta">
          Amount: <strong>${Number(payment.amount).toFixed(2)}</strong>
          {expiresIn !== null && (
            <> · Expires in <strong>{expiresIn} min</strong></>
          )}
        </p>
        {payment.qr_code_image ? (
          <img
            src={`data:image/png;base64,${payment.qr_code_image}`}
            alt="Payment QR Code"
            className="enroll-qr__img"
          />
        ) : (
          <div className="enroll-qr__placeholder">QR loading...</div>
        )}
        <p className="enroll-qr__hint">Scan with Bakong / ABA / Wing app</p>
        <div className="enroll-qr__actions">
          <button
            className="detail-enroll-btn enroll-qr__confirm"
            onClick={() => handleVerify(payment.id)}
            disabled={step === "verifying"}
          >
            {step === "verifying" ? "Checking..." : "I've Paid ✓"}
          </button>
          <button
            className="enroll-qr__cancel"
            onClick={() => { stopPolling(); setStep("idle"); }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div>
        <div className="enroll-error">⚠ {errorMsg}</div>
        <button
          className="detail-enroll-btn"
          onClick={() => setStep("idle")}
          style={{ marginTop: 8 }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button
      className="detail-enroll-btn"
      onClick={handleEnroll}
      disabled={step === "loading"}
      style={step === "loading" ? { background: "#94a3b8", boxShadow: "none", cursor: "not-allowed" } : undefined}
    >
      {step === "loading"
        ? "Processing..."
        : Number(course.price) === 0
        ? "Enroll for Free"
        : `Enroll Now — $${course.price}`}
    </button>
  );
}
