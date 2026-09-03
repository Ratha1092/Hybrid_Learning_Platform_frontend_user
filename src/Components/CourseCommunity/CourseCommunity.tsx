import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { courseDiscussionService, type CourseDiscussion } from "../../services/courseDiscussionService";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { getEcho } from "../../utils/echo";
import { resolveUrl, timeAgo } from "../../utils/format";
import "./CourseCommunity.css";

function applyToTree(
  list: CourseDiscussion[],
  id: number,
  patch: Partial<CourseDiscussion>
): CourseDiscussion[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch };
    if (c.replies?.length) return { ...c, replies: applyToTree(c.replies, id, patch) };
    return c;
  });
}
function appendReply(list: CourseDiscussion[], parentId: number, reply: CourseDiscussion): CourseDiscussion[] {
  return list.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length) return { ...c, replies: appendReply(c.replies, parentId, reply) };
    return c;
  });
}

function collectIds(list: CourseDiscussion[], into: Set<number>): void {
  for (const c of list) {
    into.add(c.id);
    if (c.replies?.length) collectIds(c.replies, into);
  }
}

function Avatar({ name, avatar, avatarUrl }: { name: string; avatar?: string | null; avatarUrl?: string | null }) {
  const url = avatarUrl ?? resolveUrl(avatar);
  return (
    <div className="cc-avatar">
      {url ? <img src={url} alt={name} /> : <span>{name.charAt(0).toUpperCase()}</span>}
    </div>
  );
}

interface DiscussionItemProps {
  discussion: CourseDiscussion;
  isReply?: boolean;
  isAuthenticated: boolean;
  onLike: (discussion: CourseDiscussion) => void;
  onOpenLogin: () => void;
  replyOpenId: number | null;
  setReplyOpenId: (id: number | null) => void;
  replyBody: string;
  setReplyBody: (v: string) => void;
  replySubmitting: boolean;
  onSubmitReply: (parentId: number) => void;
}

