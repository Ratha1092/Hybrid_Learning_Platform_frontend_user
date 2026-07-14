import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Trash2, ShieldCheck, CircleCheck, Plus,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { profileService } from "../../../services/profileService";
import { billingService, type BillingAddress, type BillingAddressInput } from "../../../services/billingService";
import ProfileLayout from "./ProfileLayout";

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

export function formEqual(a: FormState, b: FormState) {
  return a.name === b.name && a.phone === b.phone && a.bio === b.bio &&
    a.learning_goals === b.learning_goals && a.github === b.github && a.linkedin === b.linkedin &&
    a.interests.length === b.interests.length && a.interests.every((v, i) => v === b.interests[i]);
}

/* ── Local helper components ── */
function CardSection({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="font-display text-[17px] font-bold ink dark:text-slate-100">{title}</h3>
      <p className="mt-0.5 text-[13.5px] muted2 dark:text-slate-400">{sub}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <p className="mb-1.5 text-[13px] font-semibold ink dark:text-slate-200">
      {children}{req && <span className="ml-0.5 text-rose-500">*</span>}
    </p>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none placeholder:text-slate-400 " +
  "focus:border-blue-400 focus:ring-4 focus:ring-blue-100 " +
  "dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20";

/* ── Main export ── */
export function EditProfilePanel() {
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
  const [twoFA, setTwoFA] = useState(false);

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
        // Fallback to localStorage for fields the backend may not persist (interests, bio, etc.)
        const uid = user?.id;
        const local: Partial<FormState> = uid
          ? JSON.parse(localStorage.getItem(`profile_extra_${uid}`) ?? "{}")
          : {};
        const loaded: FormState = {
          name: p.name ?? user?.name ?? "",
          phone: p.phone ?? "",
          bio: p.bio ?? local.bio ?? "",
          learning_goals: p.learning_goals ?? local.learning_goals ?? "",
          interests: (p.interests?.length ? p.interests : null) ?? local.interests ?? [],
          github: p.github ?? local.github ?? "",
          linkedin: p.linkedin ?? local.linkedin ?? "",
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
    } catch { /* silent */ }
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
      setForm(f => ({ ...f }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(" ") : e.response?.data?.message ?? "Failed to save.");
    }
    setSaving(false);
  };

  const handleDiscard = () => { setForm({ ...initialForm.current }); };

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
      <div className="flex items-center gap-3 py-12 text-[14px] muted2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        Loading profile…
      </div>
    );
  }

  const displayName = form.name || user?.name || "?";
  const avatarSrc = avatarPreview ?? user?.avatar_url ?? null;
  const joinedStr = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";
  const lastSignIn = `Today, ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <>
      <div className="space-y-6 pb-24">

        {/* Header */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Profile</p>
          <h1 className="mt-1 font-display text-[30px] font-extrabold ink dark:text-slate-50 sm:text-[36px]">Edit profile</h1>
          <p className="mt-1 text-[15px] muted2 dark:text-slate-400">Manage your public info and account details.</p>
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* Left: Avatar card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-e1 lg:sticky lg:top-20 lg:self-start dark:border-slate-700 dark:bg-slate-800">
            {/* Avatar */}
            <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-2xl grad-blue text-3xl font-extrabold text-white shadow-glow">
              {avatarSrc
                ? <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
                : displayName.charAt(0).toUpperCase()}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-semibold ink hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Upload className="h-3.5 w-3.5" />
                {avatarUploading ? "Uploading…" : "Upload new"}
              </button>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={!avatarPreview && !user?.avatar_url}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
            {avatarError && <p className="mt-2 text-[12px] text-rose-500">{avatarError}</p>}
            <p className="mt-2 text-[12px] muted2 dark:text-slate-400">JPG or PNG · up to 3 MB</p>

            {/* Account info */}
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-left text-[13px] dark:border-slate-700">
              {([
                ["Role",        <span key="role" className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">Student</span>],
                ["Status",      <span key="status" className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Active</span>],
                ["Joined",      <span key="joined" className="font-semibold ink dark:text-slate-200">{joinedStr}</span>],
                ["Last sign-in",<span key="signin" className="font-semibold ink dark:text-slate-200">{lastSignIn}</span>],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
                  {value}
                </div>
              ))}
            </div>
            <p className="mt-4 text-left text-[12px] leading-relaxed muted2 dark:text-slate-400">
              Role and status are managed by our admin team and can't be changed here.
            </p>
          </div>

          {/* Right: Form sections */}
          <div className="space-y-6">

            {/* Public profile */}
            <CardSection title="Public profile" sub="This is what other learners and instructors see.">
              <label className="block">
                <FieldLabel req>Full name</FieldLabel>
                <input className={inputCls} name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
              </label>

              <label className="block">
                <FieldLabel>Bio</FieldLabel>
                <p className="mb-1.5 -mt-1 text-[12px] muted2 dark:text-slate-400">A short intro — what you're learning and why.</p>
                <textarea
                  className={inputCls + " resize-none"}
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell other learners a bit about yourself…"
                  rows={3}
                  maxLength={500}
                />
                <span className="mt-1 block text-right text-[11px] muted2 dark:text-slate-500">{form.bio.length} / 500</span>
              </label>

              <label className="block">
                <FieldLabel>Learning goals</FieldLabel>
                <p className="mb-1.5 -mt-1 text-[12px] muted2 dark:text-slate-400">What do you want to achieve? We'll use this to keep you on track.</p>
                <textarea
                  className={inputCls + " resize-none"}
                  name="learning_goals"
                  value={form.learning_goals}
                  onChange={handleChange}
                  placeholder="e.g. Become job-ready in full-stack web development by December."
                  rows={2}
                />
              </label>

              <div>
                <FieldLabel>Interests</FieldLabel>
                <p className="mb-3 -mt-1 text-[12px] muted2 dark:text-slate-400">Pick topics to personalize your recommendations.</p>
                <div className="flex flex-wrap gap-2">
                  {allChips.map(chip => {
                    const selected = form.interests.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleInterest(chip)}
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                          selected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-600 dark:bg-transparent dark:text-slate-300 dark:hover:border-blue-500"
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {([
                  ["GitHub",   "github.com/",      "github",   "username"] as const,
                  ["LinkedIn", "linkedin.com/in/", "linkedin", "username"] as const,
                ]).map(([label, prefix, field, placeholder]) => (
                  <label key={field} className="block">
                    <FieldLabel>{label}</FieldLabel>
                    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-600 dark:bg-slate-700/50 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20">
                      <span className="grid place-items-center border-r border-slate-200 bg-slate-100/60 px-3 text-[12.5px] muted2 whitespace-nowrap dark:border-slate-600 dark:bg-slate-700">
                        {prefix}
                      </span>
                      <input
                        placeholder={placeholder}
                        className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
                        value={
                          field === "github"
                            ? form.github.replace(/^https?:\/\/github\.com\//i, "").replace(/^github\.com\//i, "")
                            : form.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/^linkedin\.com\/in\//i, "")
                        }
                        onChange={e => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            [field]: val
                              ? (field === "github" ? `https://github.com/${val}` : `https://linkedin.com/in/${val}`)
                              : "",
                          }));
                        }}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </CardSection>

            {/* Contact & account */}
            <CardSection title="Contact & account" sub="Used for sign-in and important notifications.">
              <label className="block">
                <FieldLabel req>Email address</FieldLabel>
                <div className="relative">
                  <input className={inputCls + " pr-24"} value={user?.email ?? ""} readOnly />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold uppercase text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    Verified
                  </span>
                </div>
                <span className="mt-1.5 block text-[12px] muted2 dark:text-slate-400">Changing your email will require re-verification.</span>
              </label>

              <label className="block">
                <FieldLabel>Phone</FieldLabel>
                <input className={inputCls} name="phone" value={form.phone} onChange={handleChange} placeholder="+855 12 345 678" />
                <span className="mt-1.5 block text-[12px] muted2 dark:text-slate-400">Optional — for account recovery and SMS alerts.</span>
              </label>
            </CardSection>

            {/* Security */}
            <CardSection title="Security" sub="Keep your account safe.">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div>
                  <p className="text-[14px] font-semibold ink dark:text-slate-100">Password</p>
                  <p className="text-[12.5px] muted2 dark:text-slate-400">Last changed 3 months ago.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold ink hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ShieldCheck className="h-4 w-4" /> Change password
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div>
                  <p className="text-[14px] font-semibold ink dark:text-slate-100">Two-factor authentication</p>
                  <p className="text-[12.5px] muted2 dark:text-slate-400">Add a second step at sign-in with an authenticator app.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFA(v => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${twoFA ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${twoFA ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </CardSection>

            {/* Billing addresses */}
            <CardSection title="Billing addresses" sub="Used for invoices and receipts on your orders.">
              {addresses.length === 0 && !addressForm && (
                <p className="text-[14px] muted2 dark:text-slate-400">No billing addresses saved yet.</p>
              )}

              <div className="space-y-3">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className={`rounded-xl border p-4 ${
                      addr.is_default
                        ? "border-blue-200 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold ink dark:text-slate-100">{addr.name}</span>
                      {addr.is_default && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">Default</span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] muted2 dark:text-slate-400">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-[13px] muted2 dark:text-slate-400">{addr.address_line_2}</p>}
                    <p className="text-[13px] muted2 dark:text-slate-400">{addr.city}, {addr.country}</p>
                    {addr.tax_id && <p className="text-[12px] text-slate-400 dark:text-slate-500">Tax ID: {addr.tax_id}</p>}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {!addr.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[12px] font-semibold brand-blue hover:underline"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditAddress(addr)}
                        className="text-[12px] font-semibold ink hover:underline dark:text-slate-200"
                      >
                        Edit
                      </button>
                      {confirmDeleteId === addr.id ? (
                        <span className="flex items-center gap-2">
                          <span className="text-[12px] muted2">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            disabled={deletingAddressId === addr.id}
                            className="text-[12px] font-semibold text-rose-500 hover:underline disabled:opacity-50"
                          >
                            {deletingAddressId === addr.id ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[12px] font-semibold ink hover:underline dark:text-slate-200"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(addr.id)}
                          className="text-[12px] font-semibold text-rose-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {addressForm && (
                <div className="mt-2 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-700/30">
                  <label className="block">
                    <FieldLabel req>Full name</FieldLabel>
                    <input className={inputCls} name="name" value={addressForm.name} onChange={handleAddressFieldChange} placeholder="e.g. Torn Ratha" />
                  </label>
                  <label className="block">
                    <FieldLabel req>Address line 1</FieldLabel>
                    <input className={inputCls} name="address_line_1" value={addressForm.address_line_1} onChange={handleAddressFieldChange} placeholder="Street address" />
                  </label>
                  <label className="block">
                    <FieldLabel>Address line 2</FieldLabel>
                    <input className={inputCls} name="address_line_2" value={addressForm.address_line_2 ?? ""} onChange={handleAddressFieldChange} placeholder="Apt, floor, building (optional)" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel req>City</FieldLabel>
                      <input className={inputCls} name="city" value={addressForm.city} onChange={handleAddressFieldChange} placeholder="Phnom Penh" />
                    </label>
                    <label className="block">
                      <FieldLabel req>Country</FieldLabel>
                      <input className={inputCls} name="country" value={addressForm.country} onChange={handleAddressFieldChange} placeholder="Cambodia" />
                    </label>
                  </div>
                  <label className="block">
                    <FieldLabel>Tax ID</FieldLabel>
                    <input className={inputCls} name="tax_id" value={addressForm.tax_id ?? ""} onChange={handleAddressFieldChange} placeholder="Optional — for business invoices" />
                  </label>
                  {addressError && <p className="text-[12.5px] text-rose-500">⚠ {addressError}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelAddressForm}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={addressSaving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700 disabled:opacity-60"
                    >
                      {addressSaving ? "Saving…" : editingAddressId ? "Update address" : "Save address"}
                    </button>
                  </div>
                </div>
              )}

              {!addressForm && (
                <button
                  type="button"
                  onClick={openAddAddress}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3.5 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  <Plus className="h-4 w-4" /> Add address
                </button>
              )}
            </CardSection>

          </div>
        </div>
      </div>

      {/* Fixed save bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur transition-transform dark:border-slate-700 dark:bg-slate-900/90 ${
          isDirty ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              You have unsaved changes
            </span>
            {error && <span className="pl-4 text-[12px] text-rose-500">⚠ {error}</span>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700 disabled:opacity-60"
            >
              <CircleCheck className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function StudentProfileEdit() {
  return (
    <ProfileLayout activeLabel="Profile">
      <EditProfilePanel />
    </ProfileLayout>
  );
}
