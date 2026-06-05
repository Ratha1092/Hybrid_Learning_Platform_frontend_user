import { useEffect, useState } from "react";
import { instructorService, type StudentEnrollment } from "../../../services/instructorService";
import "./Students.css";

export default function Students() {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    instructorService.getStudents()
      .then(({ data }) => {
        const raw = data.data?.students;
        setStudents(Array.isArray(raw) ? raw : []);
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setApiError(e.response?.data?.message ?? e.message ?? "Failed to load students.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.student_email.toLowerCase().includes(q) ||
      s.course_title.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="st-loading"><div className="st-spinner" /></div>;
  }

  return (
    <div className="st-page">
      <div className="st-header">
        <div>
          <h1 className="st-title">Students</h1>
          <p className="st-sub">{students.length} total enrolled</p>
        </div>
      </div>

      {apiError && (
        <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13 }}>
          ⚠ API Error: <strong>{apiError}</strong>
          <span style={{ color:"#9ca3af", marginLeft:8 }}>— endpoint: /instructor/students</span>
        </div>
      )}

      <div className="st-card">
        <div className="st-search-wrap">
          <span className="st-search-icon">🔍</span>
          <input
            className="st-search"
            placeholder="Search by name, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="st-empty">
            <span>👥</span>
            <p>{search ? "No results found." : "No students enrolled yet."}</p>
          </div>
        ) : (
          <table className="st-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Course</th>
                <th>Progress</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.student_id ?? s.id ?? i}>
                  <td className="st-table__num">{i + 1}</td>
                  <td>
                    <div className="st-student">
                      <div className="st-avatar">
                        {s.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="st-student__name">{s.student_name}</p>
                        <p className="st-student__email">{s.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="st-course">{s.course_title}</td>
                  <td>
                    <div className="st-progress">
                      <div className="st-progress__bar" style={{ width: `${s.progress_percentage ?? s.progress ?? 0}%` }} />
                      <span>{s.progress_percentage ?? s.progress ?? 0}%</span>
                    </div>
                  </td>
                  <td className="st-date">
                    {new Date(s.enrolled_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
