import { useNavigate } from "react-router-dom";
import "../css/profile.css";

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // remove token
    localStorage.removeItem("token");

    // notify navbar
    window.dispatchEvent(new Event("tokenChanged"));

    // go home
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar">
          👤
        </div>

        <h1>My Profile</h1>

        <p>
          Welcome to your account
        </p>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}