
import {Award, Bell, BookOpen, Camera, CheckCircle2, ChevronRight, Code2, DollarSign, FlaskConical, MessageSquare, PenTool, Play, Send, Search, Share2, Star, TrendingUp, Users, Video,Wifi, CirclePlay,} from 'lucide-react'

const categories = [
  { icon: PenTool, label: 'Art & Design', count: 38 },
  { icon: Code2, label: 'Development', count: 38 },
  { icon: MessageSquare, label: 'Communication', count: 30 },
  { icon: Video, label: 'Videography', count: 40 },
  { icon: Camera, label: 'Photography', count: 16 },
  { icon: TrendingUp, label: 'Marketing', count: 28 },
  { icon: BookOpen, label: 'Content Writing', count: 20 },
  { icon: DollarSign, label: 'Finance', count: 28 },
  { icon: FlaskConical, label: 'Science', count: 28 },
  { icon: Wifi, label: 'Network', count: 20 },
]
function Categories() {
  return (
   <>
   
    <section className="section categories-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Top Categories</h2>
            <p className="section-sub">Explore our Popular Categories</p>
          </div>
          <button className="btn btn-outline">
            All Categories <ChevronRight size={16} />
          </button>
        </div>
        <div className="categories-grid">
          {categories.map((category) => {
            const Icon = category.icon

            return (
              <div className="category-card" key={category.label}>
                <div className="cat-icon-wrap">
                  <Icon size={26} />
                </div>
                <div className="cat-label">{category.label}</div>
                <div className="cat-count">{category.count} Courses</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
   </>
  );
}
export default Categories;