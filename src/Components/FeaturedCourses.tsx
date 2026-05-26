import { BookOpen, ChevronRight, Star, Users } from "lucide-react";

const courses = [
  {
    id: 1,
    tag: 'Photoshop',
    tagColor: '#ff6b35',
    title: 'Create An LMS Website With LearnPress',
    instructor: 'Determined Poster',
    weeks: 3,
    students: 156,
    rating: 4.5,
    reviews: 382,
    price: 'Free',
    image:
      'https://images.unsplash.com/photo-1593720219128-218e13fba49c?w=400&q=80',
  },
  {
    id: 2,
    tag: 'Development',
    tagColor: '#00bfa5',
    title: 'Design A Website With ThimPress',
    instructor: 'Determined Poster',
    weeks: 4,
    students: 96,
    rating: 4.8,
    reviews: 312,
    price: '$23.5',
    image:
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&q=80',
  },
  {
    id: 3,
    tag: 'Content Writing',
    tagColor: '#8bc34a',
    title: 'Create An LMS Website With LearnPress',
    instructor: 'Determined Poster',
    weeks: 3,
    students: 156,
    rating: 4.3,
    reviews: 204,
    price: '$32.5',
    image:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
  },
  {
    id: 4,
    tag: 'Communication',
    tagColor: '#9c27b0',
    title: 'Create An LMS Website With LearnPress',
    instructor: 'Determined Poster',
    weeks: 3,
    students: 156,
    rating: 4.5,
    reviews: 156,
    price: 'Free',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
  },
  {
    id: 5,
    tag: 'Videography',
    tagColor: '#ff5722',
    title: 'Create An LMS Website With LearnPress',
    instructor: 'Determined Poster',
    weeks: 3,
    students: 156,
    rating: 4.6,
    reviews: 198,
    price: 'Free',
    image:
      'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&q=80',
  },
  {
    id: 6,
    tag: 'Finance',
    tagColor: '#2196f3',
    title: 'Create An LMS Website With LearnPress',
    instructor: 'Determined Poster',
    weeks: 3,
    students: 156,
    rating: 4.4,
    reviews: 241,
    price: 'Free',
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80',
  },
]
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          fill={star <= Math.round(rating) ? '#ffc107' : 'none'}
          stroke={star <= Math.round(rating) ? '#ffc107' : '#c7c7cc'}
        />
      ))}
    </span>
  )
}


function FeaturedCourses() {
  return (
    <section className="section courses-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Courses</h2>
            <p className="section-sub">Explore our Popular Courses</p>
          </div>
          <button className="btn btn-outline">
            All Courses <ChevronRight size={16} />
          </button>
        </div>
        <div className="courses-grid">
          {courses.map((course) => (
            <div className="course-card" key={course.id}>
              <div className="course-thumb">
                <img src={course.image} alt={course.title} />
                <span className="course-tag" style={{ background: course.tagColor }}>
                  {course.tag}
                </span>
              </div>
              <div className="course-body">
                <div className="course-instructor">
                  <span className="instructor-dot" />
                  {course.instructor}
                </div>
                <h3 className="course-title">{course.title}</h3>
                <div className="course-meta">
                  <span>
                    <BookOpen size={12} /> {course.weeks} Weeks
                  </span>
                  <span>
                    <Users size={12} /> {course.students}+ Students
                  </span>
                </div>
                <div className="course-footer">
                  <div className="course-rating">
                    <StarRating rating={course.rating} />
                    <span className="rating-count">({course.reviews})</span>
                  </div>
                  <div className="course-bottom">
                    <span className={`course-price ${course.price === 'Free' ? 'free' : ''}`}>
                      {course.price}
                    </span>
                    <button className="view-more-btn">View More</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
export default FeaturedCourses;