function DiscussionItem({
  discussion, isReply, isAuthenticated, onLike, onOpenLogin,
  replyOpenId, setReplyOpenId, replyBody, setReplyBody, replySubmitting, onSubmitReply,
}: DiscussionItemProps) {
  const name = discussion.user?.name ?? "Student";
  const replying = replyOpenId === discussion.id;

  return (
    <div className={`cc-item${isReply ? " cc-item--reply" : ""}`}>
      <Avatar name={name} avatar={discussion.user?.avatar} avatarUrl={discussion.user?.avatar_url} />
      <div className="cc-item__body">
        <div className="cc-item__head">
          <span className="cc-item__name">{name}</span>
          {discussion.is_instructor && <span className="cc-badge">Instructor</span>}
          <span className="cc-item__date">{timeAgo(discussion.created_at)}</span>
        </div>
        <p className="cc-item__text">{discussion.body}</p>
        <div className="cc-item__actions">
          <button
            className={`cc-action${discussion.liked_by_me ? " cc-action--liked" : ""}`}
            onClick={() => (isAuthenticated ? onLike(discussion) : onOpenLogin())}
          >
            <Heart size={14} fill={discussion.liked_by_me ? "currentColor" : "none"} />
            {discussion.likes_count > 0 && discussion.likes_count}
          </button>
          {!isReply && (
            <button
              className="cc-action"
              onClick={() => (isAuthenticated ? setReplyOpenId(replying ? null : discussion.id) : onOpenLogin())}
            >
              Reply
            </button>
          )}
        </div>

        {replying && (
          <form
            className="cc-reply-form"
            onSubmit={(e) => { e.preventDefault(); onSubmitReply(discussion.id); }}
          >
            <textarea
              className="cc-reply-form__input"
              rows={2}
              placeholder={`Reply to ${name}...`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              autoFocus
            />
            <div className="cc-reply-form__actions">
              <div className="cc-reply-form__buttons">
                <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setReplyOpenId(null)} disabled={replySubmitting}>
                  Cancel
                </button>
                <button type="submit" className="cc-btn" disabled={replySubmitting || !replyBody.trim()}>
                  {replySubmitting ? "Posting..." : "Post reply"}
                </button>
              </div>
            </div>
          </form>
        )}

        {!!discussion.replies?.length && (
          <div className="cc-replies">
            {discussion.replies.map((r) => (
              <DiscussionItem
                key={r.id}
                discussion={r}
                isReply
                isAuthenticated={isAuthenticated}
                onLike={onLike}
                onOpenLogin={onOpenLogin}
                replyOpenId={replyOpenId}
                setReplyOpenId={setReplyOpenId}
                replyBody={replyBody}
                setReplyBody={setReplyBody}
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

export default function CourseCommunity({ courseId }: { courseId: number }) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const [discussions, setDiscussions] = useState<CourseDiscussion[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const totalRef = useRef(total);
  const seenIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => { totalRef.current = total; }, [total]);

  const fetchPage = (p: number) => {
    setLoading(true);
    setErrorMsg(null);
    courseDiscussionService.getByCourse(courseId, p)
      .then(({ data }) => {
        const dp = data.data;
        setDiscussions(dp.data);
        setPage(dp.current_page);
        setLastPage(dp.last_page);
        setTotal(dp.total);
        setUnavailable(false);
        collectIds(dp.data, seenIdsRef.current);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 403 || status === 404) setUnavailable(true);
        else setErrorMsg("Couldn't load the community. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setReplyOpenId(null);
    seenIdsRef.current = new Set();
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    const echo = getEcho();
    const channel = echo.private(`course.${courseId}.discussion`);

    channel.listen(".discussion.posted", (incoming: CourseDiscussion) => {
      if (seenIdsRef.current.has(incoming.id)) return;
      seenIdsRef.current.add(incoming.id);

      if (incoming.parent_id == null) {
        setDiscussions((prev) => [incoming, ...prev]);
        setTotal(totalRef.current + 1);
      } else {
        setDiscussions((prev) => appendReply(prev, incoming.parent_id!, incoming));
      }
    });

    return () => {
      echo.leave(`course.${courseId}.discussion`);
    };
  }, [courseId]);

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    courseDiscussionService.create(courseId, { body: newBody.trim() })
      .then(({ data }) => {
        const saved: CourseDiscussion = {
          ...data.data,
          user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null, avatar_url: user.avatar_url ?? null } : null),
        };
        seenIdsRef.current.add(saved.id);
        setDiscussions((prev) => [saved, ...prev]);
        setTotal((t) => t + 1);
        setNewBody("");
      })
      .catch(() => setSubmitError("Failed to post. Please try again."))
      .finally(() => setSubmitting(false));
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyBody.trim()) return;
    setReplySubmitting(true);
    courseDiscussionService.create(courseId, { body: replyBody.trim(), parent_id: parentId })
      .then(({ data }) => {
        const saved: CourseDiscussion = {
          ...data.data,
          user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null, avatar_url: user.avatar_url ?? null } : null),
        };
        seenIdsRef.current.add(saved.id);
        setDiscussions((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), saved] } : c))
        );
        setReplyBody("");
        setReplyOpenId(null);
      })
      .catch(() => setErrorMsg("Failed to post reply. Please try again."))
      .finally(() => setReplySubmitting(false));
  };

  const handleLike = (discussion: CourseDiscussion) => {
    const liked_by_me = !discussion.liked_by_me;
    const likes_count = discussion.likes_count + (liked_by_me ? 1 : -1);
    setDiscussions((prev) => applyToTree(prev, discussion.id, { liked_by_me, likes_count }));
    courseDiscussionService.like(discussion.id)
      .then(({ data }) => {
        setDiscussions((prev) => applyToTree(prev, discussion.id, data.data));
      })
      .catch(() => {
        setDiscussions((prev) =>
          applyToTree(prev, discussion.id, { liked_by_me: discussion.liked_by_me, likes_count: discussion.likes_count })
        );
      });
  };

  return (
    <section className="cc-wrap">
      <div className="cc-head">
        <MessageCircle size={16} />
        <h3>Community{total > 0 ? ` (${total})` : ""}</h3>
      </div>

      {loading ? (
        <p className="cc-empty">Loading community...</p>
      ) : unavailable ? (
        <p className="cc-empty">The community isn't available for this course.</p>
      ) : (
        <>
          {errorMsg && <p className="cc-error">{errorMsg}</p>}

          {discussions.length === 0 ? (
            <p className="cc-empty">No posts yet. Start the conversation!</p>
          ) : (
            <div className="cc-list">
              {discussions.map((d) => (
                <DiscussionItem
                  key={d.id}
                  discussion={d}
                  isAuthenticated={isAuthenticated}
                  onLike={handleLike}
                  onOpenLogin={openLogin}
                  replyOpenId={replyOpenId}
                  setReplyOpenId={setReplyOpenId}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  replySubmitting={replySubmitting}
                  onSubmitReply={handleSubmitReply}
                />
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="cc-pagination">
              <button disabled={page <= 1} onClick={() => fetchPage(page - 1)}>Previous</button>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === page ? "cc-pagination__page cc-pagination__page--active" : "cc-pagination__page"}
                  onClick={() => fetchPage(p)}
                >
                  {p}
                </button>
              ))}
              <button disabled={page >= lastPage} onClick={() => fetchPage(page + 1)}>Next</button>
            </div>
          )}

          <div className="cc-composer">
            {!isAuthenticated ? (
              <button className="cc-btn" onClick={openLogin}>Log in to join the community</button>
            ) : (
              <form onSubmit={handleSubmitPost} className="cc-composer__form">
                <Avatar name={user?.name ?? "You"} avatar={user?.avatar} avatarUrl={user?.avatar_url} />
                <div className="cc-composer__input-wrap">
                  <textarea
                    className="cc-composer__input"
                    rows={2}
                    placeholder="Ask a question or start a discussion..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                  />
                  {submitError && <p className="cc-error">{submitError}</p>}
                  <div className="cc-composer__actions">
                    <button type="submit" className="cc-btn" disabled={submitting || !newBody.trim()}>
                      {submitting ? "Posting..." : "Post"}
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
