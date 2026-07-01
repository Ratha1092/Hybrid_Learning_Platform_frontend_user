import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { profileService } from "../../../services/profileService";
import { billingService, type BillingAddress, type BillingAddressInput } from "../../../services/billingService";
import ProfileLayout from "./ProfileLayout";
import "./StudentProfileEdit.css";

const PRESET_INTERESTS = [
  "Web Development", "UI/UX Design", "Data Science", "Mobile Development",
  "Business", "Marketing", "AI & Machine Learning", "DevOps",
  "Personal Growth", "Photography", "Creative Writing", "Finance",
];

const EMPTY_ADDRESS_FORM: BillingAddressInput = {
  name: "", address_line_1: "", address_line_2: "", city: "", country: "", tax_id: "",
};

interface FormState {
  name: string;
  phone: string;
  bio: string;
  learning_goals: string;
  interests: string[];
  github: string;
  linkedin: string;
}

function formEqual(a: FormState, b: FormState) {
  return a.name === b.name && a.phone === b.phone && a.bio === b.bio &&
    a.learning_goals === b.learning_goals && a.github === b.github && a.linkedin === b.linkedin &&
    a.interests.length === b.interests.length && a.interests.every((v, i) => v === b.interests[i]);
}

export default function StudentProfileEdit() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: "", phone: "", bio: "", learning_goals: "", interests: [], github: "", linkedin: "",
  });
  const initialForm = useRef<FormState>(form);
  const isDirty = !formEqual(form, initialForm.current);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Billing address state
  const [addresses, setAddresses] = useState<BillingAddress[]>([]);
  const [addressForm, setAddressForm] = useState<BillingAddressInput | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/"); return; }
    profileService.getDashboard()
      .then(({ data }) => {
        const p = data.data.profile;
        const loaded: FormState = {
          name: p.name ?? user?.name ?? "",
          phone: p.phone ?? "",
          bio: p.bio ?? "",
          learning_goals: p.learning_goals ?? "",
          interests: p.interests ?? [],
          github: p.github ?? "",
          linkedin: p.linkedin ?? "",
        };
        setForm(loaded);
        initialForm.current = loaded;
        setAddresses(data.data.addresses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setAvatarError("File must be under 3 MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setAvatarError("Only JPG, PNG or WebP allowed."); return; }
    setAvatarError("");
    // Optimistic preview
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    try {
      const { data } = await profileService.uploadAvatar(file);
      updateUser({ avatar_url: data.data.avatar_url });
    } catch {
      setAvatarError("Upload failed — avatar endpoint may not be active yet.");
      setAvatarPreview(null);
    }
    setAvatarUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null);
    setAvatarError("");
    try {
      await profileService.removeAvatar();
      updateUser({ avatar_url: undefined });
    } catch {
      // silent if endpoint not ready
    }
  };

  const toggleInterest = (chip: string) => {
    setForm(prev => {
      const has = prev.interests.includes(chip);
      return { ...prev, interests: has ? prev.interests.filter(i => i !== chip) : [...prev.interests, chip] };
    });
  };

  const allChips = [
    ...PRESET_INTERESTS,
    ...form.interests.filter(i => !PRESET_INTERESTS.includes(i)),
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await profileService.update(form);
      const uid = res.data?.data?.id ?? user?.id;
      if (uid) {
        localStorage.setItem(`profile_extra_${uid}`, JSON.stringify({
          bio: form.bio,
          learning_goals: form.learning_goals,
          interests: form.interests,
          github: form.github,
          linkedin: form.linkedin,
        }));
      }
      updateUser({ name: form.name });
      initialForm.current = { ...form };
      setForm(f => ({ ...f })); // force re-render to clear dirty
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(" ") : e.response?.data?.message ?? "Failed to save.");
    }
    setSaving(false);
  };

  const handleDiscard = () => {
    setForm({ ...initialForm.current });
  };

  // ── Billing address handlers ──
  const openAddAddress = () => { setEditingAddressId(null); setAddressForm({ ...EMPTY_ADDRESS_FORM }); setAddressError(""); };
  const openEditAddress = (addr: BillingAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({ name: addr.name, address_line_1: addr.address_line_1, address_line_2: addr.address_line_2 ?? "", city: addr.city, country: addr.country, tax_id: addr.tax_id ?? "" });
    setAddressError("");
  };
  const cancelAddressForm = () => { setAddressForm(null); setEditingAddressId(null); setAddressError(""); };
  const handleAddressFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => prev ? { ...prev, [name]: value } : prev);
  };
  const handleSaveAddress = async () => {
    if (!addressForm) return;
    const { name, address_line_1, city, country } = addressForm;
    if (!name.trim() || !address_line_1.trim() || !city.trim() || !country.trim()) {
      setAddressError("Name, Address, City, and Country are required."); return;
    }
    setAddressSaving(true); setAddressError("");
    try {
      if (editingAddressId !== null) await billingService.updateAddress(editingAddressId, addressForm);
      else await billingService.createAddress(addressForm);
      const { data } = await billingService.getAddresses();
      setAddresses(data.data ?? []);
      cancelAddressForm();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAddressError(e.response?.data?.message ?? "Failed to save address.");
    }
    setAddressSaving(false);
  };
  const handleSetDefault = async (id: number) => {
    try {
      await billingService.setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    } catch { /* silent */ }
  };
  const handleDeleteAddress = async (id: number) => {
    setDeletingAddressId(id);
    try {
      await billingService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch { /* silent */ }
    setDeletingAddressId(null);
    setConfirmDeleteId(null);
  };

  if (loading) {
    return (
      <ProfileLayout activeLabel="Profile">
        <div className="pe-loading">
          <div className="pe-spinner" />
          <p>Loading profile…</p>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout activeLabel="Profile">
      <div className="pe-root">

        {/* ── Header ── */}
        <div className="pe-head">
          <p className="pe-bc">PROFILE</p>
          <h1 className="pe-title">Edit profile</h1>
          <p className="pe-sub">Manage your public info and account details.</p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="pe-cols">

          {/* ── Left: Avatar card ── */}
          <aside className="pe-aside card">
            <div className="pe-av-block">
              <div className="pe-av">
                {avatarPreview || user?.avatar_url ? (
                  <img src={avatarPreview ?? user!.avatar_url!} alt={form.name} />
                ) : (
                  <span>{(form.name || user?.name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleAvatarFileChange}
              />
              <div className="pe-av-actions">
                <button
                  className="pe-av-btn"
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUploading ? "Uploading…" : "Upload new"}
                </button>
                <button
                  className="pe-av-btn pe-av-btn--remove"
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={!avatarPreview && !user?.avatar_url}
                >
                  Remove
                </button>
              </div>
              {avatarError && <p className="pe-av-err">{avatarError}</p>}
              <p className="pe-av-hint">JPG or PNG · up to 3 MB</p>
            </div>

            <div className="pe-acct">
              <div className="pe-acct-row">
                <span className="pe-acct-label">ROLE</span>
                <span className="pe-chip pe-chip--gold">STUDENT</span>
              </div>
              <div className="pe-acct-row">
                <span className="pe-acct-label">STATUS</span>
                <span className="pe-chip pe-chip--pine">ACTIVE</span>
              </div>
              {user?.created_at && (
                <div className="pe-acct-row">
                  <span className="pe-acct-label">JOINED</span>
                  <span className="pe-acct-val">
                    {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
              <div className="pe-acct-row">
                <span className="pe-acct-label">LAST SIGN-IN</span>
                <span className="pe-acct-val">
                  {user?.created_at
                    ? `Today, ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                    : "—"}
                </span>
              </div>
            </div>

            <p className="pe-aside-note">Role and status are managed by our website admin and you can't be changed here.</p>
          </aside>

          {/* ── Right: Form sections ── */}
          <div className="pe-form">

            {/* Public profile */}
            <section className="pe-sec card">
              <h3 className="pe-sec-title">Public profile</h3>
              <p className="pe-sec-sub">This is what other learners and instructors see.</p>

              <div className="pe-field">
                <label className="pe-label">Full name <span className="pe-req">*</span></label>
                <input className="pe-input" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
              </div>

              <div className="pe-field">
                <label className="pe-label">Bio</label>
                <p className="pe-field-hint">A short intro — what you're learning and why.</p>
                <textarea
                  className="pe-textarea"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell other learners a bit about yourself…"
                  rows={4}
                  maxLength={500}
                />
                <div className="pe-char-count">{form.bio.length} / 500</div>
              </div>

              <div className="pe-field">
                <label className="pe-label">Learning goals</label>
                <p className="pe-field-hint">What do you want to achieve? We'll use this to keep you on track.</p>
                <textarea
                  className="pe-textarea"
                  name="learning_goals"
                  value={form.learning_goals}
                  onChange={handleChange}
                  placeholder="e.g. Become job-ready in full-stack web development by December."
                  rows={3}
                />
              </div>

              <div className="pe-field">
                <label className="pe-label">Interests</label>
                <p className="pe-field-hint">Pick topics to personalize your recommendations.</p>
                <div className="pe-chips">
                  {allChips.map(chip => {
                    const selected = form.interests.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        className={`pe-chip-btn${selected ? " pe-chip-btn--on" : ""}`}
                        onClick={() => toggleInterest(chip)}
                      >
                        {chip}
                        {selected && <span className="pe-chip-x">×</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pe-field-row">
                <div className="pe-field">
                  <label className="pe-label">GitHub</label>
                  <div className="pe-prefix-wrap">
                    <span className="pe-prefix">github.com/</span>
                    <input
                      className="pe-input pe-input--prefix"
                      name="github"
                      value={form.github.replace(/^https?:\/\/github\.com\//i, "").replace(/^github\.com\//i, "")}
                      onChange={e => setForm(prev => ({ ...prev, github: e.target.value ? `https://github.com/${e.target.value}` : "" }))}
                      placeholder="username"
                    />
                  </div>
                </div>
                <div className="pe-field">
                  <label className="pe-label">LinkedIn</label>
                  <div className="pe-prefix-wrap">
                    <span className="pe-prefix">linkedin.com/in/</span>
                    <input
                      className="pe-input pe-input--prefix"
                      name="linkedin"
                      value={form.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/^linkedin\.com\/in\//i, "")}
                      onChange={e => setForm(prev => ({ ...prev, linkedin: e.target.value ? `https://linkedin.com/in/${e.target.value}` : "" }))}
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Contact & account */}
            <section className="pe-sec card">
              <h3 className="pe-sec-title">Contact &amp; account</h3>
              <p className="pe-sec-sub">Used for sign-in and important notifications.</p>

              <div className="pe-field">
                <label className="pe-label">Email address <span className="pe-req">*</span></label>
                <div className="pe-input-wrap">
                  <input className="pe-input pe-input--readonly" value={user?.email ?? ""} readOnly />
                  <span className="pe-verified-badge">VERIFIED</span>
                </div>
                <p className="pe-field-hint">Changing your email will require re-verification.</p>
              </div>

              <div className="pe-field">
                <label className="pe-label">Phone</label>
                <input className="pe-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+855 12 345 678" />
                <p className="pe-field-hint">Optional — for account recovery and SMS alerts.</p>
              </div>
            </section>

            {/* Security */}
            <section className="pe-sec card">
              <h3 className="pe-sec-title">Security</h3>
              <p className="pe-sec-sub">Keep your account safe.</p>

              <div className="pe-security-row">
                <div className="pe-security-info">
                  <span className="pe-security-name">Password</span>
                  <span className="pe-security-hint">Last changed 3 months ago.</span>
                </div>
                <button type="button" className="pe-security-btn">Change password</button>
              </div>

              <div className="pe-security-row">
                <div className="pe-security-info">
                  <span className="pe-security-name">Two-factor authentication</span>
                  <span className="pe-security-hint">Add a second step at sign-in with an authenticator app.</span>
                </div>
                <div className="pe-toggle">
                  <div className="pe-toggle-track">
                    <div className="pe-toggle-thumb" />
                  </div>
                </div>
              </div>
            </section>

            {/* Billing Addresses */}
            <section className="pe-sec card">
              <h3 className="pe-sec-title">Billing addresses</h3>
              <p className="pe-sec-sub">Used for invoices and receipts on your orders.</p>

              {addresses.length === 0 && !addressForm && (
                <p className="pe-addr-empty">No billing addresses saved yet.</p>
              )}

              {addresses.map(addr => (
                <div key={addr.id} className={`pe-addr-card${addr.is_default ? " pe-addr-card--default" : ""}`}>
                  <div className="pe-addr-top">
                    <span className="pe-addr-name">{addr.name}</span>
                    {addr.is_default && <span className="pe-addr-badge">DEFAULT</span>}
                  </div>
                  <p className="pe-addr-line">{addr.address_line_1}</p>
                  {addr.address_line_2 && <p className="pe-addr-line">{addr.address_line_2}</p>}
                  <p className="pe-addr-line">{addr.city}, {addr.country}</p>
                  {addr.tax_id && <p className="pe-addr-taxid">Tax ID: {addr.tax_id}</p>}

                  <div className="pe-addr-actions">
                    {!addr.is_default && (
                      <button type="button" className="pe-addr-btn pe-addr-btn--default" onClick={() => handleSetDefault(addr.id)}>Set default</button>
                    )}
                    <button type="button" className="pe-addr-btn" onClick={() => openEditAddress(addr)}>Edit</button>
                    {confirmDeleteId === addr.id ? (
                      <span className="pe-addr-confirm">
                        <span>Delete?</span>
                        <button type="button" className="pe-addr-btn pe-addr-btn--danger" onClick={() => handleDeleteAddress(addr.id)} disabled={deletingAddressId === addr.id}>
                          {deletingAddressId === addr.id ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button type="button" className="pe-addr-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <button type="button" className="pe-addr-btn pe-addr-btn--danger" onClick={() => setConfirmDeleteId(addr.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}

              {addressForm && (
                <div className="pe-addr-form">
                  <div className="pe-field">
                    <label className="pe-label">Full Name <span className="pe-req">*</span></label>
                    <input className="pe-input" name="name" value={addressForm.name} onChange={handleAddressFieldChange} placeholder="e.g. Torn Ratha" />
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Address Line 1 <span className="pe-req">*</span></label>
                    <input className="pe-input" name="address_line_1" value={addressForm.address_line_1} onChange={handleAddressFieldChange} placeholder="Street address" />
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Address Line 2</label>
                    <input className="pe-input" name="address_line_2" value={addressForm.address_line_2 ?? ""} onChange={handleAddressFieldChange} placeholder="Apt, floor, building (optional)" />
                  </div>
                  <div className="pe-field-row">
                    <div className="pe-field">
                      <label className="pe-label">City <span className="pe-req">*</span></label>
                      <input className="pe-input" name="city" value={addressForm.city} onChange={handleAddressFieldChange} placeholder="Phnom Penh" />
                    </div>
                    <div className="pe-field">
                      <label className="pe-label">Country <span className="pe-req">*</span></label>
                      <input className="pe-input" name="country" value={addressForm.country} onChange={handleAddressFieldChange} placeholder="Cambodia" />
                    </div>
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Tax ID</label>
                    <input className="pe-input" name="tax_id" value={addressForm.tax_id ?? ""} onChange={handleAddressFieldChange} placeholder="Optional — for business invoices" />
                  </div>
                  {addressError && <p className="pe-addr-err">⚠ {addressError}</p>}
                  <div className="pe-addr-form-actions">
                    <button type="button" className="pe-ghost-btn" onClick={cancelAddressForm}>Cancel</button>
                    <button type="button" className="pe-save-btn" onClick={handleSaveAddress} disabled={addressSaving}>
                      {addressSaving ? "Saving…" : editingAddressId ? "Update address" : "Save address"}
                    </button>
                  </div>
                </div>
              )}

              {!addressForm && (
                <button type="button" className="pe-addr-add-btn" onClick={openAddAddress}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add address
                </button>
              )}
            </section>

            {error && <p className="pe-error">⚠ {error}</p>}

          </div>
        </div>
      </div>

      {/* ── Fixed save bar ── */}
      <div className={`pe-savebar${isDirty ? " pe-savebar--show" : ""}`}>
        <span className="pe-savebar-msg">
          <span className="pe-savebar-dot" />
          You have unsaved changes
        </span>
        <div className="pe-savebar-actions">
          <button type="button" className="pe-ghost-btn" onClick={handleDiscard} disabled={saving}>Discard</button>
          <button type="button" className="pe-save-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

    </ProfileLayout>
  );
}
