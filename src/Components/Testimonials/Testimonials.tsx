import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../../utils/anim";
import { reviewService, type Review } from "../../services/reviewService";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function resolveAvatar(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-600 dark:text-slate-600"}`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ r }: { r: Review }) {
  const [imgErr, setImgErr] = useState(false);
  const name = r.user?.name ?? "Student";
  const src = r.user?.avatar_url ?? resolveAvatar(r.user?.avatar);
  const hasImg = !!src && !imgErr;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <Quote className="h-6 w-6 text-blue-200 dark:text-blue-500/30" />
      <StarRow rating={r.rating} />
      {r.title && <p className="mt-3 font-display text-[15px] font-bold ink">{r.title}</p>}
      {r.comment && <p className="mt-2 line-clamp-4 flex-1 text-[13.5px] leading-relaxed muted2">{r.comment}</p>}

      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
        {hasImg ? (
          <img
            src={src!}
            alt={name}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full grad-blue text-[13px] font-bold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold ink">{name}</p>
          {r.course && (
            <Link
              to={`/courses/${r.course.slug}`}
              className="truncate text-[12px] muted2 hover:text-blue-600 hover:underline"
            >
              {r.course.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <div className="skeleton h-6 w-6 rounded" />
      <div className="skeleton skeleton-line skeleton-line--sm mt-4" />
      <div className="skeleton skeleton-line skeleton-line--lg mt-3" />
      <div className="skeleton skeleton-line skeleton-line--md mt-2" />
      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
        <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton skeleton-line skeleton-line--sm" />
          <div className="skeleton skeleton-line skeleton-line--sm" />
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    reviewService.getFeatured(6)
      .then((res) => setReviews(res.data.data))
      .catch(() => setReviews([]));
  }, []);

  const loading = reviews === null;
  if (!loading && reviews.length === 0) return null;

  return (
    <section className="bg-white py-20 dark:bg-slate-900 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="mb-2 text-sm font-semibold brand-blue">Testimonials</p>
          <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
            What our students say
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Reveal key={i} delay={i * 80}>
                  <SkeletonCard />
                </Reveal>
              ))
            : reviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 80}>
                  <TestimonialCard r={r} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
