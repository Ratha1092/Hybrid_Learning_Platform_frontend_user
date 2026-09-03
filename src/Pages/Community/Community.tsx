import CommunityBoard from "../../Components/CommunityBoard/CommunityBoard";
import "./Community.css";

export default function Community() {
  return (
    <div className="cmp-page">
      <div className="cmp-header">
        <h1 className="cmp-title">Community</h1>
        <p className="cmp-sub">Ask questions, share what you're working on, and connect with other learners across the platform.</p>
      </div>
      <div className="cmp-container">
        <CommunityBoard />
      </div>
    </div>
  );
}
