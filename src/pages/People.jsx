import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageLoader from "../components/PageLoader";
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
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const clearAlerts = () => {
    setError("");
    setSuccess("");
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

  const loadAll = async () => {
    try {
      setLoading(true);
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

  const handleOpenProfile = async (id) => {
    clearAlerts();

    try {
      setActionLoading(true);
      const res = await getSocialProfile(id);
      setSelectedProfile(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
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

  if (loading) return <PageLoader text="Loading people..." />;

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
                  Search
                </button>
              </form>

              <div className="people-tabs">
                <button
                  className={activeTab === "search" ? "active" : ""}
                  onClick={() => setActiveTab("search")}
                >
                  Search
                </button>

                <button
                  className={activeTab === "followers" ? "active" : ""}
                  onClick={() => setActiveTab("followers")}
                >
                  Followers
                </button>

                <button
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
                      selectedProfile?.user?.id === user.id ? "selected" : ""
                    }`}
                    key={user.id}
                  >
                    <button
                      className="person-main"
                      onClick={() => handleOpenProfile(user.id)}
                    >
                      <div
                        className={`person-avatar ${
                          user.is_active ? "active" : "offline"
                        }`}
                      >
                        {user.profile_picture ? (
                          <img src={getImageSrc(user.profile_picture)} alt={user.name} />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>

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
                      {user.is_mutual && <span className="mutual-badge">Mutual</span>}
                      {user.is_following_me && !user.is_mutual && (
                        <span className="follows-you-badge">Follows you</span>
                      )}
                    </div>

                    <button
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
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-preview-card">
              {!selectedProfile ? (
                <div className="profile-empty">
                  <FaUsers />
                  <h3>Select a person</h3>
                  <p>
                    Click a user to see their achievements, followers, following,
                    and mutual status.
                  </p>
                </div>
              ) : (
                <>
                  <div className="profile-cover">
                    <div
                      className={`profile-avatar-large ${
                        selectedProfile.user.is_active ? "active" : "offline"
                      }`}
                    >
                      {selectedProfile.user.profile_picture ? (
                        <img
                          src={getImageSrc(selectedProfile.user.profile_picture)}
                          alt={selectedProfile.user.name}
                        />
                      ) : (
                        getInitials(selectedProfile.user.name)
                      )}
                    </div>
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
                        <span className="mutual-badge">Mutual followers</span>
                      )}

                      {selectedProfile.user.is_following_me &&
                        !selectedProfile.user.is_mutual && (
                          <span className="follows-you-badge">Follows you</span>
                        )}
                    </div>

                    <button
                      className={`profile-follow-btn ${
                        selectedProfile.user.is_following ? "following" : ""
                      }`}
                      onClick={() => handleFollowToggle(selectedProfile.user)}
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
                  </div>

                  <div className="profile-numbers">
                    <div>
                      <strong>{selectedProfile.user.followers_count}</strong>
                      <span>Followers</span>
                    </div>

                    <div>
                      <strong>{selectedProfile.user.following_count}</strong>
                      <span>Following</span>
                    </div>
                  </div>

                  <div className="achievement-section">
                    <h3>Achievements</h3>

                    <div className="achievement-grid">
                      <div className="achievement-card">
                        <FaLeaf />
                        <strong>
                          {selectedProfile.achievements?.total_carbon_tracked ||
                            0}{" "}
                          kg
                        </strong>
                        <span>CO2e Tracked</span>
                      </div>

                      <div className="achievement-card">
                        <FaRunning />
                        <strong>
                          {selectedProfile.achievements?.activities_count || 0}
                        </strong>
                        <span>Activities</span>
                      </div>

                      <div className="achievement-card">
                        <FaFire />
                        <strong>
                          {selectedProfile.achievements?.top_category || "None"}
                        </strong>
                        <span>Top Category</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}