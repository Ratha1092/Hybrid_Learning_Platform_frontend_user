import { useEffect, useState } from "react";
import { instructorService, type InstructorSection } from "../../../../services/instructorService";
import "./EditCourse.css";

interface Props { courseId: number; }

export default function Curriculum({ courseId }: Props) {
  const [sections, setSections] = useState<InstructorSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [newLesson, setNewLesson] = useState<Record<number, { title: string; type: string; video_url: string; is_preview: boolean }>>({});
  const [addingLesson, setAddingLesson] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    instructorService.getSections(courseId)
      .then(({ data }) => {
        const loaded = (data.data ?? []).map((s) => ({ ...s, lessons: s.lessons ?? [] }));
        setSections(loaded);
        setOpenSections(new Set([0]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggleSection = (i: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    setAddingSection(true);
    setError(null);
    try {
      const { data } = await instructorService.createSection(courseId, newSectionTitle.trim());
      setSections((prev) => [...prev, { ...data.data, lessons: data.data.lessons ?? [] }]);
      setNewSectionTitle("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const msg = e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" ") : e.response?.data?.message ?? e.message ?? "Failed to create section.";
      setError(msg);
    }
    setAddingSection(false);
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!window.confirm("Delete this section and all its lessons?")) return;
    setError(null);
    try {
      await instructorService.deleteSection(courseId, sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? "Failed to delete section.");
    }
  };

  const handleAddLesson = async (sectionId: number) => {
    const lesson = newLesson[sectionId];
    if (!lesson?.title?.trim()) return;
    setError(null);
    try {
      const lessonPayload: { title: string; type: string; is_preview: boolean; video_url?: string } = {
        title: lesson.title.trim(),
        type: lesson.type || "video",
        is_preview: lesson.is_preview ?? false,
      };
      if (lesson.type === "video" && lesson.video_url?.trim()) {
        lessonPayload.video_url = lesson.video_url.trim();
      }
      const { data } = await instructorService.createLesson(courseId, sectionId, lessonPayload);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, lessons: [...(s.lessons ?? []), data.data] } : s
        )
      );
      setNewLesson((prev) => ({ ...prev, [sectionId]: { title: "", type: "video", video_url: "", is_preview: false } }));
      setAddingLesson(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const msg = e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" ") : e.response?.data?.message ?? e.message ?? "Failed to add lesson.";
      setError(msg);
    }
  };

  const handleDeleteLesson = async (sectionId: number, lessonId: number) => {
    setError(null);
    try {
      await instructorService.deleteLesson(courseId, sectionId, lessonId);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, lessons: (s.lessons ?? []).filter((l) => l.id !== lessonId) }
            : s
        )
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? "Failed to delete lesson.");
    }
  };

  if (loading) return <div className="curr-loading"><div className="curr-spinner" /></div>;

  return (
    <div className="curr-wrap">
      {error && (
        <div className="ec-error" style={{ marginBottom: 16 }}>⚠ {error}</div>
      )}
      <div className="curr-header">
        <p className="curr-summary">
          {sections.length} sections · {sections.reduce((s, sec) => s + sec.lessons.length, 0)} lessons
        </p>
      </div>

      {/* Sections */}
      <div className="curr-sections">
        {sections.map((section, si) => (
          <div key={section.id} className={`curr-section${openSections.has(si) ? " curr-section--open" : ""}`}>
            {/* Section header */}
            <div className="curr-section__head">
              <button className="curr-section__toggle" onClick={() => toggleSection(si)}>
                <span className="curr-section__chevron">{openSections.has(si) ? "▼" : "▶"}</span>
                <span className="curr-section__title">{section.title}</span>
                <span className="curr-section__meta">{section.lessons.length} lessons</span>
              </button>
              <button
                className="curr-btn curr-btn--danger"
                onClick={() => handleDeleteSection(section.id)}
              >
                🗑
              </button>
            </div>

            {/* Lessons */}
            {openSections.has(si) && (
              <div className="curr-lessons">
                {section.lessons.length === 0 && (
                  <p className="curr-lessons__empty">No lessons yet.</p>
                )}
                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="curr-lesson">
                    <span className="curr-lesson__icon">
                      {lesson.type === "video" ? "▶" : "📄"}
                    </span>
                    <span className="curr-lesson__title">{lesson.title}</span>
                    <span className="curr-lesson__type">{lesson.type}</span>
                    {lesson.is_preview && (
                      <span className="curr-lesson__preview">Preview</span>
                    )}
                    <button
                      className="curr-btn curr-btn--danger curr-btn--sm"
                      onClick={() => handleDeleteLesson(section.id, lesson.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Add lesson */}
                {addingLesson === section.id ? (
                  <div className="curr-add-lesson">
                    <input
                      placeholder="Lesson title"
                      value={newLesson[section.id]?.title ?? ""}
                      onChange={(e) =>
                        setNewLesson((prev) => ({
                          ...prev,
                          [section.id]: { ...prev[section.id], title: e.target.value },
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleAddLesson(section.id)}
                    />
                    <select
                      value={newLesson[section.id]?.type ?? "video"}
                      onChange={(e) =>
                        setNewLesson((prev) => ({
                          ...prev,
                          [section.id]: { ...prev[section.id], type: e.target.value },
                        }))
                      }
                    >
                      <option value="video">🎬 Video</option>
                      <option value="article">📄 Article</option>
                      <option value="quiz">📝 Quiz</option>
                    </select>
                    {newLesson[section.id]?.type === "video" && (
                      <input
                        placeholder="Video URL (optional)"
                        value={newLesson[section.id]?.video_url ?? ""}
                        onChange={(e) =>
                          setNewLesson((prev) => ({
                            ...prev,
                            [section.id]: { ...prev[section.id], video_url: e.target.value },
                          }))
                        }
                      />
                    )}
                    <label className="curr-preview-label">
                      <input
                        type="checkbox"
                        checked={newLesson[section.id]?.is_preview ?? false}
                        onChange={(e) =>
                          setNewLesson((prev) => ({
                            ...prev,
                            [section.id]: { ...prev[section.id], is_preview: e.target.checked },
                          }))
                        }
                      />
                      Free preview
                    </label>
                    <button className="curr-btn curr-btn--primary" onClick={() => handleAddLesson(section.id)}>
                      Add
                    </button>
                    <button className="curr-btn" onClick={() => setAddingLesson(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="curr-btn-add-lesson"
                    onClick={() => {
                      setAddingLesson(section.id);
                      setNewLesson((prev) => ({ ...prev, [section.id]: { title: "", type: "video", video_url: "", is_preview: false } }));
                    }}
                  >
                    + Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add section */}
      <div className="curr-add-section">
        <input
          placeholder="New section title..."
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
        />
        <button
          className="curr-btn curr-btn--primary"
          onClick={handleAddSection}
          disabled={addingSection || !newSectionTitle.trim()}
        >
          {addingSection ? "Adding..." : "+ Add Section"}
        </button>
      </div>
    </div>
  );
}
