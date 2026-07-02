import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../api/notificationApi";
import {
  FaBell,
  FaCheckDouble,
  FaTrash,
  FaExternalLinkAlt,
  FaUsers,
  FaComments,
  FaLeaf,
  FaRobot,
  FaTrophy,
} from "react-icons/fa";
import "./Notifications.css";

const filters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Social", value: "social" },
  { label: "Messages", value: "message" },
  { label: "Communities", value: "community" },
  { label: "Achievements", value: "achievement" },
  { label: "AI", value: "ai" },
];

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [desktopPermission, setDesktopPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const [desktopEnabled, setDesktopEnabled] = useState(
    localStorage.getItem("ecotrack_desktop_notifications_enabled") === "true"
  );

  const loadNotifications = async (filter = activeFilter) => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications(filter);

      setNotifications(data.data || []);
      setPagination({
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    const syncDesktopToggle = () => {
      setDesktopEnabled(
        localStorage.getItem("ecotrack_desktop_notifications_enabled") ===
          "true"
      );

      if ("Notification" in window) {
        setDesktopPermission(Notification.permission);
      }
    };

    window.addEventListener("storage", syncDesktopToggle);

    return () => {
      window.removeEventListener("storage", syncDesktopToggle);
    };
  }, []);

  const enableDesktopNotifications = async () => {
    setError("");

    if (!("Notification" in window)) {
      setDesktopPermission("unsupported");
      setError("Your browser does not support desktop notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      localStorage.setItem("ecotrack_desktop_notifications_enabled", "true");
      setDesktopPermission("granted");
      setDesktopEnabled(true);
      window.dispatchEvent(new Event("desktop-notifications-updated"));
      return;
    }

    const permission = await Notification.requestPermission();
    setDesktopPermission(permission);

    if (permission === "granted") {
      localStorage.setItem("ecotrack_desktop_notifications_enabled", "true");
      setDesktopEnabled(true);
      window.dispatchEvent(new Event("desktop-notifications-updated"));

      new Notification("EcoTrack notifications enabled", {
        body: "You will receive desktop notifications while EcoTrack is open.",
        icon: "/default-avatar.png",
      });
    }

    if (permission === "denied") {
      localStorage.setItem("ecotrack_desktop_notifications_enabled", "false");
      setDesktopEnabled(false);
      window.dispatchEvent(new Event("desktop-notifications-updated"));
      setError("Desktop notifications are blocked in your browser settings.");
    }
  };

  const disableDesktopNotifications = () => {
    localStorage.setItem("ecotrack_desktop_notifications_enabled", "false");
    setDesktopEnabled(false);
    window.dispatchEvent(new Event("desktop-notifications-updated"));
  };
  const getImageSrc = (src) => {
    if (!src) return null;

    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }

    if (src.startsWith("/storage/")) {
      return `http://127.0.0.1:8000${src}`;
    }

    if (src.startsWith("storage/")) {
      return `http://127.0.0.1:8000/${src}`;
    }

    return `http://127.0.0.1:8000/storage/${src}`;
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
  const updateNotificationAsReadInState = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : notification
      )
    );

    window.dispatchEvent(new Event("notifications-updated"));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(true);
      await markNotificationAsRead(notificationId);
      updateNotificationAsReadInState(notificationId);
    } catch (err) {
      console.error(err);
      setError("Could not mark notification as read.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenNotification = async (notification) => {
    try {
      setActionLoading(true);

      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        updateNotificationAsReadInState(notification.id);
      }

      if (notification.data?.url) {
        window.location.href = notification.data.url;
      }
    } catch (err) {
      console.error(err);
      setError("Could not open notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
      setError("Could not mark all notifications as read.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setActionLoading(true);
      await deleteNotification(notificationId);

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
      setError("Could not delete notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all notifications?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await deleteAllNotifications();

      setNotifications([]);
      setPagination((prev) =>
        prev
          ? {
              ...prev,
              total: 0,
            }
          : prev
      );

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
      setError("Could not delete all notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    if (type?.startsWith("social")) return <FaUsers />;
    if (type?.startsWith("message")) return <FaComments />;
    if (type?.startsWith("community")) return <FaLeaf />;
    if (type?.startsWith("achievement")) return <FaTrophy />;
    if (type?.startsWith("ai")) return <FaRobot />;
    return <FaBell />;
  };

  const getNotificationClass = (type) => {
    if (type?.startsWith("social")) return "social";
    if (type?.startsWith("message")) return "message";
    if (type?.startsWith("community")) return "community";
    if (type?.startsWith("achievement")) return "achievement";
    if (type?.startsWith("ai")) return "ai";
    return "general";
  };

  return (
    <div className="notifications-layout">
      <Sidebar />

      <main className="notifications-main">
        <DashboardBackButton />
        <div className="notifications-container">
          <div className="notifications-header">
            <div>
              <span className="notifications-badge">
                <FaBell /> Activity Center
              </span>

              <h1>Notifications</h1>
              <p>
                Stay updated with follows, messages, communities, achievements,
                and AI suggestions.
              </p>
            </div>

            <div className="notifications-header-actions">
              {desktopPermission === "default" && (
                <button
                  className="desktop-notification-btn"
                  onClick={enableDesktopNotifications}
                  disabled={actionLoading}
                >
                  Enable desktop notifications
                </button>
              )}

              {desktopPermission === "granted" && !desktopEnabled && (
                <button
                  className="desktop-notification-btn"
                  onClick={enableDesktopNotifications}
                  disabled={actionLoading}
                >
                  Turn on desktop notifications
                </button>
              )}

              {desktopPermission === "granted" && desktopEnabled && (
                <button
                  className="desktop-enabled-pill"
                  onClick={disableDesktopNotifications}
                  type="button"
                  disabled={actionLoading}
                >
                  Desktop notifications on
                </button>
              )}

              {desktopPermission === "unsupported" && (
                <span className="desktop-denied-pill">
                  Desktop notifications unsupported
                </span>
              )}

              {desktopPermission === "denied" && (
                <span className="desktop-denied-pill">
                  Desktop notifications blocked
                </span>
              )}

              <button
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading || notifications.length === 0}
              >
                <FaCheckDouble /> Mark all as read
              </button>

              <button
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={actionLoading || notifications.length === 0}
              >
                <FaTrash /> Delete all
              </button>
            </div>
          </div>

          <div className="notifications-filters">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={activeFilter === filter.value ? "active" : ""}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {error && <div className="notifications-error">{error}</div>}

          {loading ? (
            <InlineLoader
              text="Loading notifications..."
              subtext="Updating this list..."
            />
          ) : notifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-notifications-icon">
                <FaBell />
              </div>
              <h2>No notifications yet</h2>
              <p>
                When someone follows you, messages you, joins your community, or
                shares an achievement, it will appear here.
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${
                    notification.is_read ? "read" : "unread"
                  }`}
                >
                  <div
                    className={`notification-icon ${getNotificationClass(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <div>
                        <h3>{notification.title}</h3>
                        <p>{notification.message}</p>
                      </div>

                      <div className="notification-time-wrap">
                          <span>
                            {notification.created_at_human || notification.created_at}
                          </span>

                            {!notification.is_read && <span className="notification-time-dot" />}
                      </div>
                   </div>

                 {notification.actor && (
  <div className="notification-actor">
    <div className="notification-actor-avatar">
      {notification.actor.profile_picture ? (
        <>
          <img
            src={getImageSrc(notification.actor.profile_picture)}
            alt={notification.actor.name}
            onError={(e) => {
              e.currentTarget.style.display = "none";

              const fallback =
                e.currentTarget.parentElement.querySelector(
                  ".actor-fallback"
                );

              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
          />

          <div className="actor-fallback hidden">
            {getInitials(notification.actor.name)}
          </div>
        </>
      ) : (
        <div className="actor-fallback">
          {getInitials(notification.actor.name)}
        </div>
      )}
    </div>

    <span>{notification.actor.name}</span>
  </div>
)}

                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={actionLoading}
                        >
                          Mark as read
                        </button>
                      )}

                      {notification.data?.url && (
                        <button
                          type="button"
                          onClick={() => handleOpenNotification(notification)}
                          disabled={actionLoading}
                        >
                          <FaExternalLinkAlt /> Open
                        </button>
                      )}

                      <button
                        className="delete-notification-btn"
                        onClick={() => handleDelete(notification.id)}
                        disabled={actionLoading}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {pagination && notifications.length > 0 && (
            <div className="notifications-pagination-note">
              Showing {notifications.length} of {pagination.total} notifications
            </div>
          )}
        </div>
      </main>
    </div>
  );
}