import { useEffect, useRef, useState } from "react";
import { Clock, Heart, MessageCircle, X } from "lucide-react";
import { lessonCommentService, type LessonComment } from "../../services/lessonCommentService";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { getEcho } from "../../utils/echo";
import { resolveUrl, timeAgo } from "../../utils/format";
import "./LessonComments.css";

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTimestamp(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const parts = trimmed.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return null;
  return parts.reduceRight((acc, p, i, arr) => acc + p * Math.pow(60, arr.length - 1 - i), 0);
}
export interface TimestampValue {
  seconds: number;
  videoId: number | null;
}

function TimestampControl({
  value, onChange, getCurrentTime, getVideoId,
}: {
  value: TimestampValue | null;
  onChange: (v: TimestampValue | null) => void;
  getCurrentTime?: () => number | null;
  getVideoId?: () => number | null;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState("");

  if (value != null) {
    return (
      <span className="lc-timestamp-chip">
        <Clock size={12} />
        {formatTimestamp(value.seconds)}
        <button type="button" onClick={() => onChange(null)} aria-label="Remove timestamp">
          <X size={12} />
        </button>
      </span>
    );
  }

  if (manualOpen) {
    const commit = () => {
      const parsed = parseTimestamp(manualText);
      if (parsed != null) onChange({ seconds: parsed, videoId: getVideoId?.() ?? null });
      setManualOpen(false);
      setManualText("");
    };
    return (
      <div className="lc-timestamp-manual">
        <input
          className="lc-timestamp-manual__input"
          placeholder="e.g. 3:24"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { e.preventDefault(); setManualOpen(false); }
          }}
          autoFocus
        />
        <button type="button" className="lc-action" onClick={commit}>Set</button>
        <button type="button" className="lc-action" onClick={() => setManualOpen(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="lc-action"
      onClick={() => {
        const current = getCurrentTime?.();
        if (current != null) onChange({ seconds: Math.floor(current), videoId: getVideoId?.() ?? null });
        else setManualOpen(true);
      }}
    >
      <Clock size={13} /> Add timestamp
    </button>
  );
}

function applyToTree(
  list: LessonComment[],
  id: number,
  patch: Partial<LessonComment>
): LessonComment[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch };
    if (c.replies?.length) return { ...c, replies: applyToTree(c.replies, id, patch) };
    return c;
  });
}

// Appends `reply` under its parent, wherever that parent happens to be in
// the (possibly nested) tree. Returns the original list unchanged if the
// parent isn't loaded on this page — nothing visible to update in that case.
function appendReply(list: LessonComment[], parentId: number, reply: LessonComment): LessonComment[] {
  return list.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length) return { ...c, replies: appendReply(c.replies, parentId, reply) };
    return c;
  });
}

function collectIds(list: LessonComment[], into: Set<number>): void {
  for (const c of list) {
    into.add(c.id);
    if (c.replies?.length) collectIds(c.replies, into);
  }
}

function Avatar({ name, avatar, avatarUrl }: { name: string; avatar?: string | null; avatarUrl?: string | null }) {
  const url = avatarUrl ?? resolveUrl(avatar);
  return (
    <div className="lc-avatar">
      {url ? <img src={url} alt={name} /> : <span>{name.charAt(0).toUpperCase()}</span>}
    </div>
  );
}

interface CommentItemProps {
  comment: LessonComment;
  isReply?: boolean;
  isAuthenticated: boolean;
  onLike: (comment: LessonComment) => void;
  onOpenLogin: () => void;
  onSeek?: (seconds: number, videoId: number | null) => void;
  replyOpenId: number | null;
  setReplyOpenId: (id: number | null) => void;
  replyBody: string;
  setReplyBody: (v: string) => void;
  replyTimestamp: TimestampValue | null;
  setReplyTimestamp: (v: TimestampValue | null) => void;
  getCurrentTime?: () => number | null;
  getVideoId?: () => number | null;
  replySubmitting: boolean;
  onSubmitReply: (parentId: number) => void;
}

