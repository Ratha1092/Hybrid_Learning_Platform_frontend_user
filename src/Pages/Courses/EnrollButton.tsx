import { useEffect, useRef, useState } from "react";
import { paymentService, type PaymentData } from "../../services/paymentService";
import { courseService, type CourseDetail } from "../../services/courseService";
import { useAuthModal } from "../../context/AuthModalContext";

type Step = "idle" | "loading" | "qr" | "done" | "error";

interface Props {
  course: CourseDetail;
}

export default function EnrollButton({ course }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { openLogin } = useAuthModal();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCheckingEnrollment(false); return; }
    courseService.getEnrollmentStatus(course.id)
      .then(({ data }) => setIsEnrolled(data.data?.enrolled ?? false))
      .catch(() => {})
      .finally(() => setCheckingEnrollment(false));
  }, [course.id]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (paymentId: number, hasQr = false) => {
    stopPolling();
    // Poll fast (1s) until QR image arrives, then slow down to 4s
    const interval = hasQr ? 2000 : 1000;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await paymentService.getStatus(paymentId);
        if (!data.success) return;
        const pay = data.data;
        setPayment(pay);
        const isPaid = ["paid", "completed", "success"].includes(pay.status ?? "");
        if (isPaid) {
          stopPolling();
          setStep("done");
        } else if (pay.status === "expired" || pay.status === "failed" || (typeof pay.expires_in_seconds === "number" && pay.expires_in_seconds <= 0)) {
          stopPolling();
          setErrorMsg("Payment expired or failed.");
          setStep("error");
        } else if (!hasQr && pay.qr_code_image) {
          // QR just arrived — restart with slower interval
          startPolling(paymentId, true);
        }
      } catch {
        // keep polling
      }
    }, interval);
  };

  const handleCancel = async (paymentId: number) => {
    stopPolling();
    setCancelling(true);
    try {
      await paymentService.cancel(paymentId);
    } catch {
      // ignore — reset to idle regardless
    }
    setCancelling(false);
    setPayment(null);
    setStep("idle");
  };

  const handleVerify = async (paymentId: number) => {
    stopPolling();
    setVerifying(true);
    try {
      const { data } = await paymentService.verify(paymentId);
      if (data.data?.status === "paid") {
        setPayment(data.data);
        setStep("done");
      } else {
        setErrorMsg(data.message ?? "Payment not confirmed yet.");
        startPolling(paymentId);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? "Verification failed.");
      startPolling(paymentId);
    }
    setVerifying(false);
  };

  const handleEnroll = async () => {
    if (!localStorage.getItem("token")) {
      openLogin();
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

      // Free course → backend enrolled directly, status = "completed"
      if (data.data.status === "completed") {
        setStep("done");
        return;
      }

      const pay = data.data.payment;
      if (!pay) {
        setErrorMsg("Payment data missing.");
        setStep("error");
        return;
      }

      setPayment(pay);
      setStep("qr");
      startPolling(pay.id, !!pay.qr_code_image);
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
            src={payment.qr_code_image}
            alt="Payment QR Code"
            className="enroll-qr__img"
          />
        ) : (
          <div className="enroll-qr__placeholder">QR loading...</div>
        )}
        <p className="enroll-qr__hint">Scan with Bakong / ABA / Wing app</p>
        <div className="enroll-qr__actions">
          <button className ="detail-enroll-btn enroll-qr__confirm"onClick={() => handleVerify(payment.id)}disabled={verifying}>
            {verifying ? "Checking..." : "I've Paid ✓"}
          </button>
          <button className="enroll-qr__cancel" onClick={() => handleCancel(payment.id)} disabled={cancelling || verifying}>
            {cancelling ? "Cancelling..." : "Cancel"}
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

  if (checkingEnrollment) {
    return (
      <button className="detail-enroll-btn" disabled style={{ background: "#94a3b8", boxShadow: "none", cursor: "not-allowed" }}>
        Loading...
      </button>
    );
  }

  if (isEnrolled) {
    return (
      <div className="enroll-success">
        <div className="enroll-success__icon">✅</div>
        <h3 className="enroll-success__title">You're Enrolled!</h3>
        <p className="enroll-success__sub">You have access to all course content.</p>
        <a href={`/learn/${course.slug}`} className="enroll-success__link">
          Continue Learning →
        </a>
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
        : `Buy Now — $${course.price}`}
    </button>
  );
}
