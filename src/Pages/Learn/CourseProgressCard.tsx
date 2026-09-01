interface CourseProgressCardProps {
  thumbnailUrl: string | null;
  courseTitle: string;
  instructorName?: string | null;
  progressPercent: number;
}

export default function CourseProgressCard({ thumbnailUrl, courseTitle, instructorName, progressPercent }: CourseProgressCardProps) {
  return (
    <div className="course-progress-card">
      <div className="course-progress-card__thumb">
        {thumbnailUrl ? <img src={thumbnailUrl} alt={courseTitle} /> : <span>{courseTitle.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="course-progress-card__body">
        <p className="course-progress-card__title">{courseTitle}</p>
        {instructorName && <p className="course-progress-card__instructor">With {instructorName}</p>}
        <div className="course-progress-card__progress">
          <div className="course-progress-card__progress-head">
            <span>Series Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="course-progress-card__bar">
            <div className="course-progress-card__bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
