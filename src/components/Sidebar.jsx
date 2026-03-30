import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../api/profileApi";
import { FaHome, FaLeaf, FaCog, FaBell } from "react-icons/fa";
import "./Sidebar.css";
import { FaRunning } from "react-icons/fa";


export default function Sidebar() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getProfile();
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadUser();
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-circle">🌱</div>

        <div className="logo-text">
          <div className="logo-title">EcoTrack</div>
          <div className="logo-sub">Carbon Tracking</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <Link
          to="/dashboard"
          className={`menu-item ${location.pathname === "/dashboard" ? "active" : ""}`}
        >
          <FaHome /> Dashboard
        </Link>

        <Link
          to="/track"
          className={`menu-item ${location.pathname === "/track" ? "active" : ""}`}
        >
          <FaLeaf /> Impact Tracking
        </Link>

        <Link
          to="/settings"
          className={`menu-item ${location.pathname === "/settings" ? "active" : ""}`}
        >
          <FaCog /> Settings
        </Link>

        <Link
          to="/notifications"
          className={`menu-item ${location.pathname === "/notifications" ? "active" : ""}`}
        >
          <FaBell /> Notifications
        </Link>
          <Link
          to="/activity"
          className={`menu-item ${location.pathname === "/activity" ? "active" : ""}`}
        >
          <FaRunning /> Activities
        </Link>
      </nav>

      <div className="sidebar-profile">
        <img
          src={user?.profile?.profile_picture || "/default-avatar.png"}
          className="avatar"
          alt="Profile"
        />

        <div>
          <div className="profile-name">{user?.name || "User"}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
      </div>
    </aside>
  );
}