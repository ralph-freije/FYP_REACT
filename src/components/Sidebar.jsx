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

const SIDEBAR_USER_CACHE_KEY = "ecotrack_sidebar_user";

export default function Sidebar() {
  const [user, setUser] = useState(() => {
    try {
      const cachedUser = localStorage.getItem(SIDEBAR_USER_CACHE_KEY);
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const firstNotificationCheck = useRef(true);
  const latestNotificationId = useRef(null);

  const getAvatarSrc = (src) => {
    if (!src) return null;

    const cleanSrc = String(src).trim();

    if (!cleanSrc) return null;

    if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
      return cleanSrc;
    }

    if (cleanSrc.startsWith("/storage/")) {
      return `http://127.0.0.1:8000${cleanSrc}`;
    }

    if (cleanSrc.startsWith("storage/")) {
      return `http://127.0.0.1:8000/${cleanSrc}`;
    }

    if (
      cleanSrc.startsWith("profile_pictures/") ||
      cleanSrc.startsWith("avatars/") ||
      cleanSrc.startsWith("uploads/")
    ) {
      return `http://127.0.0.1:8000/storage/${cleanSrc}`;
    }

    return null;
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const showDesktopNotification = (notification) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const desktopNotificationsEnabled =
      localStorage.getItem("ecotrack_desktop_notifications_enabled") === "true";

    if (!desktopNotificationsEnabled) return;
    if (!notification || !notification.id) return;

    const desktopNotification = new Notification(
      notification.title || "EcoTrack",
      {
        body: notification.message || "You have a new notification.",
        icon: "/ecotrack-logo.png",
      }
    );

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
      if (err.response?.status !== 429) {
        console.error("Failed to load unread notifications:", err);
      }
    }
  };

  const checkLatestNotification = async () => {
    const desktopNotificationsEnabled =
      localStorage.getItem("ecotrack_desktop_notifications_enabled") === "true";

    if (!desktopNotificationsEnabled) return;

    try {
      const res = await getNotifications("unread");
      const latest = res.data?.[0];

      if (!latest) return;

      if (firstNotificationCheck.current) {
        firstNotificationCheck.current = false;
        latestNotificationId.current = latest.id;
        return;
      }

      if (latestNotificationId.current === latest.id) return;

      latestNotificationId.current = latest.id;
      showDesktopNotification(latest);
    } catch (err) {
      if (err.response?.status !== 429) {
        console.error("Failed to check latest notification:", err);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const safeLoadUser = async () => {
      try {
        const res = await getProfile();

        if (!cancelled) {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem(
            SIDEBAR_USER_CACHE_KEY,
            JSON.stringify(freshUser)
          );
        }
      } catch (err) {
        if (err.response?.status !== 429) {
          console.error("Failed to load profile:", err);
        }
      }
    };

    safeLoadUser();

    const handleProfileUpdated = () => {
      safeLoadUser();
    };

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    loadUnreadCount();
    checkLatestNotification();

    const refreshUnreadInterval = setInterval(() => {
      loadUnreadCount();
    }, 60000);

    const desktopNotificationInterval = setInterval(() => {
      checkLatestNotification();
    }, 90000);

    const handleNotificationsUpdated = () => {
      loadUnreadCount();
      checkLatestNotification();
    };

    const handleDesktopNotificationsUpdated = () => {
      checkLatestNotification();
    };

    window.addEventListener("notifications-updated", handleNotificationsUpdated);
    window.addEventListener(
      "desktop-notifications-updated",
      handleDesktopNotificationsUpdated
    );

    return () => {
      clearInterval(refreshUnreadInterval);
      clearInterval(desktopNotificationInterval);
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated
      );
      window.removeEventListener(
        "desktop-notifications-updated",
        handleDesktopNotificationsUpdated
      );
    };
  }, []);

  const avatarSrc = getAvatarSrc(
    user?.profile?.profile_picture ||
      user?.profile_picture ||
      user?.avatar ||
      null
  );

  const profileLink = user?.id ? `/people?user=${user.id}` : "/people";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-circle">
          <img src="/ecotrack-logo.png" alt="EcoTrack logo" />
        </div>

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

      <Link
        to={profileLink}
        className="sidebar-profile sidebar-profile-clickable"
        title="View profile"
      >
        <div className="sidebar-profile-avatar">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              className="avatar"
              alt="Profile"
              onError={(e) => {
                e.currentTarget.style.display = "none";

                const fallback =
                  e.currentTarget.parentElement.querySelector(
                    ".sidebar-avatar-fallback"
                  );

                if (fallback) {
                  fallback.style.display = "flex";
                }
              }}
            />
          ) : null}

          <span
            className="sidebar-avatar-fallback"
            style={{ display: avatarSrc ? "none" : "flex" }}
          >
            {getInitials(user?.name)}
          </span>
        </div>

        <div className="sidebar-profile-text">
          <div className="profile-name">{user?.name || "User"}</div>
          <div className="profile-email">{user?.email || "View profile"}</div>
        </div>

        <span className="sidebar-profile-view">View</span>
      </Link>
    </aside>
  );
}