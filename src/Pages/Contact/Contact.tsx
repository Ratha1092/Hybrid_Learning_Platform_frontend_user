import { useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, ChevronDown, MessageSquare, Headphones, BookOpen } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import api from "../../api/axios";
import "./Contact.css";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INIT: FormState = { name: "", email: "", subject: "", message: "" };

const FAQS = [
  {
    q: "How do I enroll in a course?",
    a: "Browse the Courses page, click on any course you're interested in, and hit the Enroll button. If it's a paid course, you'll be guided through the payment flow.",
  },
  {
    q: "Can I get a refund if I'm not satisfied?",
    a: "Yes — we offer a 7-day money-back guarantee on all purchases. Reach out to our support team within 7 days of purchase and we'll process your refund.",
  },
  {
    q: "How do I become an instructor?",
    a: "Log in, then click \"Become an Instructor\" in the navbar. Fill out your application and our team will review it within 3–5 business days.",
  },
  {
    q: "Do courses expire after purchase?",
    a: "No — once you purchase a course it's yours for life, including any future updates the instructor adds.",
  },
  {
    q: "Is there a mobile app?",
    a: "We're currently web-first and fully responsive on all screen sizes. A dedicated mobile app is on our roadmap.",
  },
];

export default function Contact() {
  const { settings } = useSettings();
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
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
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
      setServerError(msg || "Something went wrong. Please try again or email us directly.");
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
          <h1 className="ct-hero-title">Get in Touch</h1>
          <p className="ct-hero-sub">
            Have a question, feedback, or just want to say hello? We'd love to hear from you.
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
              <h3 className="ct-card-title">Our Location</h3>
              <p className="ct-card-text">{address}</p>
            </div>
            <div className="ct-card">
              <div className="ct-card-icon ct-card-icon--orange">
                <Phone size={22} />
              </div>
              <h3 className="ct-card-title">Phone</h3>
              <p className="ct-card-text">
                <a href={`tel:${phone}`}>{phone}</a>
              </p>
              <p className="ct-card-note">Mon – Fri, 8 am – 6 pm</p>
            </div>
            <div className="ct-card">
              <div className="ct-card-icon ct-card-icon--indigo">
                <Mail size={22} />
              </div>
              <h3 className="ct-card-title">Email</h3>
              <p className="ct-card-text">
                <a href={`mailto:${email}`}>{email}</a>
              </p>
              <p className="ct-card-note">We reply within 24 hours</p>
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
                    <h2 className="ct-success-title">Message Sent!</h2>
                    <p className="ct-success-text">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button className="ct-btn-reset" onClick={() => setSent(false)}>
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="ct-form-title">Send us a message</h2>
                    <p className="ct-form-sub">Fill in the form and our team will be in touch shortly.</p>

                    <form className="ct-form" onSubmit={handleSubmit} noValidate>
                      <div className="ct-row">
                        {field("name", "Your name")}
                        {field("email", "Email address", "email")}
                      </div>
                      {field("subject", "Subject")}

                      <div className={`ct-field ${errors.message ? "ct-field--error" : ""}`}>
                        <label className="ct-label" htmlFor="ct-message">Message</label>
                        <textarea
                          id="ct-message"
                          value={form.message}
                          onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(ev => ({ ...ev, message: undefined })); }}
                          className="ct-textarea"
                          placeholder="Write your message here…"
                          rows={5}
                        />
                        {errors.message && <span className="ct-field-error">{errors.message}</span>}
                      </div>

                      {serverError && <p className="ct-server-error">{serverError}</p>}

                      <button type="submit" className="ct-submit" disabled={submitting}>
                        {submitting ? (
                          <><span className="ct-spinner" /> Sending…</>
                        ) : (
                          <><Send size={16} /> Send Message</>
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
                <h3 className="ct-side-title">Business Hours</h3>
                <ul className="ct-hours">
                  <li><span>Monday – Friday</span><span>{hoursWd}</span></li>
                  <li><span>Saturday</span><span>{hoursSat}</span></li>
                  <li>
                    <span>Sunday</span>
                    <span className={hoursSun.toLowerCase() === "closed" ? "ct-closed" : ""}>{hoursSun}</span>
                  </li>
                </ul>
              </div>

              <div className="ct-side-card ct-side-card--support">
                <div className="ct-side-icon ct-side-icon--blue"><Headphones size={20} /></div>
                <h3 className="ct-side-title">Support Channels</h3>
                <ul className="ct-support-list">
                  <li>
                    <MessageSquare size={15} />
                    <span>Live chat inside any course page</span>
                  </li>
                  <li>
                    <Mail size={15} />
                    <a href={`mailto:${email}`}>Email support</a>
                  </li>
                  <li>
                    <BookOpen size={15} />
                    <a href="/courses">Browse our help center</a>
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
            <h2 className="ct-faq-title">Frequently Asked Questions</h2>
            <p className="ct-faq-sub">Can't find what you're looking for? <a href={`mailto:${email}`}>Email us</a>.</p>
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
