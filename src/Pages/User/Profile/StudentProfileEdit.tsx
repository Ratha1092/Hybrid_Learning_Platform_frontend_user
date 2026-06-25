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
    if (!isAuthenticated) { navigate("/"); return; }

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
      const res = await profileService.update(form);
      // Cache fields that backend may not persist for instructors (no student_profile)
      const uid = res.data?.data?.id ?? user?.id;
      if (uid) {
        const localKey = `profile_extra_${uid}`;
        localStorage.setItem(localKey, JSON.stringify({
          bio: form.bio,
          learning_goals: form.learning_goals,
          interests: form.interests,
          github: form.github,
          linkedin: form.linkedin,
        }));
      }
      updateUser({ name: form.name });
      setSuccess(true);
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      const msg = errs ? Object.values(errs).flat().join(" ") : e.response?.data?.message ?? "Failed to save. Please try again.";
      setError(msg);
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
