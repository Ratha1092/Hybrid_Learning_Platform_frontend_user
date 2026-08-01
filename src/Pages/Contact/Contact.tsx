import { useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, ChevronDown, MessageSquare, Headphones, BookOpen } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/axios";
import "./Contact.css";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INIT: FormState = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const { settings } = useSettings();
  const { t } = useLanguage();

  const FAQS = [
    { q: t("contact.faq1q"), a: t("contact.faq1a") },
    { q: t("contact.faq2q"), a: t("contact.faq2a") },
    { q: t("contact.faq3q"), a: t("contact.faq3a") },
    { q: t("contact.faq4q"), a: t("contact.faq4a") },
    { q: t("contact.faq5q"), a: t("contact.faq5a") },
  ];
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const phone    = settings.support_phone   || "+855 12 345 678";
  const email    = settings.support_email   || "hello@digitallearning.com";
  const address  = settings.contact_address || "8 Charter Street, Bldg 1295, Natalie Tower, Phnom Penh";
  const hoursWd  = settings.hours_weekday   || "8:00 am – 6:00 pm";
  const hoursSat = settings.hours_saturday  || "9:00 am – 1:00 pm";
  const hoursSun = settings.hours_sunday    || "Closed";

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim())    e.name    = t("contact.nameRequired");
    if (!form.email.trim())   e.email   = t("contact.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("contact.emailInvalid");
    if (!form.subject.trim()) e.subject = t("contact.subjectRequired");
    if (!form.message.trim()) e.message = t("contact.messageRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      await api.post("/contact", form);
      setSent(true);
      setForm(INIT);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setServerError(msg || t("contact.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  function field(key: keyof FormState, label: string, type = "text") {
    return (
      <div className={`ct-field ${errors[key] ? "ct-field--error" : ""}`}>
        <label className="ct-label" htmlFor={`ct-${key}`}>{label}</label>
        <input
          id={`ct-${key}`}
          type={type}
          value={form[key]}
          onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(ev => ({ ...ev, [key]: undefined })); }}
          className="ct-input"
          placeholder={label}
          autoComplete={key === "email" ? "email" : key === "name" ? "name" : "off"}
        />
        {errors[key] && <span className="ct-field-error">{errors[key]}</span>}
      </div>
    );
  }

  return (
    <>
      {/* ── Hero ── */}
      <div className="ct-hero">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <h1 className="ct-hero-title">{t("contact.heroTitle")}</h1>
          <p className="ct-hero-sub">
            {t("contact.heroSub")}
          </p>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="ct-cards-wrap">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="ct-cards">
            <div className="ct-card">
              <div className="ct-card-icon ct-card-icon--blue">
                <MapPin size={22} />
              </div>
              <h3 className="ct-card-title">{t("contact.locationTitle")}</h3>
              <p className="ct-card-text">{address}</p>
            </div>
            <div className="ct-card">
              <div className="ct-card-icon ct-card-icon--orange">
                <Phone size={22} />
              </div>
              <h3 className="ct-card-title">{t("contact.phoneTitle")}</h3>
              <p className="ct-card-text">
                <a href={`tel:${phone}`}>{phone}</a>
              </p>
              <p className="ct-card-note">{t("contact.phoneNote")}</p>
            </div>
            <div className="ct-card">
              <div className="ct-card-icon ct-card-icon--indigo">
                <Mail size={22} />
              </div>
              <h3 className="ct-card-title">{t("contact.emailTitle")}</h3>
              <p className="ct-card-text">
                <a href={`mailto:${email}`}>{email}</a>
              </p>
              <p className="ct-card-note">{t("contact.emailNote")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main: Form + Sidebar ── */}
      <section className="ct-main">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="ct-grid">

            {/* Form */}
            <div className="ct-form-col">
              <div className="ct-form-card">
                {sent ? (
                  <div className="ct-success">
                    <CheckCircle size={48} className="ct-success-icon" />
                    <h2 className="ct-success-title">{t("contact.messageSentTitle")}</h2>
                    <p className="ct-success-text">
                      {t("contact.messageSentText")}
                    </p>
                    <button className="ct-btn-reset" onClick={() => setSent(false)}>
                      {t("contact.sendAnother")}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="ct-form-title">{t("contact.formTitle")}</h2>
                    <p className="ct-form-sub">{t("contact.formSub")}</p>

                    <form className="ct-form" onSubmit={handleSubmit} noValidate>
                      <div className="ct-row">
                        {field("name", t("contact.yourName"))}
                        {field("email", t("contact.emailAddress"), "email")}
                      </div>
                      {field("subject", t("contact.subject"))}

                      <div className={`ct-field ${errors.message ? "ct-field--error" : ""}`}>
                        <label className="ct-label" htmlFor="ct-message">{t("contact.message")}</label>
                        <textarea
                          id="ct-message"
                          value={form.message}
                          onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(ev => ({ ...ev, message: undefined })); }}
                          className="ct-textarea"
                          placeholder={t("contact.messagePlaceholder")}
                          rows={5}
                        />
                        {errors.message && <span className="ct-field-error">{errors.message}</span>}
                      </div>

                      {serverError && <p className="ct-server-error">{serverError}</p>}

                      <button type="submit" className="ct-submit" disabled={submitting}>
                        {submitting ? (
                          <><span className="ct-spinner" /> {t("contact.sending")}</>
                        ) : (
                          <><Send size={16} /> {t("contact.sendMessage")}</>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="ct-side-col">
              <div className="ct-side-card ct-side-card--hours">
                <div className="ct-side-icon"><Clock size={20} /></div>
                <h3 className="ct-side-title">{t("contact.businessHours")}</h3>
                <ul className="ct-hours">
                  <li><span>{t("contact.mondayFriday")}</span><span>{hoursWd}</span></li>
                  <li><span>{t("contact.saturday")}</span><span>{hoursSat}</span></li>
                  <li>
                    <span>{t("contact.sunday")}</span>
                    <span className={hoursSun.toLowerCase() === "closed" ? "ct-closed" : ""}>{hoursSun}</span>
                  </li>
                </ul>
              </div>

              <div className="ct-side-card ct-side-card--support">
                <div className="ct-side-icon ct-side-icon--orange"><Headphones size={20} /></div>
                <h3 className="ct-side-title">{t("contact.supportChannels")}</h3>
                <ul className="ct-support-list">
                  <li>
                    <MessageSquare size={15} />
                    <span>{t("contact.liveChat")}</span>
                  </li>
                  <li>
                    <Mail size={15} />
                    <a href={`mailto:${email}`}>{t("contact.emailSupport")}</a>
                  </li>
                  <li>
                    <BookOpen size={15} />
                    <a href="/courses">{t("contact.browseHelpCenter")}</a>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ct-faq-section">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="ct-faq-header">
            <h2 className="ct-faq-title">{t("contact.faqTitle")}</h2>
            <p className="ct-faq-sub">{t("contact.faqSubBefore")} <a href={`mailto:${email}`}>{t("contact.emailUs")}</a>.</p>
          </div>
          <div className="ct-faq-list">
            {FAQS.map((item, i) => (
              <details key={i} className="ct-faq-item">
                <summary className="ct-faq-q">
                  {item.q}
                  <ChevronDown size={18} className="ct-faq-chevron" />
                </summary>
                <p className="ct-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
