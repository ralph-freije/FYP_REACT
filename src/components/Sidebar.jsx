import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../api/profileApi";
import {
  FaHome,
  FaLeaf,
  FaCog,
  FaBell,
  FaRunning,
  FaClock,
  FaChartBar,
  FaUsers,
  FaUserFriends,
  FaComments,
} from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  const getAvatarSrc = (src) => {
    if (!src) return "/default-avatar.png";

    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }

    if (src.startsWith("/storage/")) {
      return `http://127.0.0.1:8000${src}`;
    }

    if (src.startsWith("storage/")) {
      return `http://127.0.0.1:8000/${src}`;
    }

    if (src.startsWith("avatars/")) {
      return `http://127.0.0.1:8000/storage/${src}`;
    }

    return src;
  };

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
          className={`menu-item ${
            location.pathname === "/dashboard" ? "active" : ""
          }`}
        >
          <FaHome /> Dashboard
        </Link>

        <Link
          to="/track"
          className={`menu-item ${
            location.pathname === "/track" ? "active" : ""
          }`}
        >
          <FaLeaf /> Impact Tracking
        </Link>

        <Link
          to="/activity"
          className={`menu-item ${
            location.pathname === "/activity" ? "active" : ""
          }`}
        >
          <FaRunning /> Activities
        </Link>

        <Link
          to="/history"
          className={`menu-item ${
            location.pathname === "/history" ? "active" : ""
          }`}
        >
          <FaClock /> History
        </Link>

        <Link
          to="/communities"
          className={`menu-item ${
            location.pathname === "/communities" ? "active" : ""
          }`}
        >
          <FaUsers /> Communities
        </Link>

        <Link
          to="/people"
          className={`menu-item ${
            location.pathname === "/people" ? "active" : ""
          }`}
        >
          <FaUserFriends /> People
        </Link>
        <Link
  to="/messages"
  className={`menu-item ${
    location.pathname === "/messages" ? "active" : ""
  }`}
>
  <FaComments /> Messages
</Link>

        <Link
          to="/settings"
          className={`menu-item ${
            location.pathname === "/settings" ? "active" : ""
          }`}
        >
          <FaCog /> Settings
        </Link>

        <Link
          to="/notifications"
          className={`menu-item ${
            location.pathname === "/notifications" ? "active" : ""
          }`}
        >
          <FaBell /> Notifications
        </Link>

        {user?.role === "admin" && (
          <Link
            to="/admin"
            className={`menu-item ${
              location.pathname === "/admin" ? "active" : ""
            }`}
          >
            <FaChartBar /> Admin Analytics
          </Link>
        )}
      </nav>

      <div className="sidebar-profile">
        <img
          src={getAvatarSrc(user?.profile?.profile_picture)}
          className="avatar"
          alt="Profile"
          onError={(e) => {
            e.currentTarget.src = "/default-avatar.png";
          }}
        />

        <div>
          <div className="profile-name">{user?.name || "User"}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
      </div>
    </aside>
  );
}