import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { profileService } from "../../../services/profileService";
import "./StudentProfileEdit.css";

export default function StudentProfileEdit() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
    learning_goals: "",
    interests: [] as string[],
    github: "",
    linkedin: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/PageLogin"); return; }

    profileService.get().then(({ data }) => {
      const p = data.data;
      setForm({
        name: user?.name ?? "",
        phone: (p as any).phone ?? "",
        bio: p.bio ?? "",
        learning_goals: p.learning_goals ?? "",
        interests: p.interests ?? [],
        github: p.github ?? "",
        linkedin: p.linkedin ?? "",
      });
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.interests.includes(tag)) {
      setForm(prev => ({ ...prev, interests: [...prev.interests, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, interests: prev.interests.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await profileService.update(form);
      updateUser({ name: form.name });
      setSuccess(true);
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Failed to save. Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="edit-state">
        <div className="edit-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="edit-page">
      <div className="edit-container">

        <div className="edit-header">
          <button className="edit-back" onClick={() => navigate("/profile")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div>
            <h1 className="edit-title">Edit Profile</h1>
            <p className="edit-subtitle">Update your personal information</p>
          </div>
        </div>

        <form className="edit-form" onSubmit={handleSubmit}>

          {/* ── Personal Information ── */}
          <div className="edit-section">
            <div className="edit-section-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Personal Information
            </div>

            <div className="edit-group">
              <label className="edit-label">Full Name</label>
              <input className="edit-input" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
            </div>

            <div className="edit-group">
              <label className="edit-label">Phone Number</label>
              <input className="edit-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+855 ..." />
            </div>
          </div>

          {/* ── About You ── */}
          <div className="edit-section">
            <div className="edit-section-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              About You
            </div>

            <div className="edit-group">
              <label className="edit-label">Bio</label>
              <textarea className="edit-textarea" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={4} />
            </div>

            <div className="edit-group">
              <label className="edit-label">Learning Goals</label>
              <textarea className="edit-textarea" name="learning_goals" value={form.learning_goals} onChange={handleChange} placeholder="What do you want to achieve?" rows={3} />
            </div>

            <div className="edit-group">
              <label className="edit-label">Interests</label>
              {form.interests.length > 0 && (
                <div className="edit-tags">
                  {form.interests.map(tag => (
                    <span key={tag} className="edit-tag">
                      {tag}
                      <button type="button" className="edit-tag__remove" onClick={() => removeTag(tag)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="edit-tag-row">
                <input
                  className="edit-input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Type interest then press Enter"
                />
                <button type="button" className="edit-tag-add" onClick={addTag}>Add</button>
              </div>
            </div>
          </div>

          {/* ── Social Links ── */}
          <div className="edit-section">
            <div className="edit-section-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Social Links
            </div>

            <div className="edit-group">
              <label className="edit-label">GitHub</label>
              <div className="edit-input-wrap">
                <span className="edit-input-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </span>
                <input className="edit-input edit-input--prefixed" name="github" value={form.github} onChange={handleChange} placeholder="https://github.com/username" />
              </div>
            </div>

            <div className="edit-group">
              <label className="edit-label">LinkedIn</label>
              <div className="edit-input-wrap">
                <span className="edit-input-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </span>
                <input className="edit-input edit-input--prefixed" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
              </div>
            </div>
          </div>

          {error && (
            <div className="edit-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="edit-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Profile saved! Redirecting...
            </div>
          )}

          <div className="edit-actions">
            <button type="button" className="edit-btn edit-btn--cancel" onClick={() => navigate("/profile")}>
              Cancel
            </button>
            <button type="submit" className="edit-btn edit-btn--save" disabled={saving}>
              {saving ? (
                <>
                  <span className="edit-btn-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
