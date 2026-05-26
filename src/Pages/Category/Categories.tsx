// src/components/Categories.tsx

import { useEffect, useState } from 'react'
import { ChevronRight, BookOpen, Code2, PenTool, FlaskConical, Camera, DollarSign, Video, Award, TrendingUp, Users, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'   // ← add this

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  sort_order: number
  courses_count: number
}

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
  const navigate = useNavigate()   // ← add this

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/categories', {
      headers: { Accept: 'application/json' },
    })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then((json) => setCategories(json.data ?? json))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── click handler ──────────────────────────────────────────────
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
          <button className="btn btn-outline" onClick={() => navigate('/courses')}>
            All Categories <ChevronRight size={16} />
          </button>
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
                  <Icon size={22} />
                </div>
                <div className="cat-body">
                  <div className="cat-label">{category.name}</div>
                  {/* <div className="cat-count">{category.courses_count} Courses</div> */}
                  <div className="cat-count">{category.courses_count} Courses</div>

                </div>
                <ChevronRight size={16} className="cat-arrow" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Categories