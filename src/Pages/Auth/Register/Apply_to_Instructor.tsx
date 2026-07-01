import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { instructorService } from "../../../services/instructorService";
import "./Apply_to_Instructor.css";

type QualificationType = "degree" | "certification" | "professional_experience";

interface FormData {
  bio: string;
  experience: string;
  qualification_type: QualificationType | "";
  institution: string;
  completion_year: string;
  portfolio_url: string;
  identity_id: string;
  certificate_file: File | null;
  identity_file: File | null;
}

interface FormErrors {
  bio?: string;
  experience?: string;
  qualification_type?: string;
  institution?: string;
  completion_year?: string;
  portfolio_url?: string;
  identity_id?: string;
  certificate_file?: string;
  identity_file?: string;
  general?: string;
}

const BENEFITS = [
  { icon: "🎓", title: "Teach thousands", desc: "Reach learners across Cambodia and beyond." },
  { icon: "💰", title: "Earn revenue", desc: "Get paid for every enrolled student." },
  { icon: "🌟", title: "Build your brand", desc: "Grow your reputation as a subject expert." },
];

export default function InstructorRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    bio: "",
    experience: "",
    qualification_type: "",
    institution: "",
    completion_year: "",
    portfolio_url: "",
    identity_id: "",
    certificate_file: null,
    identity_file: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (form.bio.trim().length < 20) newErrors.bio = "Bio must be at least 20 characters.";
    if (form.experience.trim().length < 10) newErrors.experience = "Please provide more experience details.";
    if (!form.qualification_type) newErrors.qualification_type = "Please select a qualification type.";
    if (!form.institution.trim()) newErrors.institution = "Institution / Organization is required.";
    if (!form.completion_year || form.completion_year.length !== 4 || isNaN(Number(form.completion_year)))
      newErrors.completion_year = "Year must be 4 digits (e.g. 2020).";
    if (!form.identity_id.trim()) newErrors.identity_id = "Identity ID is required.";
    if (!form.certificate_file) newErrors.certificate_file = "Please upload your certificate.";
    if (!form.identity_file) newErrors.identity_file = "Please upload your identity document.";
    if (form.portfolio_url && !/^https?:\/\/.+/.test(form.portfolio_url))
      newErrors.portfolio_url = "Portfolio URL must start with http:// or https://";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const formData = new FormData();
      formData.append("user_id", String(user?.id));
      formData.append("bio", form.bio);
      formData.append("experience", form.experience);
      formData.append("qualification_type", form.qualification_type);
      formData.append("institution", form.institution);
      formData.append("completion_year", form.completion_year);
      formData.append("portfolio_url", form.portfolio_url);
      formData.append("identity_id", form.identity_id);
      if (form.certificate_file) formData.append("certificate_file", form.certificate_file);
      if (form.identity_file) formData.append("identity_file", form.identity_file);
      await instructorService.apply(formData);
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: FormErrors } } }).response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="ai-success-page">
        <div className="ai-success-card">
          <div className="ai-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="ai-success-title">Application Submitted!</h2>
          <p className="ai-success-body">Our team will review your application and get back to you within 2–5 business days.</p>
          <p className="ai-success-email">We'll notify you at <strong>{user?.email}</strong></p>
          <div className="ai-success-actions">
            <button className="ai-btn ai-btn--primary" onClick={() => navigate("/")}>Back to Home</button>
            <button className="ai-btn ai-btn--ghost" onClick={() => navigate("/profile")}>My Profile</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-page">

      {/* ── Hero ── */}
      <div className="ai-hero">
        <div className="ai-hero-inner">
          <div className="ai-hero-text">
            <div className="ai-hero-eyebrow">INSTRUCTOR PROGRAM</div>
            <h1 className="ai-hero-title">Share Your Knowledge,<br />Inspire the World</h1>
            <p className="ai-hero-sub">Join our growing community of educators and help students build real-world skills.</p>
          </div>
          <div className="ai-hero-benefits">
            {BENEFITS.map(b => (
              <div key={b.title} className="ai-benefit">
                <span className="ai-benefit-icon">{b.icon}</span>
                <div>
                  <div className="ai-benefit-title">{b.title}</div>
                  <div className="ai-benefit-desc">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="ai-body">
        <div className="ai-container">

          {/* Applicant banner */}
          <div className="ai-applicant-banner">
            <div className="ai-applicant-avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.name} />
                : <span>{user?.name?.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="ai-applicant-info">
              <div className="ai-applicant-name">{user?.name}</div>
              <div className="ai-applicant-email">{user?.email}</div>
            </div>
            <span className="ai-applicant-role">Applying as Instructor</span>
          </div>

          {errors.general && (
            <div className="ai-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="ai-grid">

              {/* ── Left column ── */}
              <div className="ai-col">

                {/* Bio */}
                <div className="ai-card">
                  <div className="ai-card-head">
                    <div className="ai-card-icon ai-card-icon--teal">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="ai-card-title">About You</h2>
                      <p className="ai-card-sub">Tell us who you are and what you teach</p>
                    </div>
                  </div>

                  <div className="ai-field">
                    <label className="ai-label">Bio <span className="ai-req">*</span></label>
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us about yourself, your background, and why you want to teach..."
                      className={`ai-textarea${errors.bio ? " ai-field--err" : ""}`}
                    />
                    <div className="ai-field-foot">
                      {errors.bio
                        ? <span className="ai-err">{errors.bio}</span>
                        : <span className="ai-hint">Min. 20 characters</span>}
                      <span className="ai-char">{form.bio.length}</span>
                    </div>
                  </div>

                  <div className="ai-field">
                    <label className="ai-label">Teaching Experience <span className="ai-req">*</span></label>
                    <textarea
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe your teaching experience, courses taught, or workshops conducted..."
                      className={`ai-textarea${errors.experience ? " ai-field--err" : ""}`}
                    />
                    {errors.experience && <span className="ai-err">{errors.experience}</span>}
                  </div>
                </div>

              </div>

              {/* ── Right column ── */}
              <div className="ai-col">

                {/* Qualification */}
                <div className="ai-card">
                  <div className="ai-card-head">
                    <div className="ai-card-icon ai-card-icon--gold">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="ai-card-title">Qualification</h2>
                      <p className="ai-card-sub">Your academic or professional credentials</p>
                    </div>
                  </div>

                  <div className="ai-row">
                    <div className="ai-field">
                      <label className="ai-label">Qualification Type <span className="ai-req">*</span></label>
                      <select
                        name="qualification_type"
                        value={form.qualification_type}
                        onChange={handleChange}
                        className={`ai-select${errors.qualification_type ? " ai-field--err" : ""}`}
                      >
                        <option value="">Select type…</option>
                        <option value="degree">Degree</option>
                        <option value="certification">Certification</option>
                        <option value="professional_experience">Professional Experience</option>
                      </select>
                      {errors.qualification_type && <span className="ai-err">{errors.qualification_type}</span>}
                    </div>

                    <div className="ai-field ai-field--sm">
                      <label className="ai-label">Year <span className="ai-req">*</span></label>
                      <input
                        type="text"
                        name="completion_year"
                        value={form.completion_year}
                        onChange={handleChange}
                        placeholder="2020"
                        maxLength={4}
                        className={`ai-input${errors.completion_year ? " ai-field--err" : ""}`}
                      />
                      {errors.completion_year && <span className="ai-err">{errors.completion_year}</span>}
                    </div>
                  </div>

                  <div className="ai-field">
                    <label className="ai-label">Institution / Organization <span className="ai-req">*</span></label>
                    <input
                      type="text"
                      name="institution"
                      value={form.institution}
                      onChange={handleChange}
                      placeholder="e.g. Royal University of Phnom Penh"
                      className={`ai-input${errors.institution ? " ai-field--err" : ""}`}
                    />
                    {errors.institution && <span className="ai-err">{errors.institution}</span>}
                  </div>

                  <div className="ai-field">
                    <label className="ai-label">Portfolio URL <span className="ai-opt">(optional)</span></label>
                    <div className="ai-input-prefix-wrap">
                      <span className="ai-input-prefix">https://</span>
                      <input
                        type="url"
                        name="portfolio_url"
                        value={form.portfolio_url}
                        onChange={handleChange}
                        placeholder="yourportfolio.com"
                        className={`ai-input ai-input--prefixed${errors.portfolio_url ? " ai-field--err" : ""}`}
                      />
                    </div>
                    {errors.portfolio_url && <span className="ai-err">{errors.portfolio_url}</span>}
                  </div>
                </div>

                {/* Identity */}
                <div className="ai-card">
                  <div className="ai-card-head">
                    <div className="ai-card-icon ai-card-icon--pine">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="ai-card-title">Identity Verification</h2>
                      <p className="ai-card-sub">Required for account verification</p>
                    </div>
                  </div>

                  <div className="ai-field">
                    <label className="ai-label">National ID Number <span className="ai-req">*</span></label>
                    <input
                      type="text"
                      name="identity_id"
                      value={form.identity_id}
                      onChange={handleChange}
                      placeholder="e.g. 012345678"
                      className={`ai-input${errors.identity_id ? " ai-field--err" : ""}`}
                    />
                    {errors.identity_id && <span className="ai-err">{errors.identity_id}</span>}
                  </div>

                  <div className="ai-row">
                    <div className="ai-field">
                      <label className="ai-label">Certificate <span className="ai-req">*</span></label>
                      <label className={`ai-upload${errors.certificate_file ? " ai-upload--err" : ""}${form.certificate_file ? " ai-upload--filled" : ""}`}>
                        <input type="file" name="certificate_file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="ai-upload-input" />
                        <div className="ai-upload-body">
                          {form.certificate_file ? (
                            <>
                              <span className="ai-upload-done">✓</span>
                              <span className="ai-upload-name">{form.certificate_file.name}</span>
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                              </svg>
                              <span>Upload Certificate</span>
                              <span className="ai-upload-hint">PDF, JPG, PNG</span>
                            </>
                          )}
                        </div>
                      </label>
                      {errors.certificate_file && <span className="ai-err">{errors.certificate_file}</span>}
                    </div>

                    <div className="ai-field">
                      <label className="ai-label">Identity Card <span className="ai-req">*</span></label>
                      <label className={`ai-upload${errors.identity_file ? " ai-upload--err" : ""}${form.identity_file ? " ai-upload--filled" : ""}`}>
                        <input type="file" name="identity_file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="ai-upload-input" />
                        <div className="ai-upload-body">
                          {form.identity_file ? (
                            <>
                              <span className="ai-upload-done">✓</span>
                              <span className="ai-upload-name">{form.identity_file.name}</span>
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 10h20"/>
                              </svg>
                              <span>Upload ID Card</span>
                              <span className="ai-upload-hint">PDF, JPG, PNG</span>
                            </>
                          )}
                        </div>
                      </label>
                      {errors.identity_file && <span className="ai-err">{errors.identity_file}</span>}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Submit bar ── */}
            <div className="ai-submit-bar">
              <p className="ai-submit-note">By submitting, you agree to our Instructor Terms of Service.</p>
              <div className="ai-submit-actions">
                <button type="button" className="ai-btn ai-btn--ghost" onClick={() => navigate(-1)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="ai-btn ai-btn--primary" disabled={loading}>
                  {loading
                    ? <><span className="ai-spinner" /> Submitting…</>
                    : <>Submit Application →</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
