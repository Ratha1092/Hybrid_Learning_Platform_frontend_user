import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { instructorService } from "../../../services/instructorService";
import styles from "./InstructorRegister.module.css";

type QualificationType = "degree" | "certification" | "professional_experience";

interface FormData {
  bio: string;
  experience: string;
  qualification_type: QualificationType | "";
  institution: string;
  completion_year: string;
  portfolio_url: string;
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
  certificate_file?: string;
  identity_file?: string;
  general?: string;
}

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

    if (form.bio.trim().length < 20)
      newErrors.bio = "Bio must be at least 20 characters.";

    if (form.experience.trim().length < 10)
      newErrors.experience = "Please provide more experience details.";

    if (!form.qualification_type)
      newErrors.qualification_type = "Please select a qualification type.";

    if (!form.institution.trim())
      newErrors.institution = "Institution / Organization is required.";

    if (!form.completion_year || form.completion_year.length !== 4 || isNaN(Number(form.completion_year)))
      newErrors.completion_year = "Year must be 4 digits (e.g. 2020).";

    if (!form.certificate_file)
      newErrors.certificate_file = "Please upload your certificate.";

    if (!form.identity_file)
      newErrors.identity_file = "Please upload your identity document.";

    if (form.portfolio_url && !/^https?:\/\/.+/.test(form.portfolio_url))
      newErrors.portfolio_url = "Portfolio URL is invalid.";

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
      if (form.certificate_file) formData.append("certificate_file", form.certificate_file);
      if (form.identity_file) formData.append("identity_file", form.identity_file);

      await instructorService.apply(formData);
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: FormErrors } } }).response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ general: data?.message || "Something went wrong. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successWrapper}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2>Application Submitted!</h2>
          <p>Your application is under review by Admin.</p>
          <p className={styles.successSub}>
            We will notify you via Email: <strong>{user?.email}</strong>
          </p>
          <button className={styles.backBtn} onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <h1 className={styles.title}>Become an Instructor</h1>
          <p className={styles.subtitle}>
            Fill in the form below to apply as an instructor.
          </p>
        </div>

        {errors.general && (
          <div className={styles.alertError}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.grid}>

            {/* LEFT — Applicant */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Applicant Information</h2>

              <div className={styles.applicantInfo}>
                <div className={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={styles.userName}>{user?.name}</p>
                  <p className={styles.userEmail}>{user?.email}</p>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Bio <span className={styles.required}>*</span>
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about yourself (min. 20 characters)..."
                  className={`${styles.textarea} ${errors.bio ? styles.inputError : ""}`}
                />
                {errors.bio && <span className={styles.error}>{errors.bio}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Teaching Experience <span className={styles.required}>*</span>
                </label>
                <textarea
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe your teaching experience..."
                  className={`${styles.textarea} ${errors.experience ? styles.inputError : ""}`}
                />
                {errors.experience && <span className={styles.error}>{errors.experience}</span>}
              </div>
            </div>

            {/* RIGHT — Professional */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Professional Information</h2>

              <div className={styles.field}>
                <label className={styles.label}>
                  Qualification Type <span className={styles.required}>*</span>
                </label>
                <select
                  name="qualification_type"
                  value={form.qualification_type}
                  onChange={handleChange}
                  className={`${styles.select} ${errors.qualification_type ? styles.inputError : ""}`}
                >
                  <option value="">-- Select --</option>
                  <option value="degree">Degree</option>
                  <option value="certification">Certification</option>
                  <option value="professional_experience">Professional Experience</option>
                </select>
                {errors.qualification_type && <span className={styles.error}>{errors.qualification_type}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Institution / Organization <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  placeholder="e.g. University of Phnom Penh"
                  className={`${styles.input} ${errors.institution ? styles.inputError : ""}`}
                />
                {errors.institution && <span className={styles.error}>{errors.institution}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Completion Year <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="completion_year"
                  value={form.completion_year}
                  onChange={handleChange}
                  placeholder="e.g. 2020"
                  maxLength={4}
                  className={`${styles.input} ${errors.completion_year ? styles.inputError : ""}`}
                />
                {errors.completion_year && <span className={styles.error}>{errors.completion_year}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Portfolio URL</label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={form.portfolio_url}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  className={`${styles.input} ${errors.portfolio_url ? styles.inputError : ""}`}
                />
                {errors.portfolio_url && <span className={styles.error}>{errors.portfolio_url}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Certificate <span className={styles.required}>*</span>
                </label>
                <label className={`${styles.fileLabel} ${errors.certificate_file ? styles.inputError : ""}`}>
                  <input
                    type="file"
                    name="certificate_file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileIcon}>📄</span>
                  <span className={styles.fileText}>
                    {form.certificate_file ? form.certificate_file.name : "Select File (PDF, JPG, PNG)"}
                  </span>
                </label>
                {errors.certificate_file && <span className={styles.error}>{errors.certificate_file}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Identity Document <span className={styles.required}>*</span>
                </label>
                <label className={`${styles.fileLabel} ${errors.identity_file ? styles.inputError : ""}`}>
                  <input
                    type="file"
                    name="identity_file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileIcon}>🪪</span>
                  <span className={styles.fileText}>
                    {form.identity_file ? form.identity_file.name : "Select File (PDF, JPG, PNG)"}
                  </span>
                </label>
                {errors.identity_file && <span className={styles.error}>{errors.identity_file}</span>}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
