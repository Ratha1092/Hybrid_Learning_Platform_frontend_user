import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { courseService, type EnrolledCourse } from "../../../services/courseService";
import { profileService, type StudentProfile } from "../../../services/profileService";
import "./StudentProfile.css";

type Tab = "overview" | "courses";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("overview");
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/PageLogin");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data } = await profileService.get();
        setStudentProfile(data.data);
      } catch {
        // network or server error — stay silent
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || tab !== "courses") return;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const { data } = await courseService.getEnrolled();
        setCourses(data.data ?? []);
      } catch {
        // network or server error — stay silent
      }
      setLoadingCourses(false);
    };
    fetchCourses();
  }, [isAuthenticated, tab]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const avatarSrc = studentProfile?.avatar ?? user?.avatar_url ?? user?.avatar ?? null;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* ── Left: User Card ── */}
        <aside className="profile-card">
          <div className="profile-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user?.name} />
            ) : (
              <span>{user?.name?.charAt(0).toUpperCase() ?? "U"}</span>
            )}
          </div>

          <p className="profile-welcome">Welcome back,</p>
          <h2 className="profile-name">{user?.name ?? "—"}</h2>
          <p className="profile-email">{user?.email ?? "—"}</p>

          {user?.created_at && (
            <p className="profile-joined">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          )}

          {/* Social links */}
          {(studentProfile?.github || studentProfile?.linkedin) && (
            <div className="profile-socials">
              {studentProfile.github && (
                <a href={studentProfile.github} target="_blank" rel="noreferrer" className="profile-social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {studentProfile.linkedin && (
                <a href={studentProfile.linkedin} target="_blank" rel="noreferrer" className="profile-social-link profile-social-link--linkedin">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          )}

          <div className="profile-actions">
            <button className="profile-btn profile-btn--edit" onClick={() => navigate("/profile/edit")}>
              ✏️ Edit Profile
            </button>
            <button className="profile-btn profile-btn--logout" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </aside>

        {/* ── Right: Tabs ── */}
        <main className="profile-main">
          {/* Tab bar */}
          <div className="profile-tabs">
            <button
              className={`profile-tab${tab === "overview" ? " profile-tab--active" : ""}`}
              onClick={() => setTab("overview")}
            >
              Overview
            </button>
            <button
              className={`profile-tab${tab === "courses" ? " profile-tab--active" : ""}`}
              onClick={() => setTab("courses")}
            >
              My Courses
              {courses.length > 0 && (
                <span className="profile-count">{courses.length}</span>
              )}
            </button>
          </div>

          {/* ── Tab: Overview ── */}
          {tab === "overview" && (
            <>
              {loadingProfile ? (
                <div className="profile-state">
                  <div className="profile-spinner" />
                  <p>Loading profile...</p>
                </div>
              ) : (
                <div className="profile-overview">
                  <h2 className="profile-section-title">Hello, {firstName} 👋</h2>

                  {/* Bio */}
                  <div className="profile-info-block">
                    <h3 className="profile-info-label">Bio</h3>
                    <p className="profile-info-value">
                      {studentProfile?.bio || <span className="profile-info-empty">No bio yet. Click Edit Profile to add one.</span>}
                    </p>
                  </div>

                  {/* Learning Goals */}
                  <div className="profile-info-block">
                    <h3 className="profile-info-label">Learning Goals</h3>
                    <p className="profile-info-value">
                      {studentProfile?.learning_goals || <span className="profile-info-empty">No learning goals set.</span>}
                    </p>
                  </div>

                  {/* Interests */}
                  <div className="profile-info-block">
                    <h3 className="profile-info-label">Interests</h3>
                    {studentProfile?.interests && studentProfile.interests.length > 0 ? (
                      <div className="profile-tags">
                        {studentProfile.interests.map((tag) => (
                          <span key={tag} className="profile-tag">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="profile-info-empty">No interests listed.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Tab: My Courses ── */}
          {tab === "courses" && (
            <>
              <h2 className="profile-section-title" style={{ marginTop: 0 }}>
                My Courses
                {courses.length > 0 && <span className="profile-count">{courses.length}</span>}
              </h2>

              {loadingCourses ? (
                <div className="profile-state">
                  <div className="profile-spinner" />
                  <p>Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="profile-empty">
                  <p>You haven't enrolled in any courses yet.</p>
                  <button onClick={() => navigate("/courses")}>Browse Courses →</button>
                </div>
              ) : (
                <div className="profile-courses">
                  {courses.map((course) => (
                    <div key={course.id} className="profile-course-card" onClick={() => navigate(`/courses/${course.id}`)}>
                      <img
                        src={course.thumbnail_url || "https://via.placeholder.com/110x72"}
                        alt={course.title}
                        className="profile-course-thumb"
                      />
                      <div className="profile-course-info">
                        <h3>{course.title}</h3>
                        <span className="profile-course-level">{course.level}</span>
                        {course.progress !== undefined && (
                          <div className="profile-progress">
                            <div className="profile-progress__track">
                              <div className="profile-progress__bar" style={{ width: `${course.progress}%` }} />
                            </div>
                            <span>{course.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