function CommentItem({
  comment, isReply, isAuthenticated, onLike, onOpenLogin, onSeek,
  replyOpenId, setReplyOpenId, replyBody, setReplyBody,
  replyTimestamp, setReplyTimestamp, getCurrentTime, getVideoId, replySubmitting, onSubmitReply,
}: CommentItemProps) {
  const name = comment.user?.name ?? "Student";
  const replying = replyOpenId === comment.id;

  return (
    <div id={`lc-comment-${comment.id}`} className={`lc-item${isReply ? " lc-item--reply" : ""}`}>
      <Avatar name={name} avatar={comment.user?.avatar} avatarUrl={comment.user?.avatar_url} />
      <div className="lc-item__body">
        <div className="lc-item__head">
          <span className="lc-item__name">{name}</span>
          <span className="lc-item__date">{timeAgo(comment.created_at)}</span>
          {comment.video_timestamp != null && (
            <button
              type="button"
              className="lc-timestamp-chip lc-timestamp-chip--link"
              onClick={() => onSeek?.(comment.video_timestamp!, comment.video_id ?? null)}
              title="Jump to this moment in the video"
            >
              <Clock size={12} />
              {formatTimestamp(comment.video_timestamp)}
            </button>
          )}
        </div>
        <p className="lc-item__text">{comment.body}</p>
        <div className="lc-item__actions">
          <button
            className={`lc-action${comment.liked_by_me ? " lc-action--liked" : ""}`}
            onClick={() => (isAuthenticated ? onLike(comment) : onOpenLogin())}
          >
            <Heart size={14} fill={comment.liked_by_me ? "currentColor" : "none"} />
            {comment.likes_count > 0 && comment.likes_count}
          </button>
          {!isReply && (
            <button
              className="lc-action"
              onClick={() => (isAuthenticated ? setReplyOpenId(replying ? null : comment.id) : onOpenLogin())}
            >
              Reply
            </button>
          )}
        </div>

        {replying && (
          <form
            className="lc-reply-form"
            onSubmit={(e) => { e.preventDefault(); onSubmitReply(comment.id); }}
          >
            <textarea
              className="lc-reply-form__input"
              rows={2}
              placeholder={`Reply to ${name}...`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              autoFocus
            />
            <div className="lc-reply-form__actions">
              <TimestampControl value={replyTimestamp} onChange={setReplyTimestamp} getCurrentTime={getCurrentTime} getVideoId={getVideoId} />
              <div className="lc-reply-form__buttons">
                <button type="button" className="lc-btn lc-btn--ghost" onClick={() => setReplyOpenId(null)} disabled={replySubmitting}>
                  Cancel
                </button>
                <button type="submit" className="lc-btn" disabled={replySubmitting || !replyBody.trim()}>
                  {replySubmitting ? "Posting..." : "Post reply"}
                </button>
              </div>
            </div>
          </form>
        )}

        {!!comment.replies?.length && (
          <div className="lc-replies">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                isReply
                isAuthenticated={isAuthenticated}
                onLike={onLike}
                onOpenLogin={onOpenLogin}
                onSeek={onSeek}
                replyOpenId={replyOpenId}
                setReplyOpenId={setReplyOpenId}
                replyBody={replyBody}
                setReplyBody={setReplyBody}
                replyTimestamp={replyTimestamp}
                setReplyTimestamp={setReplyTimestamp}
                getCurrentTime={getCurrentTime}
                getVideoId={getVideoId}
                replySubmitting={replySubmitting}
                onSubmitReply={onSubmitReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LessonComments({ lessonId, getCurrentTime, getVideoId, onSeek, highlightCommentId }: {
  lessonId: number;
  getCurrentTime?: () => number | null;
  getVideoId?: () => number | null;
  onSeek?: (seconds: number, videoId: number | null) => void;
  highlightCommentId?: number | null;
}) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const [comments, setComments] = useState<LessonComment[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newBody, setNewBody] = useState("");
  const [newTimestamp, setNewTimestamp] = useState<TimestampValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyTimestamp, setReplyTimestamp] = useState<TimestampValue | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);


  const totalRef = useRef(total);
  const seenIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => { totalRef.current = total; }, [total]);

  const fetchPage = (p: number) => {
    setLoading(true);
    setErrorMsg(null);
    lessonCommentService.getByLesson(lessonId, p)
      .then(({ data }) => {
        const cp = data.data;
        setComments(cp.data);
        setPage(cp.current_page);
        setLastPage(cp.last_page);
        setTotal(cp.total);
        setUnavailable(false);
        collectIds(cp.data, seenIdsRef.current);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) setUnavailable(true);
        else setErrorMsg("Couldn't load comments. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Comments are paginated, so a deep link to one specific thread (e.g. from
  // a "someone replied to your comment" notification) can't just load page 1
  // — it has to find which page that top-level comment actually landed on.
  // Walks forward page by page (bounded by lastPage) until it turns up, then
  // scrolls it into view and gives it a brief highlight.
  const locateAndHighlight = (targetId: number, p = 1) => {
    setLoading(true);
    setErrorMsg(null);
    lessonCommentService.getByLesson(lessonId, p)
      .then(({ data }) => {
        const cp = data.data;
        const found = cp.data.some((c) => c.id === targetId);
        if (!found && p < cp.last_page) {
          locateAndHighlight(targetId, p + 1);
          return;
        }
        setComments(cp.data);
        setPage(cp.current_page);
        setLastPage(cp.last_page);
        setTotal(cp.total);
        setUnavailable(false);
        collectIds(cp.data, seenIdsRef.current);
        setLoading(false);
        if (found) {
          requestAnimationFrame(() => {
            const el = document.getElementById(`lc-comment-${targetId}`);
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("lc-item--highlight");
            setTimeout(() => el.classList.remove("lc-item--highlight"), 2500);
          });
        }
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) setUnavailable(true);
        else setErrorMsg("Couldn't load comments. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    setReplyOpenId(null);
    setNewTimestamp(null);
    setReplyTimestamp(null);
    seenIdsRef.current = new Set();
    if (highlightCommentId != null) locateAndHighlight(highlightCommentId);
    else fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);
  useEffect(() => {
    const echo = getEcho();
    const channel = echo.channel(`lesson.${lessonId}.comments`);

    channel.listen(".comment.posted", (incoming: LessonComment) => {
      if (seenIdsRef.current.has(incoming.id)) return;
      seenIdsRef.current.add(incoming.id);

      if (incoming.parent_id == null) {
        setComments((prev) => [incoming, ...prev]);
        setTotal(totalRef.current + 1);
      } else {
        setComments((prev) => appendReply(prev, incoming.parent_id!, incoming));
      }
    });

    return () => {
      echo.leave(`lesson.${lessonId}.comments`);
    };
  }, [lessonId]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    lessonCommentService.create(lessonId, {
      body: newBody.trim(),
      ...(newTimestamp != null ? {
        video_timestamp: newTimestamp.seconds,
        ...(newTimestamp.videoId != null ? { video_id: newTimestamp.videoId } : {}),
      } : {}),
    })
      .then(({ data }) => {
        const saved: LessonComment = {
          ...data.data,
          user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null, avatar_url: user.avatar_url ?? null } : null),
        };
        seenIdsRef.current.add(saved.id);
        setComments((prev) => [saved, ...prev]);
        setTotal((t) => t + 1);
        setNewBody("");
        setNewTimestamp(null);
      })
      .catch(() => setSubmitError("Failed to post comment. Please try again."))
      .finally(() => setSubmitting(false));
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyBody.trim()) return;
    setReplySubmitting(true);
    lessonCommentService.create(lessonId, {
      body: replyBody.trim(),
      parent_id: parentId,
      ...(replyTimestamp != null ? {
        video_timestamp: replyTimestamp.seconds,
        ...(replyTimestamp.videoId != null ? { video_id: replyTimestamp.videoId } : {}),
      } : {}),
    })
      .then(({ data }) => {
        const saved: LessonComment = {
          ...data.data,
          user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null, avatar_url: user.avatar_url ?? null } : null),
        };
        seenIdsRef.current.add(saved.id);
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), saved] } : c))
        );
        setReplyBody("");
        setReplyTimestamp(null);
        setReplyOpenId(null);
      })
      .catch(() => setErrorMsg("Failed to post reply. Please try again."))
      .finally(() => setReplySubmitting(false));
  };

  const handleLike = (comment: LessonComment) => {
    const liked_by_me = !comment.liked_by_me;
    const likes_count = comment.likes_count + (liked_by_me ? 1 : -1);
    setComments((prev) => applyToTree(prev, comment.id, { liked_by_me, likes_count }));
    lessonCommentService.like(comment.id)
      .then(({ data }) => {
        setComments((prev) => applyToTree(prev, comment.id, data.data));
      })
      .catch(() => {
        setComments((prev) =>
          applyToTree(prev, comment.id, { liked_by_me: comment.liked_by_me, likes_count: comment.likes_count })
        );
      });
  };

  return (
    <section className="lc-wrap">
      <div className="lc-head">
        <MessageCircle size={16} />
        <h3>Discussion{total > 0 ? ` (${total})` : ""}</h3>
      </div>

      {loading ? (
        <p className="lc-empty">Loading comments...</p>
      ) : unavailable ? (
        <p className="lc-empty">Comments aren't available yet for this lesson.</p>
      ) : (
        <>
          {errorMsg && <p className="lc-error">{errorMsg}</p>}

          {comments.length === 0 ? (
            <p className="lc-empty">No comments yet. Start the discussion!</p>
          ) : (
            <div className="lc-list">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  isAuthenticated={isAuthenticated}
                  onLike={handleLike}
                  onOpenLogin={openLogin}
                  onSeek={onSeek}
                  replyOpenId={replyOpenId}
                  setReplyOpenId={setReplyOpenId}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  replyTimestamp={replyTimestamp}
                  setReplyTimestamp={setReplyTimestamp}
                  getCurrentTime={getCurrentTime}
                  getVideoId={getVideoId}
                  replySubmitting={replySubmitting}
                  onSubmitReply={handleSubmitReply}
                />
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="lc-pagination">
              <button disabled={page <= 1} onClick={() => fetchPage(page - 1)}>Previous</button>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === page ? "lc-pagination__page lc-pagination__page--active" : "lc-pagination__page"}
                  onClick={() => fetchPage(p)}
                >
                  {p}
                </button>
              ))}
              <button disabled={page >= lastPage} onClick={() => fetchPage(page + 1)}>Next</button>
            </div>
          )}

          <div className="lc-composer">
            {!isAuthenticated ? (
              <button className="lc-btn" onClick={openLogin}>Log in to join the discussion</button>
            ) : (
              <form onSubmit={handleSubmitComment} className="lc-composer__form">
                <Avatar name={user?.name ?? "You"} avatar={user?.avatar} avatarUrl={user?.avatar_url} />
                <div className="lc-composer__input-wrap">
                  <textarea
                    className="lc-composer__input"
                    rows={2}
                    placeholder="Write a comment..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                  />
                  {submitError && <p className="lc-error">{submitError}</p>}
                  <div className="lc-composer__actions">
                    <TimestampControl value={newTimestamp} onChange={setNewTimestamp} getCurrentTime={getCurrentTime} getVideoId={getVideoId} />
                    <button type="submit" className="lc-btn" disabled={submitting || !newBody.trim()}>
                      {submitting ? "Posting..." : "Post comment"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </section>
  );
}
