import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import InlineLoader from "../components/InlineLoader";
import { getProfile } from "../api/profileApi";
import {
  searchUsers,
  followUser,
  unfollowUser,
  getFollowingUsers,
  getFollowers,
  getSocialProfile,
} from "../api/socialApi";
import {
  FaSearch,
  FaUserPlus,
  FaUserCheck,
  FaUsers,
  FaLeaf,
  FaRunning,
  FaFire,
  FaTimes,
} from "react-icons/fa";
import "./People.css";

export default function People() {
  const [searchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cachedUser = localStorage.getItem("ecotrack_sidebar_user");
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const Avatar = ({ src, name, className }) => {
    const safeSrc = getImageSrc(src);

    return (
      <div className={className}>
        {safeSrc ? (
          <>
            <img
              src={safeSrc}
              alt={name || "User"}
              onError={(e) => {
                e.currentTarget.style.display = "none";

                const fallback =
                  e.currentTarget.parentElement.querySelector(
                    ".avatar-fallback-text"
                  );

                if (fallback) {
                  fallback.style.display = "flex";
                }
              }}
            />

            <span
              className="avatar-fallback-text"
              style={{
                display: "none",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getInitials(name)}
            </span>
          </>
        ) : (
          getInitials(name)
        )}
      </div>
    );
  };

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const isCurrentUser = (userId) => {
    return Number(currentUser?.id) === Number(userId);
  };

  const loadSearch = async (searchValue = query) => {
    const res = await searchUsers(searchValue);
    setUsers(res.data || []);
  };

  const loadFollowers = async () => {
    const res = await getFollowers();
    setFollowers(res.data || []);
  };

  const loadFollowing = async () => {
    const res = await getFollowingUsers();
    setFollowing(res.data || []);
  };

  const handleOpenProfile = async (id) => {
    clearAlerts();

    try {
      setProfileLoading(true);
      const res = await getSocialProfile(id);
      setSelectedProfile(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      const profileRes = await getProfile();
      setCurrentUser(profileRes.data.user);
      localStorage.setItem(
        "ecotrack_sidebar_user",
        JSON.stringify(profileRes.data.user)
      );

      await Promise.all([loadSearch(""), loadFollowers(), loadFollowing()]);
    } catch (err) {
      console.error(err);
      setError("Failed to load people.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (loading) return;

    const userId = searchParams.get("user");

    if (!userId) return;

    handleOpenProfile(userId);
  }, [searchParams, loading]);

  const handleSearch = async (e) => {
    e.preventDefault();
    clearAlerts();

    try {
      setActionLoading(true);
      await loadSearch(query);
      setActiveTab("search");
    } catch (err) {
      console.error(err);
      setError("Search failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const refreshCurrentData = async () => {
    await Promise.all([loadSearch(query), loadFollowers(), loadFollowing()]);
  };

  const handleFollowToggle = async (user) => {
    clearAlerts();

    if (isCurrentUser(user.id)) {
      setError("You cannot follow yourself.");
      return;
    }

    try {
      setActionLoading(true);

      if (user.is_following) {
        await unfollowUser(user.id);
        setSuccess(`Unfollowed ${user.name}.`);
      } else {
        await followUser(user.id);
        setSuccess(`You are now following ${user.name}.`);
      }

      await refreshCurrentData();

      if (selectedProfile?.user?.id === user.id) {
        await handleOpenProfile(user.id);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Follow action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const activeList =
    activeTab === "followers"
      ? followers
      : activeTab === "following"
      ? following
      : users;

  return (
    <div className="people-layout">
      <Sidebar />

      <main className="people-main">
        <div className="people-container">
          <div className="people-header">
            <div>
              <h1>People</h1>
              <p>
                Search eco-minded users, follow each other, and view public
                achievements.
              </p>
            </div>
          </div>

          {loading ? (
            <InlineLoader
              text="Loading people..."
              subtext="Loading users..."
            />
          ) : (
            <>
              {error && (
                <div className="people-alert error">
                  <span>{error}</span>
                  <button onClick={() => setError("")}>
                    <FaTimes />
                  </button>
                </div>
              )}

              {success && (
                <div className="people-alert success">
                  <span>{success}</span>
                  <button onClick={() => setSuccess("")}>
                    <FaTimes />
                  </button>
                </div>
              )}

              <section className="people-stats-grid">
                <div className="people-stat-card">
                  <div className="stat-icon green">
                    <FaUsers />
                  </div>
                  <div>
                    <strong>{users.length}</strong>
                    <span>People Found</span>
                  </div>
                </div>

                <div className="people-stat-card">
                  <div className="stat-icon blue">
                    <FaUserCheck />
                  </div>
                  <div>
                    <strong>{following.length}</strong>
                    <span>Following</span>
                  </div>
                </div>

                <div className="people-stat-card">
                  <div className="stat-icon purple">
                    <FaUserPlus />
                  </div>
                  <div>
                    <strong>{followers.length}</strong>
                    <span>Followers</span>
                  </div>
                </div>
              </section>

              <div className="people-content-grid">
                <section className="people-list-card">
                  <form className="people-search" onSubmit={handleSearch}>
                    <FaSearch />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name or email..."
                    />
                    <button type="submit" disabled={actionLoading}>
                      {actionLoading ? "..." : "Search"}
                    </button>
                  </form>

                  <div className="people-tabs">
                    <button
                      type="button"
                      className={activeTab === "search" ? "active" : ""}
                      onClick={() => setActiveTab("search")}
                    >
                      Search
                    </button>

                    <button
                      type="button"
                      className={activeTab === "followers" ? "active" : ""}
                      onClick={() => setActiveTab("followers")}
                    >
                      Followers
                    </button>

                    <button
                      type="button"
                      className={activeTab === "following" ? "active" : ""}
                      onClick={() => setActiveTab("following")}
                    >
                      Following
                    </button>
                  </div>

                  <div className="people-list">
                    {activeList.length === 0 && (
                      <p className="empty-text">No users found.</p>
                    )}

                    {activeList.map((user) => (
                      <div
                        className={`person-card ${
                          selectedProfile?.user?.id === user.id
                            ? "selected"
                            : ""
                        }`}
                        key={user.id}
                      >
                        <button
                          type="button"
                          className="person-main"
                          onClick={() => handleOpenProfile(user.id)}
                        >
                          <Avatar
                            src={user.profile_picture}
                            name={user.name}
                            className={`person-avatar ${
                              user.is_active ? "active" : "offline"
                            }`}
                          />

                          <div className="person-info">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                            <small
                              className={
                                user.is_active ? "active-text" : "offline-text"
                              }
                            >
                              {user.is_active ? "Active now" : "Offline"}
                            </small>
                          </div>
                        </button>

                        <div className="person-badges">
                          {user.is_mutual && (
                            <span className="mutual-badge">Mutual</span>
                          )}

                          {user.is_following_me && !user.is_mutual && (
                            <span className="follows-you-badge">
                              Follows you
                            </span>
                          )}
                        </div>

                        {isCurrentUser(user.id) ? (
                          <button type="button" className="follow-action me" disabled>
                            Me
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`follow-action ${
                              user.is_following ? "following" : ""
                            }`}
                            onClick={() => handleFollowToggle(user)}
                            disabled={actionLoading}
                          >
                            {user.is_following ? (
                              <>
                                <FaUserCheck /> Following
                              </>
                            ) : (
                              <>
                                <FaUserPlus /> Follow
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="profile-preview-card">
                  {profileLoading ? (
                    <InlineLoader
                      text="Loading profile..."
                      subtext="Opening the selected user's profile."
                    />
                  ) : !selectedProfile ? (
                    <div className="profile-empty">
                      <FaUsers />
                      <h3>Select a person</h3>
                      <p>
                        Click a user to see their achievements, followers,
                        following, and mutual status.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="profile-cover">
                        <Avatar
                          src={selectedProfile.user.profile_picture}
                          name={selectedProfile.user.name}
                          className={`profile-avatar-large ${
                            selectedProfile.user.is_active
                              ? "active"
                              : "offline"
                          }`}
                        />
                      </div>

                      <div className="profile-info-panel">
                        <h2>{selectedProfile.user.name}</h2>
                        <p>{selectedProfile.user.email}</p>

                        <span
                          className={
                            selectedProfile.user.is_active
                              ? "profile-status active"
                              : "profile-status offline"
                          }
                        >
                          {selectedProfile.user.is_active
                            ? "Active now"
                            : selectedProfile.user.last_seen_at
                            ? `Last seen ${selectedProfile.user.last_seen_at}`
                            : "Offline"}
                        </span>

                        <div className="profile-badge-row">
                          {selectedProfile.user.is_mutual && (
                            <span className="mutual-badge">
                              Mutual followers
                            </span>
                          )}

                          {selectedProfile.user.is_following_me &&
                            !selectedProfile.user.is_mutual && (
                              <span className="follows-you-badge">
                                Follows you
                              </span>
                            )}
                        </div>

                        {isCurrentUser(selectedProfile.user.id) ? (
                          <button
                            type="button"
                            className="profile-follow-btn me"
                            disabled
                          >
                            This is your profile
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`profile-follow-btn ${
                              selectedProfile.user.is_following ? "following" : ""
                            }`}
                            onClick={() =>
                              handleFollowToggle(selectedProfile.user)
                            }
                            disabled={actionLoading}
                          >
                            {selectedProfile.user.is_following ? (
                              <>
                                <FaUserCheck /> Following
                              </>
                            ) : (
                              <>
                                <FaUserPlus /> Follow
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="profile-numbers">
                        <div>
                          <strong>
                            {selectedProfile.user.followers_count}
                          </strong>
                          <span>Followers</span>
                        </div>

                        <div>
                          <strong>
                            {selectedProfile.user.following_count}
                          </strong>
                          <span>Following</span>
                        </div>
                      </div>

                      <div className="achievement-section">
                        <h3>Achievements</h3>

                        <div className="achievement-grid">
                          <div className="achievement-card">
                            <FaLeaf />
                            <strong>
                              {selectedProfile.achievements
                                ?.total_carbon_tracked || 0}{" "}
                              kg
                            </strong>
                            <span>CO2e Tracked</span>
                          </div>

                          <div className="achievement-card">
                            <FaRunning />
                            <strong>
                              {selectedProfile.achievements
                                ?.activities_count || 0}
                            </strong>
                            <span>Activities</span>
                          </div>

                          <div className="achievement-card">
                            <FaFire />
                            <strong>
                              {selectedProfile.achievements?.top_category ||
                                "None"}
                            </strong>
                            <span>Top Category</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}