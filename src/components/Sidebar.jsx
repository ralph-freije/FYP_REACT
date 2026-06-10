import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getProfile } from "../api/profileApi";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "../api/notificationApi";
import {
  FaBars,
  FaBell,
  FaChartBar,
  FaClock,
  FaCog,
  FaComments,
  FaHome,
  FaLeaf,
  FaRunning,
  FaTimes,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";
import UserAvatar from "./UserAvatar";
import "./Sidebar.css";

const SIDEBAR_USER_CACHE_KEY = "ecotrack_sidebar_user";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: FaHome },
  { to: "/track", label: "Impact Tracking", mobileLabel: "Track", icon: FaLeaf },
  { to: "/activity", label: "Activities", icon: FaRunning },
  { to: "/history", label: "History", icon: FaClock },
  { to: "/communities", label: "Communities", icon: FaUsers },
  { to: "/people", label: "People", icon: FaUserFriends },
  { to: "/messages", label: "Messages", icon: FaComments },
  { to: "/notifications", label: "Notifications", icon: FaBell },
  { to: "/settings", label: "Settings", icon: FaCog },
];

const primaryMobileRoutes = ["/dashboard", "/track", "/activity", "/messages"];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const firstNotificationCheck = useRef(true);
  const latestNotificationId = useRef(null);

  const showDesktopNotification = (notification) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const desktopNotificationsEnabled =
      localStorage.getItem("ecotrack_desktop_notifications_enabled") === "true";

    if (!desktopNotificationsEnabled || !notification?.id) return;

    const desktopNotification = new Notification(
      notification.title || "EcoTrack",
      {
        body: notification.message || "You have a new notification.",
        icon: "/ecotrack-logo.png",
      }
    );

    desktopNotification.onclick = () => {
      window.focus();
      window.location.href = notification.data?.url || "/notifications";
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
    window.addEventListener("profile-updated", safeLoadUser);

    return () => {
      cancelled = true;
      window.removeEventListener("profile-updated", safeLoadUser);
    };
  }, []);

  useEffect(() => {
    const initialLoadTimer = setTimeout(() => {
      loadUnreadCount();
      checkLatestNotification();
    }, 0);

    const refreshUnreadInterval = setInterval(loadUnreadCount, 60000);
    const desktopNotificationInterval = setInterval(
      checkLatestNotification,
      90000
    );
    const handleNotificationsUpdated = () => {
      loadUnreadCount();
      checkLatestNotification();
    };

    window.addEventListener("notifications-updated", handleNotificationsUpdated);
    window.addEventListener(
      "desktop-notifications-updated",
      checkLatestNotification
    );

    return () => {
      clearTimeout(initialLoadTimer);
      clearInterval(refreshUnreadInterval);
      clearInterval(desktopNotificationInterval);
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated
      );
      window.removeEventListener(
        "desktop-notifications-updated",
        checkLatestNotification
      );
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const rawAvatar =
    user?.profile?.profile_picture ||
    user?.profile_picture ||
    user?.avatar ||
    null;
  const profileLink = user?.id ? `/people?user=${user.id}` : "/people";
  const allNavigationItems =
    user?.role === "admin"
      ? [
          ...navigationItems,
          { to: "/admin", label: "Admin Analytics", icon: FaChartBar },
        ]
      : navigationItems;

  const renderNavigationLink = (item, className = "menu-item") => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to;
    const isNotifications = item.to === "/notifications";

    return (
      <Link
        key={item.to}
        to={item.to}
        className={`${className} ${isActive ? "active" : ""} ${
          isNotifications ? "notification-menu-item" : ""
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <span className="menu-item-left">
          <Icon /> {item.mobileLabel || item.label}
        </span>
        {isNotifications && unreadCount > 0 && (
          <span className="sidebar-notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
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
          {allNavigationItems.map((item) => renderNavigationLink(item))}
        </nav>

        <Link
          to={profileLink}
          className="sidebar-profile sidebar-profile-clickable"
          title="View profile"
        >
          <UserAvatar
            src={rawAvatar}
            name={user?.name}
            className="sidebar-profile-avatar"
            imageClassName="avatar"
            fallbackClassName="sidebar-avatar-fallback"
          />
          <div className="sidebar-profile-text">
            <div className="profile-name">{user?.name || "User"}</div>
            <div className="profile-email">{user?.email || "View profile"}</div>
          </div>
          <span className="sidebar-profile-view">View</span>
        </Link>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {allNavigationItems
          .filter((item) => primaryMobileRoutes.includes(item.to))
          .map((item) => renderNavigationLink(item, "mobile-nav-item"))}
        <button
          type="button"
          className={`mobile-nav-item mobile-menu-button ${
            mobileMenuOpen || !primaryMobileRoutes.includes(location.pathname)
              ? "active"
              : ""
          }`}
          onClick={() => setMobileMenuOpen(true)}
          aria-expanded={mobileMenuOpen}
        >
          <span className="menu-item-left">
            <FaBars /> Menu
          </span>
          {unreadCount > 0 && (
            <span className="sidebar-notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div>
                <strong>EcoTrack</strong>
                <span>Navigation</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <FaTimes />
              </button>
            </div>

            <Link
              to={profileLink}
              className="mobile-drawer-profile"
              onClick={() => setMobileMenuOpen(false)}
            >
              <UserAvatar
                src={rawAvatar}
                name={user?.name}
                className="sidebar-profile-avatar"
                imageClassName="avatar"
                fallbackClassName="sidebar-avatar-fallback"
              />
              <div className="sidebar-profile-text">
                <div className="profile-name">{user?.name || "User"}</div>
                <div className="profile-email">
                  {user?.email || "View profile"}
                </div>
              </div>
            </Link>

            <nav className="mobile-drawer-menu">
              {allNavigationItems.map((item) =>
                renderNavigationLink(item, "drawer-menu-item")
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
