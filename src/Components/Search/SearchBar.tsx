import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { searchService, type SearchResults } from "../../services/searchService";
import "./SearchBar.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function resolveImg(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type FlatItem =
  | { kind: "course";      index: number }
  | { kind: "instructor";  index: number }
  | { kind: "category";    index: number };

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeFlat, setActiveFlat] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounce(query.trim(), 300);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch — cleanup flag prevents a slow earlier response from overwriting
  // a faster later one when the user types quickly across two debounce windows.
  useEffect(() => {
    if (debouncedQ.length < 2) {
      setResults(null);
      setOpen(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setOpen(true);
    searchService.search(debouncedQ, "all", 6)
      .then(res => {
        if (cancelled) return;
        setResults(res.data.data);
        setActiveFlat(-1);
      })
      .catch(() => { if (!cancelled) setResults(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ]);

  // Build flat list for keyboard nav
  const flatItems = useCallback((): FlatItem[] => {
    if (!results) return [];
    const items: FlatItem[] = [];
    results.courses.forEach((_, i)     => items.push({ kind: "course",     index: i }));
    results.instructors.forEach((_, i) => items.push({ kind: "instructor", index: i }));
    results.categories.forEach((_, i)  => items.push({ kind: "category",   index: i }));
    return items;
  }, [results]);

  const navigate_to = useCallback((item: FlatItem) => {
    if (!results) return;
    setOpen(false);
    setQuery("");
    if (item.kind === "course") {
      const c = results.courses[item.index];
      navigate(`/courses/${c.slug}`);
    } else if (item.kind === "instructor") {
      navigate(`/courses?q=${encodeURIComponent(query)}`);
    } else {
      const cat = results.categories[item.index];
      navigate(`/courses?category=${cat.slug}`);
    }
  }, [results, navigate, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const flat = flatItems();
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!open || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveFlat(p => Math.min(p + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveFlat(p => Math.max(p - 1, 0));
    } else if (e.key === "Enter" && activeFlat >= 0) {
      e.preventDefault();
      navigate_to(flat[activeFlat]);
    }
  };

  const clear = () => {
    setQuery("");
    setResults(null);
    setOpen(false);
    // Focus after the state commit so onFocus doesn't re-open with stale state
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Flat index for a given item kind+index
  const flatIndex = (kind: FlatItem["kind"], idx: number) => {
    const flat = flatItems();
    return flat.findIndex(f => f.kind === kind && f.index === idx);
  };

  const hasResults = results && (
    results.courses.length > 0 || results.instructors.length > 0 || results.categories.length > 0
  );

  return (
    <div className="sb-wrap" ref={wrapRef}>
      <div className={`sb-field${open ? " sb-field--open" : ""}`}>
        <Search size={15} className="sb-icon" />
        <input
          ref={inputRef}
          className="sb-input"
          type="text"
          placeholder="Search courses, topics…"
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value.trim().length >= 2) setOpen(true); }}
          onFocus={() => { if (results && query.trim().length >= 2) setOpen(true); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button className="sb-clear" onClick={clear} aria-label="Clear search" tabIndex={-1}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="sb-dropdown">
          {loading && (
            <div className="sb-loading">
              {[1,2,3].map(i => (
                <div key={i} className="sb-skel">
                  <div className="sb-skel__thumb" />
                  <div className="sb-skel__lines">
                    <div className="sb-skel__line sb-skel__line--lg" />
                    <div className="sb-skel__line sb-skel__line--sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !hasResults && results && (
            <div className="sb-empty">
              No results for <strong>"{results.query}"</strong>
            </div>
          )}

          {!loading && hasResults && (
            <>
              {results!.courses.length > 0 && (
                <div className="sb-group">
                  <div className="sb-group__label">Courses</div>
                  {results!.courses.map((c, i) => {
                    const fi = flatIndex("course", i);
                    const thumb = resolveImg(c.thumbnail);
                    return (
                      <button
                        key={c.id}
                        className={`sb-item${activeFlat === fi ? " sb-item--active" : ""}`}
                        onMouseEnter={() => setActiveFlat(fi)}
                        onClick={() => navigate_to({ kind: "course", index: i })}
                      >
                        <div className="sb-item__thumb">
                          {thumb
                            ? <img src={thumb} alt={c.title} />
                            : <span className="sb-item__thumb-icon">📚</span>
                          }
                        </div>
                        <div className="sb-item__body">
                          <span className="sb-item__title">{c.title}</span>
                          <span className="sb-item__sub">{c.instructor.name} · {c.category.name}</span>
                        </div>
                        {c.price > 0
                          ? <span className="sb-item__badge sb-item__badge--price">${c.price}</span>
                          : <span className="sb-item__badge sb-item__badge--free">Free</span>
                        }
                      </button>
                    );
                  })}
                </div>
              )}

              {results!.instructors.length > 0 && (
                <div className="sb-group">
                  <div className="sb-group__label">Instructors</div>
                  {results!.instructors.map((ins, i) => {
                    const fi = flatIndex("instructor", i);
                    const avatar = resolveImg(ins.avatar);
                    return (
                      <button
                        key={ins.id}
                        className={`sb-item${activeFlat === fi ? " sb-item--active" : ""}`}
                        onMouseEnter={() => setActiveFlat(fi)}
                        onClick={() => navigate_to({ kind: "instructor", index: i })}
                      >
                        <div className="sb-item__thumb sb-item__thumb--round">
                          {avatar
                            ? <img src={avatar} alt={ins.name} />
                            : <span className="sb-item__thumb-initial">{ins.name.charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div className="sb-item__body">
                          <span className="sb-item__title">{ins.name}</span>
                          <span className="sb-item__sub">{ins.courses} course{ins.courses !== 1 ? "s" : ""}</span>
                        </div>
                        <span className="sb-item__badge sb-item__badge--instructor">Instructor</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {results!.categories.length > 0 && (
                <div className="sb-group">
                  <div className="sb-group__label">Categories</div>
                  {results!.categories.map((cat, i) => {
                    const fi = flatIndex("category", i);
                    return (
                      <button
                        key={cat.id}
                        className={`sb-item${activeFlat === fi ? " sb-item--active" : ""}`}
                        onMouseEnter={() => setActiveFlat(fi)}
                        onClick={() => navigate_to({ kind: "category", index: i })}
                      >
                        <div className="sb-item__thumb sb-item__thumb--icon">
                          <span>{cat.icon ?? "🗂️"}</span>
                        </div>
                        <div className="sb-item__body">
                          <span className="sb-item__title">{cat.name}</span>
                          <span className="sb-item__sub">{cat.courses} course{cat.courses !== 1 ? "s" : ""}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="sb-footer">
                <button className="sb-footer__all" onClick={() => { navigate(`/courses?q=${encodeURIComponent(query)}`); setOpen(false); setQuery(""); }}>
                  See all results for <strong>"{query}"</strong>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
