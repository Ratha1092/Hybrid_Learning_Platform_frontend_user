import './Categories.css'
import { useEffect, useState } from 'react'
import { ChevronRight, BookOpen, Code2, PenTool, FlaskConical, Camera, DollarSign, Video, Award, TrendingUp, Users, MessageSquare } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { categoryService, type Category } from '../../services/categoryService'

const ICON_MAP: Record<string, React.ElementType> = {
  programming: Code2, code: Code2, development: Code2,
  design: PenTool, art: PenTool, ui: PenTool,
  science: FlaskConical, math: FlaskConical,
  photography: Camera, photo: Camera,
  business: DollarSign, finance: DollarSign,
  marketing: TrendingUp, video: Video, film: Video,
  music: Award, personal: Users, language: MessageSquare,
  default: BookOpen,
}

function getIcon(category: Category): React.ElementType {
  const key = (category.slug + ' ' + category.name).toLowerCase()
  for (const [keyword, Icon] of Object.entries(ICON_MAP)) {
    if (key.includes(keyword)) return Icon
  }
  return ICON_MAP.default
}

function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isOnCategoriesPage = location.pathname === '/categories'

  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleCategoryClick(category: Category) {
    navigate(`/courses?category=${category.slug}`)
  }

  if (loading) return (
    <section className="section categories-section">
      <div className="container">
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>Loading categories…</p>
      </div>
    </section>
  )

  if (error) return (
    <section className="section categories-section">
      <div className="container">
        <p style={{ color: '#dc2626', textAlign: 'center', padding: '3rem' }}>Failed: {error}</p>
      </div>
    </section>
  )

  return (
    <section className="section categories-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Top Categories</h2>
            <p className="section-sub">Explore our Popular Categories</p>
          </div>
          {!isOnCategoriesPage && (
            <button className="btn btn-outline" onClick={() => navigate('/categories')}>
              All Categories <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="categories-grid">
          {categories.map((category) => {
            const Icon = getIcon(category)
            return (
              <div
                className="category-card"
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                style={{ cursor: 'pointer' }}
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
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Categories