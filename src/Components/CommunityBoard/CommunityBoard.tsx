import { useEffect, useRef, useState } from "react";
import { Flag, Heart, MessageCircle, Trash2 } from "lucide-react";
import { communityService, type CommunityPost } from "../../services/communityService";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { getEcho } from "../../utils/echo";
import { resolveUrl, timeAgo } from "../../utils/format";
import "./CommunityBoard.css";

function applyToTree(
  list: CommunityPost[],
  id: number,
  patch: Partial<CommunityPost>
): CommunityPost[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch };
    if (c.replies?.length) return { ...c, replies: applyToTree(c.replies, id, patch) };
    return c;
  });
}

function appendReply(list: CommunityPost[], parentId: number, reply: CommunityPost): CommunityPost[] {
  return list.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length) return { ...c, replies: appendReply(c.replies, parentId, reply) };
    return c;
  });
}

// Removes a post by id wherever it happens to be in the tree
function removeFromTree(list: CommunityPost[], id: number): CommunityPost[] {
  return list
    .filter((c) => c.id !== id)
    .map((c) => (c.replies?.length ? { ...c, replies: removeFromTree(c.replies, id) } : c));
}

function collectIds(list: CommunityPost[], into: Set<number>): void {
  for (const c of list) {
    into.add(c.id);
    if (c.replies?.length) collectIds(c.replies, into);
  }
}

function Avatar({ name, avatar, avatarUrl }: { name: string; avatar?: string | null; avatarUrl?: string | null }) {
  const url = avatarUrl ?? resolveUrl(avatar);
  return (
    <div className="cb-avatar">
      {url ? <img src={url} alt={name} /> : <span>{name.charAt(0).toUpperCase()}</span>}
    </div>
  );
}

interface PostItemProps {
  post: CommunityPost;
  isReply?: boolean;
  isAuthenticated: boolean;
  currentUserId?: number;
  onLike: (post: CommunityPost) => void;
  onDelete: (post: CommunityPost) => void;
  onOpenLogin: () => void;
  replyOpenId: number | null;
  setReplyOpenId: (id: number | null) => void;
  replyBody: string;
  setReplyBody: (v: string) => void;
  replySubmitting: boolean;
  onSubmitReply: (parentId: number) => void;
  reportOpenId: number | null;
  setReportOpenId: (id: number | null) => void;
  reportReason: string;
  setReportReason: (v: string) => void;
  reportSubmitting: boolean;
  onSubmitReport: (postId: number) => void;
}

