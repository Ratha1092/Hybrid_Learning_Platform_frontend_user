import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Trash2, Plus, Video, FileText, ListChecks, Paperclip, Pencil } from "lucide-react";
import { instructorService, type InstructorSection, type InstructorLesson, type LessonResource, type InstructorLessonVideo } from "../../../../services/instructorService";
import { getVideoDuration } from "../../../../utils/videoUrl";

interface Props { courseId: number; isPublished?: boolean; }

const EXT_ICON: Record<string, string> = {
  pdf: "📄", zip: "🗜️", doc: "📝", docx: "📝", ppt: "📊", pptx: "📊", mp4: "🎬", jpg: "🖼️", png: "🖼️",
};

//  Lesson Resources Panel 
function ResourcesPanel({ courseId, sectionId, lessonId, isPublished }: { courseId: number; sectionId: number; lessonId: number; isPublished: boolean }) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [title, setTitle]         = useState("");
  const [files, setFiles]         = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState<number | null>(null);
  const [uploadIndex, setUploadIndex] = useState<{ done: number; total: number } | null>(null);
  const [err, setErr]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    instructorService.getLessonResources(courseId, sectionId, lessonId)
      .then((r) => setResources(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, sectionId, lessonId]);

  const handleUpload = async () => {
    if (files.length === 0)             { setErr("Please select at least one file."); return; }
    if (files.length === 1 && !title.trim()) { setErr("Title is required."); return; }
    setErr(null); setUploading(true);
    const uploaded: LessonResource[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadIndex({ done: i, total: files.length }); setProgress(0);
      const resourceTitle = files.length > 1 ? files[i].name.replace(/\.[^.]+$/, "") : title.trim();
      try {
        const fd = new FormData();
        fd.append("title", resourceTitle);
        fd.append("file", files[i]);
        const res = await instructorService.uploadLessonResource(courseId, sectionId, lessonId, fd, setProgress);
        uploaded.push(res.data.data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        setErr(err.response?.data?.message ?? err.message ?? "Upload failed.");
        break;
      }
    }
    if (uploaded.length) setResources((prev) => [...prev, ...uploaded]);
    setTitle(""); setFiles([]); setProgress(null); setUploadIndex(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  };

  const handleDelete = async (rid: number) => {
    if (isPublished) return;
    setErr(null);
    try {
      await instructorService.deleteLessonResource(courseId, sectionId, lessonId, rid);
      setResources((prev) => prev.filter((r) => r.id !== rid));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(err.response?.data?.message ?? err.message ?? "Failed to delete resource.");
    }
  };

  return (
    <div className="mx-6 mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/30">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lesson Resources</p>

      {loading ? (
        <p className="text-[12px] text-slate-400">Loading…</p>
      ) : (
        <>
          {resources.length === 0 && <p className="mb-3 text-[12px] text-slate-400">No resources yet.</p>}
          {resources.map((r) => (
            <div key={r.id} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
              <span className="text-sm">{EXT_ICON[r.type] ?? "📎"}</span>
              <span className="flex-1 text-[12.5px] font-medium text-slate-700 dark:text-slate-200">{r.title}</span>
              <span className="text-[11px] text-slate-400">.{r.type}</span>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={isPublished}
                title={isPublished ? "This course is public, so its content can't be deleted." : undefined}
                className="text-slate-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-300 dark:text-slate-500 dark:hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="mt-3 flex flex-col gap-2">
            <input
              placeholder={files.length > 1 ? "Title (ignored — each file uses its own name)" : "Resource title *"}
              value={title}
              disabled={files.length > 1}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-[12px] text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-blue-500/5">
              {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Choose file(s) (PDF, DOC, PPT, ZIP…)"}
              <input ref={fileRef} type="file" multiple accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.png" className="hidden"
                onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setErr(null); }} />
            </label>
            {err && <p className="text-[11.5px] text-rose-500">⚠ {err}</p>}
            {uploadIndex && (
              <p className="text-[11px] text-slate-400">Uploading file {uploadIndex.done + 1} of {uploadIndex.total}…</p>
            )}
            {progress !== null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="self-start rounded-lg bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : files.length > 1 ? `Upload ${files.length} files` : "Upload"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

//  Lesson Videos Panel — a lesson can hold several videos (e.g. split into parts)
function VideosPanel({ courseId, sectionId, lessonId, isPublished }: { courseId: number; sectionId: number; lessonId: number; isPublished: boolean }) {
  const [videos, setVideos]       = useState<InstructorLessonVideo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [files, setFiles]         = useState<File[]>([]);
  const [urlInput, setUrlInput]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState<number | null>(null);
  const [uploadIndex, setUploadIndex] = useState<{ done: number; total: number } | null>(null);
  const [err, setErr]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    instructorService.getLessonVideos(courseId, sectionId, lessonId)
      .then((r) => setVideos(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, sectionId, lessonId]);

  const handleUpload = async () => {
    if (files.length === 0 && !urlInput.trim()) { setErr("Choose file(s) or paste a video URL."); return; }
    setErr(null); setUploading(true);
    const uploaded: InstructorLessonVideo[] = [];
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        setUploadIndex({ done: i, total: files.length }); setProgress(0);
        try {
          const fd = new FormData();
          fd.append("video", files[i]);
          const duration = await getVideoDuration(files[i]).catch(() => null);
          if (duration != null) fd.append("duration", String(Math.round(duration)));
          const res = await instructorService.addLessonVideo(courseId, sectionId, lessonId, fd, setProgress);
          uploaded.push(res.data.data);
        } catch (e: unknown) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          setErr(err.response?.data?.message ?? err.message ?? "Upload failed.");
          break;
        }
      }
    } else if (urlInput.trim()) {
      try {
        const fd = new FormData();
        fd.append("video_url", urlInput.trim());
        const res = await instructorService.addLessonVideo(courseId, sectionId, lessonId, fd);
        uploaded.push(res.data.data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        setErr(err.response?.data?.message ?? err.message ?? "Failed to add video URL.");
      }
    }
    if (uploaded.length) setVideos((prev) => [...prev, ...uploaded]);
    setFiles([]); setUrlInput(""); setProgress(null); setUploadIndex(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  };

  const handleDelete = async (vid: number) => {
    if (isPublished) return;
    setErr(null);
    try {
      await instructorService.deleteLessonVideo(courseId, sectionId, lessonId, vid);
      setVideos((prev) => prev.filter((v) => v.id !== vid));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(err.response?.data?.message ?? err.message ?? "Failed to delete video.");
    }
  };

  return (
    <div className="mx-6 mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/30">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lesson Videos</p>

      {loading ? (
        <p className="text-[12px] text-slate-400">Loading…</p>
      ) : (
        <>
          {videos.length === 0 && <p className="mb-3 text-[12px] text-slate-400">No videos yet.</p>}
          {videos.map((v, i) => (
            <div key={v.id} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
              <span className="text-sm">🎬</span>
              <span className="flex-1 text-[12.5px] font-medium text-slate-700 dark:text-slate-200">
                Video {i + 1}{v.video_path ? "" : " (URL)"}
              </span>
              {v.duration != null && <span className="text-[11px] text-slate-400">{Math.round(v.duration)}s</span>}
              <button
                onClick={() => handleDelete(v.id)}
                disabled={isPublished}
                title={isPublished ? "This course is public, so its content can't be deleted." : undefined}
                className="text-slate-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-300 dark:text-slate-500 dark:hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="mt-3 flex flex-col gap-2">
            <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-[12px] text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-blue-500/5">
              {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Choose video file(s) (mp4, mov, webm…)"}
              <input ref={fileRef} type="file" multiple accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm" className="hidden"
                onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setUrlInput(""); setErr(null); }} />
            </label>
            {files.length === 0 && (
              <input
                placeholder="Or paste a YouTube / Vimeo URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            )}
            {err && <p className="text-[11.5px] text-rose-500">⚠ {err}</p>}
            {uploadIndex && (
              <p className="text-[11px] text-slate-400">Uploading video {uploadIndex.done + 1} of {uploadIndex.total}…</p>
            )}
            {progress !== null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="self-start rounded-lg bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : files.length > 1 ? `Upload ${files.length} videos` : "Add Video"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

//  Curriculum
export default function Curriculum({ courseId, isPublished = false }: Props) {
  const [sections, setSections]           = useState<InstructorSection[]>([]);
  const [loading, setLoading]             = useState(true);
  const [openSections, setOpenSections]   = useState<Set<number>>(new Set([0]));
  const [expandedResources, setExpandedResources] = useState<Set<number>>(new Set());
  const [expandedVideos, setExpandedVideos] = useState<Set<number>>(new Set());
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [addingLesson, setAddingLesson]   = useState<number | null>(null);
  const [confirmSection, setConfirmSection] = useState<number | null>(null);
  const [newLesson, setNewLesson]         = useState<Record<number, { title: string; type: string; video_url: string; content?: string; is_preview: boolean; videoFiles?: File[]; duration?: number | null; articleFiles?: File[] }>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [uploadFileIndex, setUploadFileIndex] = useState<Record<number, { done: number; total: number }>>({});
  const [error, setError]                 = useState<string | null>(null);

  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", is_preview: false, video_url: "", content: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

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

  const toggleSection = (i: number) =>
    setOpenSections((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const toggleResources = (lId: number) =>
    setExpandedResources((prev) => { const n = new Set(prev); n.has(lId) ? n.delete(lId) : n.add(lId); return n; });

  const toggleVideos = (lId: number) =>
    setExpandedVideos((prev) => { const n = new Set(prev); n.has(lId) ? n.delete(lId) : n.add(lId); return n; });

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    setAddingSection(true); setError(null);
    try {
      const { data } = await instructorService.createSection(courseId, newSectionTitle.trim());
      const newSection = { ...data.data, lessons: data.data.lessons ?? [] };
      setSections((prev) => [...prev, newSection]);
      setOpenSections((open) => new Set(open).add(sections.length));
      setNewLesson((p) => ({ ...p, [newSection.id]: { title: "", type: "video", video_url: "", is_preview: false } }));
      setAddingLesson(newSection.id);
      setNewSectionTitle("");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      setError(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : err.response?.data?.message ?? "Failed to create section.");
    }
    setAddingSection(false);
  };

  const handleDeleteSection = async (sectionId: number) => {
    setConfirmSection(null); setError(null);
    if (isPublished) { setError("This course is public, so its content can't be deleted."); return; }
    try {
      await instructorService.deleteSection(courseId, sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message ?? "Failed to delete section.");
    }
  };

  const handleAddLesson = async (sectionId: number) => {
    const lesson = newLesson[sectionId];
    if (!lesson?.title?.trim()) return;
    setError(null);
    try {
      const payload: { title: string; type: string; is_preview: boolean; content?: string; duration?: number } = {
        title: lesson.title.trim(), type: lesson.type || "video", is_preview: lesson.is_preview ?? false,
      };
      if (lesson.type === "video" && lesson.videoFiles?.length && lesson.duration != null)
        payload.duration = lesson.duration;
      if (lesson.type === "article" && lesson.content?.trim())
        payload.content = lesson.content.trim();

      const { data } = await instructorService.createLesson(courseId, sectionId, payload);
      const lessonId = data.data.id;

      if (lesson.type === "video" && lesson.videoFiles?.length) {
        const videoFiles = lesson.videoFiles;
        for (let i = 0; i < videoFiles.length; i++) {
          setUploadFileIndex((p) => ({ ...p, [sectionId]: { done: i, total: videoFiles.length } }));
          setUploadProgress((p) => ({ ...p, [sectionId]: 0 }));
          const fd = new FormData();
          fd.append("video", videoFiles[i]);
          const duration = await getVideoDuration(videoFiles[i]).catch(() => null);
          if (duration != null) fd.append("duration", String(Math.round(duration)));
          await instructorService.addLessonVideo(courseId, sectionId, lessonId, fd,
            (pct) => setUploadProgress((p) => ({ ...p, [sectionId]: pct })));
        }
        setUploadProgress((p) => { const n = { ...p }; delete n[sectionId]; return n; });
        setUploadFileIndex((p) => { const n = { ...p }; delete n[sectionId]; return n; });
      } else if (lesson.type === "video" && lesson.video_url?.trim()) {
        const fd = new FormData();
        fd.append("video_url", lesson.video_url.trim());
        await instructorService.addLessonVideo(courseId, sectionId, lessonId, fd);
      }

      if (lesson.type === "article" && lesson.articleFiles?.length) {
        const articleFiles = lesson.articleFiles;
        for (let i = 0; i < articleFiles.length; i++) {
          setUploadFileIndex((p) => ({ ...p, [sectionId]: { done: i, total: articleFiles.length } }));
          setUploadProgress((p) => ({ ...p, [sectionId]: 0 }));
          const fd = new FormData();
          fd.append("title", articleFiles[i].name);
          fd.append("file", articleFiles[i]);
          await instructorService.uploadLessonResource(courseId, sectionId, lessonId, fd,
            (pct) => setUploadProgress((p) => ({ ...p, [sectionId]: pct })));
        }
        setUploadProgress((p) => { const n = { ...p }; delete n[sectionId]; return n; });
        setUploadFileIndex((p) => { const n = { ...p }; delete n[sectionId]; return n; });
      }

      setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, lessons: [...(s.lessons ?? []), data.data] } : s));
      setNewLesson((prev) => ({ ...prev, [sectionId]: { title: "", type: "video", video_url: "", content: "", is_preview: false, videoFiles: [], duration: null, articleFiles: [] } }));
      setAddingLesson(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      setError(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : err.response?.data?.message ?? "Failed to add lesson.");
    }
  };

  const handleDeleteLesson = async (sectionId: number, lessonId: number) => {
    setError(null);
    if (isPublished) { setError("This course is public, so its content can't be deleted."); return; }
    try {
      await instructorService.deleteLesson(courseId, sectionId, lessonId);
      setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, lessons: (s.lessons ?? []).filter((l) => l.id !== lessonId) } : s));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message ?? "Failed to delete lesson.");
    }
  };

  const startEditLesson = (lesson: InstructorLesson) => {
    setAddingLesson(null);
    setEditingLessonId(lesson.id);
    setEditErr(null);
    setEditForm({
      title: lesson.title,
      is_preview: lesson.is_preview,
      video_url: lesson.video_url ?? "",
      content: lesson.content ?? "",
    });
  };

  const handleSaveEditLesson = async (sectionId: number, lesson: InstructorLesson) => {
    if (!editForm.title.trim()) { setEditErr("Title is required."); return; }
    setEditSaving(true); setEditErr(null);
    try {
      const payload: Partial<InstructorLesson> & { video_url?: string; content?: string } = {
        title: editForm.title.trim(),
        is_preview: editForm.is_preview,
      };
      if (lesson.type === "video") payload.video_url = editForm.video_url || undefined;
      if (lesson.type === "article") payload.content = editForm.content || undefined;
      await instructorService.updateLesson(courseId, sectionId, lesson.id, payload);
      setSections((prev) => prev.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: s.lessons.map((l) => l.id === lesson.id ? { ...l, ...payload, title: editForm.title.trim() } : l) }
          : s
      ));
      setEditingLessonId(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setEditErr(err.response?.data?.message ?? "Failed to update lesson.");
    }
    setEditSaving(false);
  };

  if (loading) return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Summary */}
      <p className="text-[13.5px] text-slate-500 dark:text-slate-400">
        {sections.length} section{sections.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
      </p>

      {isPublished && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          This course is public. Sections, lessons, and resources can't be deleted while it's published.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          ⚠ {error}
        </div>
      )}

      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-[13px] text-slate-500 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-400">
          No sections yet. Type a section title in the box below and click <strong>Add Section</strong> to create your first one — you can add lessons to it afterward.
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {sections.map((section, si) => (
          <div key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">

            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <button onClick={() => toggleSection(si)} className="flex flex-1 items-center gap-3 text-left">
                <span className="text-slate-400 dark:text-slate-500">
                  {openSections.has(si) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{section.title}</span>
                <span className="text-[12px] text-slate-400 dark:text-slate-500">{section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""}</span>
              </button>
              <button
                onClick={() => setConfirmSection(section.id)}
                disabled={isPublished}
                title={isPublished ? "This course is public, so its content can't be deleted." : undefined}
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Lessons */}
            {openSections.has(si) && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {section.lessons.length === 0 && (
                  <p className="px-6 py-4 text-[13px] text-slate-400 dark:text-slate-500">No lessons yet.</p>
                )}

                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                    <div className="flex items-center gap-3 px-6 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {lesson.type === "video" ? <Video className="h-3.5 w-3.5" /> : lesson.type === "quiz" ? <ListChecks className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                      </span>
                      <span className="flex-1 text-[13.5px] font-medium text-slate-700 dark:text-slate-200">{lesson.title}</span>
                      {lesson.is_preview && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                          Preview
                        </span>
                      )}
                      <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{lesson.type}</span>
                      {lesson.type === "video" && (
                        <button
                          onClick={() => toggleVideos(lesson.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                            expandedVideos.has(lesson.id)
                              ? "bg-blue-600 text-white"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          }`}
                        >
                          <Video className="h-3 w-3" /> Videos{lesson.videos_count != null ? ` (${lesson.videos_count})` : ""}
                        </button>
                      )}
                      <button
                        onClick={() => toggleResources(lesson.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                          expandedResources.has(lesson.id)
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                        }`}
                      >
                        <Paperclip className="h-3 w-3" /> Resources
                      </button>
                      <button
                        onClick={() => startEditLesson(lesson)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        title="Edit lesson"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(section.id, lesson.id)}
                        disabled={isPublished}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 dark:text-slate-500 dark:hover:text-rose-400"
                        title={isPublished ? "This course is public, so its content can't be deleted." : "Delete lesson"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {editingLessonId === lesson.id && (
                      <div className="mx-6 mb-3 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                        <input
                          autoFocus
                          placeholder="Lesson title *"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={editForm.is_preview}
                            onChange={(e) => setEditForm((f) => ({ ...f, is_preview: e.target.checked }))}
                          />
                          Free Preview
                        </label>
                        {lesson.type === "video" && (
                          <input
                            placeholder="YouTube / Vimeo URL"
                            value={editForm.video_url}
                            onChange={(e) => setEditForm((f) => ({ ...f, video_url: e.target.value }))}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                        )}
                        {lesson.type === "article" && (
                          <textarea
                            rows={3}
                            placeholder="Article content"
                            value={editForm.content}
                            onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                        )}
                        {editErr && <p className="text-[11.5px] font-medium text-rose-500">⚠ {editErr}</p>}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleSaveEditLesson(section.id, lesson)}
                            disabled={editSaving}
                            className="rounded-xl bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {editSaving ? "Saving…" : "Save Changes"}
                          </button>
                          <button
                            onClick={() => setEditingLessonId(null)}
                            className="rounded-xl border border-slate-200 px-5 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {expandedVideos.has(lesson.id) && (
                      <VideosPanel courseId={courseId} sectionId={section.id} lessonId={lesson.id} isPublished={isPublished} />
                    )}

                    {expandedResources.has(lesson.id) && (
                      <ResourcesPanel courseId={courseId} sectionId={section.id} lessonId={lesson.id} isPublished={isPublished} />
                    )}
                  </div>
                ))}

                {/* Add lesson form */}
                {addingLesson === section.id ? (
                  <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700">
                    <input
                      autoFocus
                      placeholder="Lesson title *"
                      value={newLesson[section.id]?.title ?? ""}
                      onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], title: e.target.value } }))}
                      onKeyDown={(e) => e.key === "Enter" && handleAddLesson(section.id)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={newLesson[section.id]?.type ?? "video"}
                        onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], type: e.target.value } }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="video">🎬 Video</option>
                        <option value="article">📄 Article</option>
                      </select>
                      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={newLesson[section.id]?.is_preview ?? false}
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], is_preview: e.target.checked } }))}
                        />
                        Free Preview
                      </label>
                    </div>

                    {newLesson[section.id]?.type === "video" && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[12px] text-slate-400">Upload video(s) (mp4, mov, webm — max 500MB each)</label>
                        <input type="file" multiple accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                          className="text-[12.5px] text-slate-600 dark:text-slate-400"
                          onChange={(e) => {
                            const fs = Array.from(e.target.files ?? []);
                            setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], videoFiles: fs, duration: null } }));
                            if (fs.length) Promise.all(fs.map((f) => getVideoDuration(f).catch(() => 0)))
                              .then((durations) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], duration: durations.reduce((a, b) => a + b, 0) } })))
                              .catch(() => {});
                          }} />
                        {(newLesson[section.id]?.videoFiles?.length ?? 0) > 1 && (
                          <p className="text-[11px] text-slate-400">{newLesson[section.id]?.videoFiles?.length} videos selected — they'll upload one after another.</p>
                        )}
                        {!newLesson[section.id]?.videoFiles?.length && (
                          <input
                            placeholder="Or paste YouTube / Vimeo URL"
                            value={newLesson[section.id]?.video_url ?? ""}
                            onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], video_url: e.target.value } }))}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                        )}
                        {uploadProgress[section.id] !== undefined && (
                          <div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${uploadProgress[section.id]}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {uploadFileIndex[section.id]
                                ? `Uploading video ${uploadFileIndex[section.id].done + 1} of ${uploadFileIndex[section.id].total} — ${uploadProgress[section.id]}%`
                                : `Uploading ${uploadProgress[section.id]}%`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {newLesson[section.id]?.type === "article" && (
                      <div className="flex flex-col gap-2">
                        <textarea
                          rows={3}
                          placeholder="Write the article content here..."
                          value={newLesson[section.id]?.content ?? ""}
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], content: e.target.value } }))}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                        <label className="text-[12px] text-slate-400">Or upload document(s) (PDF, DOC, PPT — optional, shown as downloads for students)</label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.ppt,.pptx"
                          className="text-[12.5px] text-slate-600 dark:text-slate-400"
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], articleFiles: Array.from(e.target.files ?? []) } }))}
                        />
                        {(newLesson[section.id]?.articleFiles?.length ?? 0) > 1 && (
                          <p className="text-[11px] text-slate-400">{newLesson[section.id]?.articleFiles?.length} documents selected — they'll upload one after another.</p>
                        )}
                        {uploadProgress[section.id] !== undefined && (
                          <div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${uploadProgress[section.id]}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {uploadFileIndex[section.id]
                                ? `Uploading document ${uploadFileIndex[section.id].done + 1} of ${uploadFileIndex[section.id].total} — ${uploadProgress[section.id]}%`
                                : `Uploading ${uploadProgress[section.id]}%`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleAddLesson(section.id)}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                      >
                        Save Lesson
                      </button>
                      <button
                        onClick={() => setAddingLesson(null)}
                        className="rounded-xl border border-slate-200 px-5 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 px-6 py-3 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setEditingLessonId(null);
                        setAddingLesson(section.id);
                        setNewLesson((p) => ({ ...p, [section.id]: { title: "", type: "video", video_url: "", is_preview: false } }));
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Lesson
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add section */}
      <p className="text-[12px] text-slate-400 dark:text-slate-500">
        Enter a title to enable the <strong>Add Section</strong> button.
      </p>
      <div className="flex gap-2.5">
        <input
          placeholder="New section title…"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <button
          onClick={handleAddSection}
          disabled={addingSection || !newSectionTitle.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {addingSection ? "Adding…" : "Add Section"}
        </button>
      </div>

      {/* Delete section confirm modal */}
      {confirmSection !== null && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setConfirmSection(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-card dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-center text-[2rem]">🗑️</div>
            <h3 className="mb-2 text-center text-[15px] font-bold text-slate-800 dark:text-slate-100">Delete this section?</h3>
            <p className="mb-6 text-center text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              This will permanently remove the section and all its lessons. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSection(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={() => handleDeleteSection(confirmSection)}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-[13px] font-bold text-white hover:bg-rose-600">
                Yes, delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
