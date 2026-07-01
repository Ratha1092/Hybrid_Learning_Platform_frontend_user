import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instructorService, type StandaloneSection } from "../../../../services/instructorService";
import "../css/StandaloneSections.css";

export default function SectionLibrary() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<StandaloneSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    instructorService.getStandaloneSections()
      .then(({ data }) => setSections(data.data ?? []))
      .catch(() => setLoadError("Failed to load sections. Please refresh."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await instructorService.createStandaloneSection(newTitle.trim());
      setSections((prev) => [data.data, ...prev]);
      setNewTitle("");
      setShowForm(false);
    } catch {
      setSaveError("Failed to create section. Please try again.");
    }
    setSaving(false);
  };


  return (
    <div className="sl-page">
      {/* Header */}
      <div className="sl-header">
        <div className="sl-header__text">
          <h1 className="sl-title">Section Library</h1>
          <p className="sl-sub">
            {loading ? "" : `${sections.length} standalone section${sections.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!showForm && (
          <button className="sl-btn-new" onClick={() => setShowForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Section
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="sl-banner">
        <span className="sl-banner__icon">💡</span>
        <span>
          Build sections here before creating a course.
          When you create a course, the <strong>Attach Sections</strong> step lets you pick
          sections from this library and assign them in one go.
          Lessons can be added to each section after attaching it to a course.
        </span>
      </div>

      {/* Inline create form */}
      {showForm && (
        <div className="sl-create-card">
          <h3>New standalone section</h3>
          <div className="sl-create-row">
            <input
              placeholder="Section title e.g. Getting Started with React"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="sl-create-actions">
              <button className="sl-btn-save" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="sl-btn-cancel" onClick={() => { setShowForm(false); setNewTitle(""); setSaveError(null); }}>
                Cancel
              </button>
            </div>
          </div>
          {saveError && <p className="sl-create-err">⚠ {saveError}</p>}
        </div>
      )}

      {/* Load error */}
      {loadError && <div className="sl-error">⚠ {loadError}</div>}

      {/* Loading */}
      {loading && (
        <div className="sl-loading">
          <div className="sl-spinner" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && sections.length === 0 && (
        <div className="sl-empty">
          <span className="sl-empty__icon">📋</span>
          <p>No standalone sections yet.<br />Create your first section above to get started.</p>
          <button className="sl-empty__cta" onClick={() => setShowForm(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create first section
          </button>
        </div>
      )}

      {/* Section list */}
      {!loading && sections.length > 0 && (
        <>
          <div className="sl-list">
            {sections.map((s) => (
              <div key={s.id} className="sl-row">
                <span className="sl-row__drag">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"/>
                  </svg>
                </span>

                <div className="sl-row__info">
                  <p className="sl-row__title">{s.title}</p>
                  <div className="sl-row__meta">
                    <span className="sl-badge-standalone">Standalone</span>
                    <span className="sl-row__lessons">
                      {s.lessons_count === 0 ? "No lessons yet" : `${s.lessons_count} lesson${s.lessons_count !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Attach CTA */}
          <div className="sl-attach-cta">
            <p>Ready to use these sections? Attach them when creating a course.</p>
            <button className="sl-attach-cta__btn" onClick={() => navigate("/instructor/courses/create")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create Course
            </button>
          </div>
        </>
      )}
    </div>
  );
}
