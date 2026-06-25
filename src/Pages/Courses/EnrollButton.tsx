import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService, type PaymentData } from "../../services/paymentService";
import type { CourseDetail } from "../../services/courseService";
import { couponService, type CouponValidation } from "../../services/couponService";
import { orderService } from "../../services/orderService";

type Step = "idle" | "loading" | "review" | "qr" | "done" | "error";
type CouponStatus = "idle" | "checking" | "valid" | "invalid";
type ReceiptStatus = "idle" | "downloading" | "error";

const PENDING_ENROLL_KEY = "pendingEnrollCourseId";

interface OrderInfo {
  id: number;
  order_number: string;
  discount_amount?: number;
  final_amount?: number;
}

interface Props {
  course: CourseDetail;
}

export default function EnrollButton({ course }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState("");
  const [receiptStatus, setReceiptStatus] = useState<ReceiptStatus>("idle");
  const [receiptError, setReceiptError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isEnrolled = !!course.is_enrolled;
  const isExpired = !!course.access_expired;
  const hasActiveAccess = isEnrolled && !isExpired;

  // Resume an enrollment/renewal that was interrupted by a login/register redirect.
  useEffect(() => {
    if (hasActiveAccess) return;
    if (!localStorage.getItem("token")) return;
    if (sessionStorage.getItem(PENDING_ENROLL_KEY) !== String(course.id)) return;
    sessionStorage.removeItem(PENDING_ENROLL_KEY);
    handleEnroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveAccess, course.id]);

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

  const doCheckout = async (couponCode?: string) => {
    setStep("loading");
    setErrorMsg("");
    setCheckoutError("");
    try {
      const { data } = await paymentService.checkout(course.id, couponCode);
      if (!data.success) {
        const msg = data.message ?? "Failed to create order.";
        if (couponCode) { setCheckoutError(msg); setStep("review"); }
        else { setErrorMsg(msg); setStep("error"); }
        return;
      }

      setOrderInfo({
        id: data.data.id,
        order_number: data.data.order_number,
        discount_amount: data.data.discount_amount,
        final_amount: data.data.final_amount,
      });

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
      const msg = e.response?.data?.message ?? e.message ?? "Network error.";
      if (couponCode) { setCheckoutError(msg); setStep("review"); }
      else { setErrorMsg(msg); setStep("error"); }
    }
  };

  const handleEnroll = () => {
    if (!localStorage.getItem("token")) {
      sessionStorage.setItem(PENDING_ENROLL_KEY, String(course.id));
      navigate("/PageLogin", { state: { from: location.pathname } });
      return;
    }
    if (Number(course.price) === 0) {
      doCheckout();
      return;
    }
    setCheckoutError("");
    setStep("review");
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponStatus("checking");
    setCouponError("");
    try {
      const { data } = await couponService.validate(code, course.id);
      setCouponResult(data);
      setCouponStatus("valid");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setCouponResult(null);
      setCouponStatus("invalid");
      setCouponError(e.response?.data?.message ?? "Invalid or expired coupon.");
    }
  };

  const handleCouponInputChange = (value: string) => {
    setCouponInput(value);
    setCouponStatus("idle");
    setCouponResult(null);
    setCouponError("");
  };

  const handleContinueToPayment = () => {
    doCheckout(couponStatus === "valid" ? couponInput.trim() : undefined);
  };

  const handleDownloadReceipt = async () => {
    if (!orderInfo) return;
    setReceiptStatus("downloading");
    setReceiptError("");
    try {
      await orderService.downloadReceipt(orderInfo.id, orderInfo.order_number);
      setReceiptStatus("idle");
    } catch (err: unknown) {
      let msg = "Failed to download receipt.";
      const e = err as { response?: { data?: unknown }; message?: string };
      const data = e.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text()) as { message?: string };
          msg = parsed.message ?? msg;
        } catch {
          // keep default message
        }
      } else if (data && typeof data === "object" && "message" in data) {
        msg = (data as { message?: string }).message ?? msg;
      } else if (e.message) {
        msg = e.message;
      }
      setReceiptError(msg);
      setReceiptStatus("error");
    }
  };

  if (step === "done") {
    return (
      <div className="enroll-success">
        <div className="enroll-success__icon">🎉</div>
        <h3 className="enroll-success__title">Enrolled Successfully!</h3>
        <p className="enroll-success__sub">You can now access all course content.</p>
        {!!orderInfo?.discount_amount && (
          <p className="enroll-success__discount">
            You saved ${Number(orderInfo.discount_amount).toFixed(2)}!
          </p>
        )}
        <a href={`/learn/${course.slug}`} className="enroll-success__link">
          Start Learning →
        </a>
        {orderInfo && (
          <div className="enroll-success__receipt">
            <button
              className="enroll-success__receipt-btn"
              onClick={handleDownloadReceipt}
              disabled={receiptStatus === "downloading"}
            >
              {receiptStatus === "downloading" ? "Downloading..." : "Download Receipt"}
            </button>
            {receiptStatus === "error" && <p className="enroll-error">⚠ {receiptError}</p>}
          </div>
        )}
      </div>
    );
  }

  if (step === "review") {
    const price = Number(course.price);
    const total = couponStatus === "valid" && couponResult ? Number(couponResult.final_amount) : price;

    return (
      <div className="enroll-review">
        <h3 className="enroll-review__title">Review Order</h3>
        <div className="enroll-review__row">
          <span>Course price</span>
          <span>${price.toFixed(2)}</span>
        </div>
        {couponStatus === "valid" && couponResult && (
          <>
            <div className="enroll-review__row enroll-review__row--discount">
              <span>Discount ({couponResult.code})</span>
              <span>-${Number(couponResult.discount_amount).toFixed(2)}</span>
            </div>
            <div className="enroll-review__row enroll-review__row--total">
              <span>Total</span>
              <span>${Number(couponResult.final_amount).toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="enroll-review__coupon">
          <input
            type="text"
            placeholder="Coupon code"
            value={couponInput}
            onChange={(e) => handleCouponInputChange(e.target.value)}
            className="enroll-review__coupon-input"
            disabled={couponStatus === "checking"}
          />
          <button
            type="button"
            className="enroll-review__coupon-btn"
            onClick={handleApplyCoupon}
            disabled={!couponInput.trim() || couponStatus === "checking"}
          >
            {couponStatus === "checking" ? "Checking..." : "Apply"}
          </button>
        </div>
        {couponStatus === "valid" && <p className="enroll-review__coupon-ok">✓ Coupon applied</p>}
        {couponStatus === "invalid" && <p className="enroll-review__coupon-err">⚠ {couponError}</p>}

        {checkoutError && <div className="enroll-error">⚠ {checkoutError}</div>}

        <button className="detail-enroll-btn" onClick={handleContinueToPayment}>
          Continue to Payment — ${total.toFixed(2)}
        </button>
        <button className="enroll-qr__cancel" onClick={() => setStep("idle")}>
          Cancel
        </button>
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

  if (hasActiveAccess) {
    return (
      <div className="enroll-success">
        <div className="enroll-success__icon">✅</div>
        <h3 className="enroll-success__title">You're Enrolled!</h3>
        <p className="enroll-success__sub">You have access to all course content.</p>
        {course.access_expires_at && (
          <p className="enroll-success__expiry">
            Access expires on{" "}
            {new Date(course.access_expires_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
        <a href={`/learn/${course.slug}`} className="enroll-success__link">
          Continue Learning →
        </a>
      </div>
    );
  }

  if (isEnrolled && isExpired) {
    return (
      <div className="enroll-expired">
        <div className="enroll-expired__icon">⏳</div>
        <h3 className="enroll-expired__title">Access Expired</h3>
        <p className="enroll-expired__sub">Renew to keep learning and regain access to all course content.</p>
        <button
          className="detail-enroll-btn"
          onClick={handleEnroll}
          disabled={step === "loading"}
          style={step === "loading" ? { background: "#94a3b8", boxShadow: "none", cursor: "not-allowed" } : undefined}
        >
          {step === "loading" ? "Processing..." : `Renew Access — $${course.price}`}
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
        : `Buy Now — $${course.price}`}
    </button>
  );
}
