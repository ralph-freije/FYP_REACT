import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getProfile } from "../api/profileApi";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "../api/notificationApi";
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
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const firstNotificationCheck = useRef(true);

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

const showDesktopNotification = (notification) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (localStorage.getItem("ecotrack_desktop_notifications_enabled") !== "true") return;
  if (!notification || !notification.id) return;

  const desktopNotification = new Notification(notification.title || "EcoTrack", {
    body: notification.message || "You have a new notification.",
    icon: "/default-avatar.png",
  });

  desktopNotification.onclick = () => {
    window.focus();

    if (notification.data?.url) {
      window.location.href = notification.data.url;
    } else {
      window.location.href = "/notifications";
    }
  };
};

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error("Failed to load unread notifications:", err);
    }
  };

  const checkLatestNotification = async () => {
    try {
      const res = await getNotifications("unread");
      const latest = res.data?.[0];

      if (!latest) return;

      if (firstNotificationCheck.current) {
        firstNotificationCheck.current = false;
        return;
      }

      showDesktopNotification(latest);
    } catch (err) {
      console.error("Failed to check latest notification:", err);
    }
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

  useEffect(() => {
    loadUnreadCount();
    checkLatestNotification();

    const interval = setInterval(() => {
      loadUnreadCount();
      checkLatestNotification();
    }, 20000);

    return () => clearInterval(interval);
  }, [user?.id]);

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
          to="/notifications"
          className={`menu-item notification-menu-item ${
            location.pathname === "/notifications" ? "active" : ""
          }`}
        >
          <span className="menu-item-left">
            <FaBell /> Notifications
          </span>

          {unreadCount > 0 && (
            <span className="sidebar-notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/settings"
          className={`menu-item ${
            location.pathname === "/settings" ? "active" : ""
          }`}
        >
          <FaCog /> Settings
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