function PostItem({
  post, isReply, isAuthenticated, currentUserId, onLike, onDelete, onOpenLogin,
  replyOpenId, setReplyOpenId, replyBody, setReplyBody, replySubmitting, onSubmitReply,
  reportOpenId, setReportOpenId, reportReason, setReportReason, reportSubmitting, onSubmitReport,
}: PostItemProps) {
  const name = post.user?.name ?? "Member";
  const replying = replyOpenId === post.id;
  const reporting = reportOpenId === post.id;
  const isOwn = currentUserId != null && post.user_id === currentUserId;

  return (
    <div className={`cb-item${isReply ? " cb-item--reply" : ""}`}>
      <Avatar name={name} avatar={post.user?.avatar} avatarUrl={post.user?.avatar_url} />
      <div className="cb-item__body">
        <div className="cb-item__head">
          <span className="cb-item__name">{name}</span>
          <span className="cb-item__date">{timeAgo(post.created_at)}</span>
        </div>
        <p className="cb-item__text">{post.body}</p>
        <div className="cb-item__actions">
          <button
            className={`cb-action${post.liked_by_me ? " cb-action--liked" : ""}`}
            onClick={() => (isAuthenticated ? onLike(post) : onOpenLogin())}
          >
            <Heart size={14} fill={post.liked_by_me ? "currentColor" : "none"} />
            {post.likes_count > 0 && post.likes_count}
          </button>
          {!isReply && (
            <button
              className="cb-action"
              onClick={() => (isAuthenticated ? setReplyOpenId(replying ? null : post.id) : onOpenLogin())}
            >
              Reply
            </button>
          )}
          {isOwn ? (
            <button className="cb-action cb-action--danger" onClick={() => onDelete(post)}>
              <Trash2 size={13} /> Delete
            </button>
          ) : (
            isAuthenticated && (
              post.reported_by_me ? (
                <span className="cb-action cb-action--disabled">Reported</span>
              ) : (
                <button className="cb-action" onClick={() => setReportOpenId(reporting ? null : post.id)}>
                  <Flag size={13} /> Report
                </button>
              )
            )
          )}
        </div>

        {reporting && (
          <form
            className="cb-report-form"
            onSubmit={(e) => { e.preventDefault(); onSubmitReport(post.id); }}
          >
            <input
              className="cb-report-form__input"
              placeholder="Why are you reporting this? (optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              maxLength={500}
              autoFocus
            />
            <div className="cb-report-form__buttons">
              <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setReportOpenId(null)} disabled={reportSubmitting}>
                Cancel
              </button>
              <button type="submit" className="cb-btn" disabled={reportSubmitting}>
                {reportSubmitting ? "Reporting..." : "Submit report"}
              </button>
            </div>
          </form>
        )}

        {replying && (
          <form
            className="cb-reply-form"
            onSubmit={(e) => { e.preventDefault(); onSubmitReply(post.id); }}
          >
            <textarea
              className="cb-reply-form__input"
              rows={2}
              placeholder={`Reply to ${name}...`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              autoFocus
            />
            <div className="cb-reply-form__actions">
              <div className="cb-reply-form__buttons">
                <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setReplyOpenId(null)} disabled={replySubmitting}>
                  Cancel
                </button>
                <button type="submit" className="cb-btn" disabled={replySubmitting || !replyBody.trim()}>
                  {replySubmitting ? "Posting..." : "Post reply"}
                </button>
              </div>
            </div>
          </form>
        )}

        {!!post.replies?.length && (
          <div className="cb-replies">
            {post.replies.map((r) => (
              <PostItem
                key={r.id}
                post={r}
                isReply
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                onLike={onLike}
                onDelete={onDelete}
                onOpenLogin={onOpenLogin}
                replyOpenId={replyOpenId}
                setReplyOpenId={setReplyOpenId}
                replyBody={replyBody}
                setReplyBody={setReplyBody}
                replySubmitting={replySubmitting}
                onSubmitReply={onSubmitReply}
                reportOpenId={reportOpenId}
                setReportOpenId={setReportOpenId}
                reportReason={reportReason}
                setReportReason={setReportReason}
                reportSubmitting={reportSubmitting}
                onSubmitReport={onSubmitReport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityBoard() {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [reportOpenId, setReportOpenId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const totalRef = useRef(total);
  const seenIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => { totalRef.current = total; }, [total]);

  const fetchPage = (p: number) => {
    setLoading(true);
    setErrorMsg(null);
    communityService.getAll(p)
      .then(({ data }) => {
        const cp = data.data;
        setPosts(cp.data);
        setPage(cp.current_page);
        setLastPage(cp.last_page);
        setTotal(cp.total);
        collectIds(cp.data, seenIdsRef.current);
      })
      .catch(() => setErrorMsg("Couldn't load the community. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const echo = getEcho();
    const channel = echo.private("community.posts");

    channel.listen(".post.posted", (incoming: CommunityPost) => {
      if (seenIdsRef.current.has(incoming.id)) return;
      seenIdsRef.current.add(incoming.id);

      if (incoming.parent_id == null) {
        setPosts((prev) => [incoming, ...prev]);
        setTotal(totalRef.current + 1);
      } else {
        setPosts((prev) => appendReply(prev, incoming.parent_id!, incoming));
      }
    });

    channel.listen(".post.deleted", ({ id }: { id: number; parent_id: number | null }) => {
      seenIdsRef.current.delete(id);
      setPosts((prev) => removeFromTree(prev, id));
    });

    return () => {
      echo.leave("community.posts");
    };
  }, [isAuthenticated]);

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    communityService.create({ body: newBody.trim() })
      .then(({ data }) => {
        const saved: CommunityPost = {
          ...data.data,
          user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null, avatar_url: user.avatar_url ?? null } : null),
        };
        seenIdsRef.current.add(saved.id);
        setPosts((prev) => [saved, ...prev]);
        setTotal((t) => t + 1);
        setNewBody("");
      })
      .catch(() => setSubmitError("Failed to post. Please try again."))
      .finally(() => setSubmitting(false));
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyBody.trim()) return;
    setReplySubmitting(true);
    communityService.create({ body: replyBody.trim(), parent_id: parentId })
      .then(({ data }) => {
        const saved: CommunityPost = {
          ...data.data,
          user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null, avatar_url: user.avatar_url ?? null } : null),
        };
        seenIdsRef.current.add(saved.id);
        setPosts((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), saved] } : c))
        );
        setReplyBody("");
        setReplyOpenId(null);
      })
      .catch(() => setErrorMsg("Failed to post reply. Please try again."))
      .finally(() => setReplySubmitting(false));
  };

  const handleLike = (post: CommunityPost) => {
    const liked_by_me = !post.liked_by_me;
    const likes_count = post.likes_count + (liked_by_me ? 1 : -1);
    setPosts((prev) => applyToTree(prev, post.id, { liked_by_me, likes_count }));
    communityService.like(post.id)
      .then(({ data }) => {
        setPosts((prev) => applyToTree(prev, post.id, data.data));
      })
      .catch(() => {
        setPosts((prev) =>
          applyToTree(prev, post.id, { liked_by_me: post.liked_by_me, likes_count: post.likes_count })
        );
      });
  };

  const handleDelete = (post: CommunityPost) => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    const previous = posts;
    seenIdsRef.current.delete(post.id);
    setPosts((prev) => removeFromTree(prev, post.id));
    communityService.remove(post.id).catch(() => {
      setPosts(previous);
      setErrorMsg("Failed to delete the post. Please try again.");
    });
  };

  const handleSubmitReport = (postId: number) => {
    setReportSubmitting(true);
    communityService.report(postId, reportReason.trim() || undefined)
      .then(() => {
        setPosts((prev) => applyToTree(prev, postId, { reported_by_me: true }));
        setReportOpenId(null);
        setReportReason("");
      })
      .catch(() => setErrorMsg("Failed to submit the report. Please try again."))
      .finally(() => setReportSubmitting(false));
  };

  return (
    <section className="cb-wrap">
      <div className="cb-head">
        <MessageCircle size={16} />
        <h3>Community{total > 0 ? ` (${total})` : ""}</h3>
      </div>

      {loading ? (
        <p className="cb-empty">Loading community...</p>
      ) : (
        <>
          {errorMsg && <p className="cb-error">{errorMsg}</p>}

          {posts.length === 0 ? (
            <p className="cb-empty">No posts yet. Start the conversation!</p>
          ) : (
            <div className="cb-list">
              {posts.map((p) => (
                <PostItem
                  key={p.id}
                  post={p}
                  isAuthenticated={isAuthenticated}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onOpenLogin={openLogin}
                  replyOpenId={replyOpenId}
                  setReplyOpenId={setReplyOpenId}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  replySubmitting={replySubmitting}
                  onSubmitReply={handleSubmitReply}
                  reportOpenId={reportOpenId}
                  setReportOpenId={setReportOpenId}
                  reportReason={reportReason}
                  setReportReason={setReportReason}
                  reportSubmitting={reportSubmitting}
                  onSubmitReport={handleSubmitReport}
                />
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="cb-pagination">
              <button disabled={page <= 1} onClick={() => fetchPage(page - 1)}>Previous</button>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === page ? "cb-pagination__page cb-pagination__page--active" : "cb-pagination__page"}
                  onClick={() => fetchPage(p)}
                >
                  {p}
                </button>
              ))}
              <button disabled={page >= lastPage} onClick={() => fetchPage(page + 1)}>Next</button>
            </div>
          )}

          <div className="cb-composer">
            {!isAuthenticated ? (
              <button className="cb-btn" onClick={openLogin}>Log in to join the community</button>
            ) : (
              <form onSubmit={handleSubmitPost} className="cb-composer__form">
                <Avatar name={user?.name ?? "You"} avatar={user?.avatar} avatarUrl={user?.avatar_url} />
                <div className="cb-composer__input-wrap">
                  <textarea
                    className="cb-composer__input"
                    rows={2}
                    placeholder="Ask a question or start a discussion..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                  />
                  {submitError && <p className="cb-error">{submitError}</p>}
                  <div className="cb-composer__actions">
                    <button type="submit" className="cb-btn" disabled={submitting || !newBody.trim()}>
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
