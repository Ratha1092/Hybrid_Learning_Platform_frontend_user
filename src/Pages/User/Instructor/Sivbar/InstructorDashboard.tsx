import { useEffect, useState } from "react";
import { instructorService, type DashboardStats } from "../../../../services/instructorService";
import "../css/InstructorDashboard.css";

export default function InstructorDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorService.getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="idash-loading">
        <div className="idash-spinner" />
      </div>
    );
  }

  if (!data) return <div className="idash-loading">Failed to load dashboard.</div>;

  const stats = [
    { label: "Total Courses", value: data.courses.total, color: "#0ea5e9", icon: "🎓" },
    { label: "Published", value: data.courses.published, color: "#22c55e", icon: "✅" },
    { label: "Students", value: data.students.total_unique, color: "#a855f7", icon: "👥" },
    { label: "Revenue", value: `$${data.revenue.total_earned}`, color: "#f59e0b", icon: "💰" },
  ];

  return (
    <div className="idash-page">
      <h1 className="idash-title">Dashboard</h1>

      <div className="idash-stats">
        {stats.map((s) => (
          <div key={s.label} className="idash-stat" style={{ borderTopColor: s.color }}>
            <div className="idash-stat__icon">{s.icon}</div>
            <p className="idash-stat__label">{s.label}</p>
            <p className="idash-stat__value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="idash-card">
        <h3 className="idash-card__title">Recent Students</h3>
        {data.recent_enrollments.length === 0 ? (
          <p className="idash-empty">No students enrolled yet.</p>
        ) : (
          <table className="idash-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_enrollments.map((e, i) => (
                <tr key={i}>
                  <td>
                    <strong>{e.student_name}</strong>
                    <span>{e.student_email}</span>
                  </td>
                  <td>{e.course_title}</td>
                  <td>{new Date(e.enrolled_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
