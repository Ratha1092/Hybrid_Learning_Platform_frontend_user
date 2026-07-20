import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Mail, Pencil, LogOut, BookOpen, Users, DollarSign,
  Upload, Trash2, Check, X,
} from "lucide-react";

function safeNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
import { useAuth } from "../../../../context/AuthContext";
import { profileService, type StudentProfile } from "../../../../services/profileService";
import { instructorService, type DashboardStats } from "../../../../services/instructorService";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

interface FormState {
  name: string;
  phone: string;
  bio: string;
  github: string;
  linkedin: string;
}

function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none placeholder:text-slate-400 " +
  "focus:border-blue-400 focus:ring-4 focus:ring-blue-100 " +
  "dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20";

export default function InstructorProfile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<FormState>({ name: "", phone: "", bio: "", github: "", linkedin: "" });
  const initialForm = useRef<FormState>(form);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      profileService.get(),
      instructorService.getDashboard().catch(() => null),
    ]).then(([profileRes, statsRes]) => {
      const p = profileRes.data.data;
      setProfile(p);
      setStats(statsRes?.data?.data ?? null);
      const loaded: FormState = {
        name:     p.name     ?? user?.name ?? "",
        phone:    p.phone    ?? "",
        bio:      p.bio      ?? "",
        github:   p.github   ?? "",
        linkedin: p.linkedin ?? "",
      };
      setForm(loaded);
      initialForm.current = loaded;
    }).finally(() => setLoading(false));
  }, [user]);

  const avatarSrc = resolveUrl(avatarPreview ? null : (profile?.avatar ?? profile?.avatar_url ?? user?.avatar_url ?? user?.avatar));
  const displaySrc = avatarPreview ?? avatarSrc;
  const displayName = profile?.name ?? user?.name ?? "Instructor";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setAvatarError("File must be under 3 MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setAvatarError("Only JPG, PNG or WebP."); return; }
    setAvatarError("");
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const { data } = await profileService.uploadAvatar(file);
      updateUser({ avatar_url: data.data.avatar_url });
    } catch {
      setAvatarError("Upload failed.");
      setAvatarPreview(null);
    }
    setAvatarUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null);
    setAvatarError("");
    try { await profileService.removeAvatar(); updateUser({ avatar_url: undefined }); } catch { /* silent */ }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true); setSaveError(""); setSaveOk(false);
    try {
      const res = await profileService.update(form);
      const uid = res.data?.data?.id ?? user?.id;
      if (uid) {
        localStorage.setItem(`profile_extra_${uid}`, JSON.stringify({ bio: form.bio, github: form.github, linkedin: form.linkedin }));
      }
      updateUser({ name: form.name });
      initialForm.current = { ...form };
      setProfile(prev => prev ? { ...prev, ...form } : prev);
      setSaveOk(true);
      setTimeout(() => { setSaveOk(false); setEditing(false); }, 1200);
    } catch {
      setSaveError("Could not save changes. Please try again.");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({ ...initialForm.current });
    setSaveError("");
    setEditing(false);
  };

  if (loading) return <Spinner />;

  const totalCourses  = stats?.courses?.total ?? 0;
  const published     = stats?.courses?.published ?? 0;
  const totalStudents = stats?.students?.total_unique ?? 0;
  const totalRevenue  = stats?.revenue?.total_earned ?? 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Account</p>
          <h1 className="mt-0.5 font-display text-[28px] font-extrabold text-slate-900 dark:text-white">
            {editing ? "Edit Profile" : "My Profile"}
          </h1>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Pencil className="h-4 w-4" /> Edit profile
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

        {/* Left: profile card */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">

          {/* Avatar card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-e1 dark:border-slate-700 dark:bg-slate-800">
            <div className="relative mx-auto h-24 w-24">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl grad-blue text-3xl font-extrabold text-white shadow-glow">
                {displaySrc
                  ? <img src={displaySrc} alt={displayName} className="h-full w-full object-cover" />
                  : displayName.charAt(0).toUpperCase()}
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white dark:ring-slate-800 hover:bg-blue-700"
                  title="Change photo"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />

            {editing && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {avatarUploading
                  ? <span className="text-[12px] text-slate-400">Uploading…</span>
                  : <>
                      <button onClick={() => fileInputRef.current?.click()} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">Change photo</button>
                      {(displaySrc) && <button onClick={handleRemoveAvatar} className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /> Remove</button>}
                    </>}
                {avatarError && <p className="mt-1 text-[12px] text-rose-500">{avatarError}</p>}
              </div>
            )}

            <p className="mt-4 font-display text-[18px] font-bold text-slate-900 dark:text-slate-50">
              {form.name || displayName}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              Instructor
            </span>

            <ul className="mt-5 space-y-2 text-left text-[13px] text-slate-500 dark:text-slate-400">
              {user?.created_at && (
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </li>
              )}
              {user?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{user.email}</span>
                </li>
              )}
              {(form.github || profile?.github) && !editing && (
                <li className="flex items-center gap-2">
                  <GithubIcon className="h-4 w-4 shrink-0" />
                  <span className="break-all">{form.github || profile?.github}</span>
                </li>
              )}
              {(form.linkedin || profile?.linkedin) && !editing && (
                <li className="flex items-center gap-2">
                  <LinkedinIcon className="h-4 w-4 shrink-0" />
                  <span className="break-all">{form.linkedin || profile?.linkedin}</span>
                </li>
              )}
            </ul>

            {!editing && (
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-wide text-slate-400">Overview</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-display text-[18px] font-extrabold text-slate-900 dark:text-slate-50">{totalCourses}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    Course{totalCourses !== 1 ? "s" : ""}
                    {published > 0 && <span className="ml-1 text-emerald-600 dark:text-emerald-400">· {published} published</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-display text-[18px] font-extrabold text-slate-900 dark:text-slate-50">{totalStudents.toLocaleString()}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Total students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-display text-[18px] font-extrabold text-slate-900 dark:text-slate-50">
                    ${safeNum(totalRevenue).toFixed(2)}
                  </p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Lifetime revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: view or edit */}
        {!editing ? (
          /* View mode */
          <div className="flex flex-col gap-5">

            {/* Bio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-[16px] font-bold text-slate-800 dark:text-slate-100">About</h2>
              {profile?.bio ? (
                <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600 dark:text-slate-300">{profile.bio}</p>
              ) : (
                <p className="mt-3 text-[14px] text-slate-400 dark:text-slate-500">
                  No bio yet.{" "}
                  <button onClick={() => setEditing(true)} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Add one</button>
                </p>
              )}
            </div>

            {/* Social links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-[16px] font-bold text-slate-800 dark:text-slate-100">Links</h2>
              <div className="mt-4 flex flex-col gap-3">
                {profile?.github ? (
                  <a href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-[14px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <GithubIcon className="h-4 w-4 shrink-0 text-slate-500" />
                    {profile.github}
                  </a>
                ) : null}
                {profile?.linkedin ? (
                  <a href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-[14px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <LinkedinIcon className="h-4 w-4 shrink-0 text-slate-500" />
                    {profile.linkedin}
                  </a>
                ) : null}
                {!profile?.github && !profile?.linkedin && (
                  <p className="text-[14px] text-slate-400 dark:text-slate-500">
                    No links added.{" "}
                    <button onClick={() => setEditing(true)} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Add links</button>
                  </p>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-[16px] font-bold text-slate-800 dark:text-slate-100">Quick links</h2>
              <div className="mt-4 flex flex-col gap-2">
                {[
                  { label: "My Courses", to: "/instructor/courses" },
                  { label: "Revenue & Payouts", to: "/instructor/revenue" },
                  { label: "Payout Account", to: "/instructor/payout-account" },
                  { label: "Students", to: "/instructor/students" },
                ].map(({ label, to }) => (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left text-[14px] font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/5"
                  >
                    {label}
                    <span className="text-slate-300 dark:text-slate-600">›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Edit mode */
          <form onSubmit={handleSave} className="flex flex-col gap-5">

            {/* Basic info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-[16px] font-bold text-slate-800 dark:text-slate-100">Basic info</h2>
              <div className="mt-5 flex flex-col gap-4">
                <div>
                  <p className="mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">Full name <span className="text-rose-500">*</span></p>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className={inputCls} required />
                </div>
                <div>
                  <p className="mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">Phone</p>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-[16px] font-bold text-slate-800 dark:text-slate-100">About</h2>
              <p className="mt-0.5 text-[13px] text-slate-400">Tell students about your expertise and background.</p>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={5}
                placeholder="Share your teaching philosophy, credentials, and what makes your courses unique…"
                className={`${inputCls} mt-5 resize-none`}
              />
            </div>

            {/* Social links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-[16px] font-bold text-slate-800 dark:text-slate-100">Social links</h2>
              <div className="mt-5 flex flex-col gap-4">
                <div>
                  <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    <GithubIcon className="h-4 w-4" /> GitHub
                  </p>
                  <input name="github" value={form.github} onChange={handleChange} placeholder="https://github.com/username or username" className={inputCls} />
                </div>
                <div>
                  <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    <LinkedinIcon className="h-4 w-4" /> LinkedIn
                  </p>
                  <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username or username" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Actions */}
            {saveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13.5px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                {saveError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || saveOk}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
              >
                {saveOk ? <><Check className="h-4 w-4" /> Saved!</> : saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
