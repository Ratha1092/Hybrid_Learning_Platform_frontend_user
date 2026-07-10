import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Code2, PenTool, FlaskConical, Camera, DollarSign, Video, Award, TrendingUp, Users, MessageSquare } from "lucide-react";
import { categoryService, type Category } from "../../services/categoryService";
import "./Categories.css";
import "./PageCategories.css";

const ICON_MAP: Record<string, React.ElementType> = {
  programming: Code2, code: Code2, development: Code2,
  design: PenTool, art: PenTool, ui: PenTool,
  science: FlaskConical, math: FlaskConical,
  photography: Camera, photo: Camera,
  business: DollarSign, finance: DollarSign,
  marketing: TrendingUp, video: Video, film: Video,
  music: Award, personal: Users, language: MessageSquare,
  default: BookOpen,
};

function getIcon(category: Category): React.ElementType {
  const key = (category.slug + " " + category.name).toLowerCase();
  for (const [keyword, Icon] of Object.entries(ICON_MAP)) {
    if (key.includes(keyword)) return Icon;
  }
  return ICON_MAP.default;
}

export default function PageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    categoryService
      .getAll()
      .then(({ data }) => setCategories(data.data ?? []))
      .catch(() => setError("Failed to load categories. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Page hero */}
      <div className="pc-hero">
        <div className="container">
          <h1 className="pc-title">All Categories</h1>
          <p className="pc-subtitle">Browse every subject area — find your next skill.</p>
        </div>
      </div>

      {/* Content */}
      <section className="pc-body">
        <div className="container">
          {loading && (
            <div className="pc-state">
              <div className="pc-spinner" />
              <p>Loading categories…</p>
            </div>
          )}

          {!loading && error && (
            <div className="pc-state pc-state--error">
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => { setError(null); setLoading(true); categoryService.getAll().then(({ data }) => setCategories(data.data ?? [])).catch(() => setError("Failed to load categories. Please try again.")).finally(() => setLoading(false)); }}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="pc-state">
              <p>No categories found.</p>
            </div>
          )}

          {!loading && !error && categories.length > 0 && (
            <>
              <p className="pc-count">{categories.length} categories available</p>
              <div className="categories-grid">
                {categories.map((category) => {
                  const Icon = getIcon(category);
                  return (
                    <div
                      key={category.id}
                      className="category-card"
                      onClick={() => navigate(`/courses?category=${category.slug}`)}
                    >
                      <div className="cat-icon-wrap">
                        {category.image_url
                          ? <img src={category.image_url} alt={category.name} className="cat-icon-img" />
                          : <Icon size={30} />
                        }
                      </div>
                      <div className="cat-body">
                        <div className="cat-label">{category.name}</div>
                        <div className="cat-count">{category.courses_count} Courses</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

    </>
  );
}
