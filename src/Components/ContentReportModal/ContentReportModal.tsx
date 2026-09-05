import { useState } from "react";
import { Flag, X } from "lucide-react";
import { contentReportService, type ReportableType } from "../../services/contentReportService";
import "./ContentReportModal.css";

interface Props {
  type: ReportableType;
  itemId: number;
  itemLabel: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const reasons = [
  "Inappropriate content",
  "Spam or misleading",
  "Copyright or ownership issue",
  "Other",
];

export default function ContentReportModal({ type, itemId, itemLabel, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await contentReportService.create({
        reportable_type: type,
        reportable_id: itemId,
        reason,
        details: details.trim() || undefined,
      });
      onSubmitted?.();
      onClose();
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      setError(response?.data?.message ?? "Could not submit the report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-report-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="content-report-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="content-report-title">
        <div className="content-report-modal__head">
          <div>
            <span className="content-report-modal__eyebrow"><Flag size={14} /> Report content</span>
            <h2 id="content-report-title">Report {itemLabel}</h2>
          </div>
          <button type="button" className="content-report-modal__close" onClick={onClose} aria-label="Close report dialog">
            <X size={18} />
          </button>
        </div>
        <label className="content-report-modal__label" htmlFor="content-report-reason">Reason</label>
        <select id="content-report-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
          {reasons.map((value) => <option key={value}>{value}</option>)}
        </select>
        <label className="content-report-modal__label" htmlFor="content-report-details">Details <span>Optional</span></label>
        <textarea
          id="content-report-details"
          rows={4}
          maxLength={2000}
          placeholder="Tell us what needs attention..."
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
        {error && <p className="content-report-modal__error">{error}</p>}
        <div className="content-report-modal__actions">
          <button type="button" className="content-report-modal__cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="content-report-modal__submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit report"}</button>
        </div>
      </form>
    </div>
  );
}
