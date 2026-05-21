// src/pages/Courses.tsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../css/courses.css";

interface Course {
  id: number;
  title: string;
  short_description: string;
  thumbnail_url: string | null;
  price: string;
  level: string;
  language: string;
  duration: number;
}

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // read ?category=business
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    let url = "http://127.0.0.1:8000/api/v1/courses";

    // if category exists
    if (category) {
      url = `http://127.0.0.1:8000/api/v1/categories/${category}`;
    }

    setLoading(true);

    fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        console.log(data);

        // category endpoint
        if (category) {
          setCourses(data.data.courses || []);
        }

        // all courses endpoint
        else {
          setCourses(data.data || []);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category]);

  // loading
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading courses...
      </div>
    );
  }

  // error
  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <section className="courses-page">
      <div className="container">
        <h1 style={{ marginBottom: "30px" }}>
          {category
            ? `${category.toUpperCase()} Courses`
            : "All Courses"}
        </h1>

        {courses.length === 0 ? (
          <p>No courses found.</p>
        ) : (
          <div
            className="courses-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "20px",
            }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                className="course-card"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <img
                  src={
                    course.thumbnail_url ||
                    "https://via.placeholder.com/400x220"
                  }
                  alt={course.title}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                  }}
                />

                <div style={{ padding: "16px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "10px",
                    }}
                  >
                    {course.title}
                  </h3>

                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      marginBottom: "16px",
                    }}
                  >
                    {course.short_description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    <span>{course.level}</span>
                    <span>{course.language}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>${course.price}</strong>

                    <span
                      style={{
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      {course.duration} mins
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Courses;