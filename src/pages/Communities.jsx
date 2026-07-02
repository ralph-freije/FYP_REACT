import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import UserAvatar from "../components/UserAvatar";
import { getProfile } from "../api/profileApi";
import {
  getCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunity,
  addCommunityGoal,
  getCommunityMessages,
  sendCommunityMessage,
  shareCommunityAchievement,
  followUser,
  unfollowUser,
  getFollowingUsers,
  markCommunityMessagesRead,
  getMessageReaders,
  updateCommunity,
  uploadCommunityImage,
  removeCommunityMember,
} from "../api/communityApi";
import {
  FaUsers,
  FaPlus,
  FaLeaf,
  FaBullseye,
  FaUserShield,
  FaTimes,
  FaPaperPlane,
  FaComments,
  FaUserPlus,
  FaUserCheck,
  FaTrophy,
  FaCopy,
  FaFacebookF,
  FaShareAlt,
  FaEdit,
  FaSave,
  FaImage,
  FaSearch,
  FaMedal,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa";
import "./Communities.css";

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "custom",
    target: "",
    score_reward: 300,
  });
  const [newMessage, setNewMessage] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [communitySearch, setCommunitySearch] = useState("");
  const [readersModal, setReadersModal] = useState(null);
  const [editingCommunity, setEditingCommunity] = useState(false);
  const [editCommunityName, setEditCommunityName] = useState("");
  const [editCommunityDescription, setEditCommunityDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSummary = useMemo(() => {
    if (!selectedCommunity) return null;
    return communities.find((item) => item.id === selectedCommunity.id) || null;
  }, [communities, selectedCommunity]);

  const isSelectedMember = selectedSummary?.is_member;
  const isSelectedCreator =
    Number(selectedCommunity?.created_by) === Number(currentUser?.id);

  const selectedMonthlyGoals = useMemo(
    () => selectedCommunity?.monthly_goals || selectedCommunity?.goals || [],
    [selectedCommunity]
  );

  const selectedCommunityLeaderboard = selectedCommunity?.community_leaderboard || {
    total_score: 0,
    top_contributors: [],
  };

  const filteredCommunities = useMemo(() => {
    const keyword = communitySearch.trim().toLowerCase();

    let list = communities;

    if (communityFilter === "joined") {
      list = list.filter((community) => community.is_member);
    }

    if (communityFilter === "created") {
      list = list.filter(
        (community) => Number(community.created_by) === Number(currentUser?.id)
      );
    }

    if (keyword) {
      list = list.filter((community) => {
        const name = community.name?.toLowerCase() || "";
        const description = community.description?.toLowerCase() || "";
        const creator = community.creator?.toLowerCase?.() || "";

        return (
          name.includes(keyword) ||
          description.includes(keyword) ||
          creator.includes(keyword)
        );
      });
    }

    return list;
  }, [communities, communityFilter, communitySearch, currentUser]);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const getApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat().filter(Boolean)[0];

      if (firstError) {
        return firstError;
      }
    }

    return fallback;
  };

  const handleGoalFormChange = (field, value) => {
    setNewGoal((previous) => ({
      ...previous,
      [field]: value,
    }));
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

  const loadProfile = async () => {
    const res = await getProfile();
    setCurrentUser(res.data.user);
  };

  const loadCommunities = async () => {
    const res = await getCommunities();
    setCommunities(res.data || []);
    return res.data || [];
  };

  const loadFollowingUsers = async () => {
    try {
      const res = await getFollowingUsers();
      setFollowingUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (communityId, markRead = true) => {
    try {
      if (markRead) {
        await markCommunityMessagesRead(communityId);
      }

      const res = await getCommunityMessages(communityId);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const loadCommunityDetails = async (id, communitiesList = communities) => {
    try {
      setDetailsLoading(true);

      const res = await getCommunity(id);
      setSelectedCommunity(res.data);
      setEditCommunityName(res.data.name || "");
      setEditCommunityDescription(res.data.description || "");

      const summary = communitiesList.find((item) => item.id === id);

      if (summary?.is_member) {
        await loadMessages(id);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to load community details."));
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadProfile();
        await loadCommunities();
        await loadFollowingUsers();
      } catch (err) {
        console.error(err);
        setError("Failed to load communities.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!selectedCommunity?.id || !isSelectedMember) return;

    let cancelled = false;

    const refreshMessages = async () => {
      try {
        await markCommunityMessagesRead(selectedCommunity.id);
        const res = await getCommunityMessages(selectedCommunity.id);

        if (!cancelled) {
          setMessages(res.data || []);
        }
      } catch (err) {
        console.error("Failed to refresh community messages:", err);
      }
    };

    refreshMessages();

    const interval = setInterval(refreshMessages, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedCommunity?.id, isSelectedMember]);

  const refreshAfterCommunityChange = async (communityId) => {
    const updatedCommunities = await loadCommunities();

    if (communityId) {
      await loadCommunityDetails(communityId, updatedCommunities);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!newCommunityName.trim()) return;

    try {
      setActionLoading(true);

      await createCommunity({
        name: newCommunityName.trim(),
      });

      setNewCommunityName("");
      setSuccess("Community created successfully.");
      await loadCommunities();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to create community."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (id) => {
    clearAlerts();

    try {
      setActionLoading(true);
      await joinCommunity(id);
      setSuccess("Joined community successfully.");
      await refreshAfterCommunityChange(id);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to join community."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async (id) => {
    clearAlerts();

    try {
      setActionLoading(true);
      await leaveCommunity(id);
      setSuccess("Left community successfully.");
      setMessages([]);
      await refreshAfterCommunityChange(id);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to leave community."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCommunitySettings = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!selectedCommunity || !editCommunityName.trim()) return;

    try {
      setActionLoading(true);

      await updateCommunity(selectedCommunity.id, {
        name: editCommunityName.trim(),
        description: editCommunityDescription.trim(),
      });

      setSuccess("Community updated successfully.");
      setEditingCommunity(false);
      await refreshAfterCommunityChange(selectedCommunity.id);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to update community."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommunityImageUpload = async (e) => {
    clearAlerts();

    const file = e.target.files[0];

    if (!file || !selectedCommunity) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setActionLoading(true);

      await uploadCommunityImage(selectedCommunity.id, formData);

      setSuccess("Community image updated successfully.");
      await refreshAfterCommunityChange(selectedCommunity.id);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to upload image."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!selectedCommunity) return;

    const title = newGoal.title.trim();
    const description = newGoal.description.trim();

    if (!title && !description) {
      setError("Add a title or description for the monthly goal.");
      return;
    }

    try {
      setActionLoading(true);

      await addCommunityGoal(selectedCommunity.id, {
        title,
        description,
        goal_description: description || title,
        category: newGoal.category,
        target: newGoal.target.trim(),
        score_reward: Number(newGoal.score_reward) || 300,
      });

      setNewGoal({
        title: "",
        description: "",
        category: "custom",
        target: "",
        score_reward: 300,
      });
      setSuccess("Monthly community goal added successfully.");
      await refreshAfterCommunityChange(selectedCommunity.id);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to add monthly goal."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!newMessage.trim() || !selectedCommunity) return;

    try {
      setActionLoading(true);

      await sendCommunityMessage(selectedCommunity.id, {
        message: newMessage.trim(),
      });

      setNewMessage("");
      await loadMessages(selectedCommunity.id, true);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to send message."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareAchievementToChat = async () => {
    clearAlerts();

    if (!selectedCommunity) return;

    try {
      setActionLoading(true);
      await shareCommunityAchievement(selectedCommunity.id);
      setSuccess("Achievement shared to community chat.");
      await loadMessages(selectedCommunity.id, true);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to share achievement."));
    } finally {
      setActionLoading(false);
    }
  };

  const getAchievementText = () => {
    return "I am tracking my carbon footprint with EcoTrack and working with my community to build more sustainable habits.";
  };

  const handleCopyAchievement = async () => {
    clearAlerts();

    try {
      await navigator.clipboard.writeText(getAchievementText());
      setSuccess("Achievement text copied. You can paste it on Instagram.");
    } catch (err) {
      console.error(err);
      setError("Could not copy achievement text.");
    }
  };

  const handleFacebookShare = () => {
    const shareText = encodeURIComponent(getAchievementText());
    const shareUrl = encodeURIComponent(window.location.href);

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleNativeShare = async () => {
    clearAlerts();

    if (!navigator.share) {
      handleCopyAchievement();
      return;
    }

    try {
      await navigator.share({
        title: "EcoTrack Achievement",
        text: getAchievementText(),
        url: window.location.href,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const isCurrentUser = (userId) => {
    return Number(currentUser?.id) === Number(userId);
  };

  const isFollowing = (userId) => {
    return followingUsers.some((user) => Number(user.id) === Number(userId));
  };

  const handleFollowToggle = async (member) => {
    clearAlerts();

    if (isCurrentUser(member.id)) {
      setError("This is your account.");
      return;
    }

    try {
      setActionLoading(true);

      if (isFollowing(member.id)) {
        await unfollowUser(member.id);
        setSuccess(`Unfollowed ${member.name}.`);
      } else {
        await followUser(member.id);
        setSuccess(`You are now following ${member.name}.`);
      }

      await loadFollowingUsers();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Follow action failed."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    clearAlerts();

    if (!selectedCommunity || !member) return;

    const confirmRemove = window.confirm(
      `Remove ${member.name} from ${selectedCommunity.name}?`
    );

    if (!confirmRemove) return;

    try {
      setActionLoading(true);

      await removeCommunityMember(selectedCommunity.id, member.id);

      setSuccess(`${member.name} removed from the community.`);
      await refreshAfterCommunityChange(selectedCommunity.id);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to remove member."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReaders = async (message) => {
    clearAlerts();

    if (!message || Number(message.user?.id) !== Number(currentUser?.id)) {
      return;
    }

    try {
      await loadMessages(selectedCommunity.id, true);

      const res = await getMessageReaders(message.id);

      setReadersModal({
        message,
        readers: res.data || [],
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load readers.");
    }
  };

  return (
    <div className="communities-layout">
      <Sidebar />

      <main className="communities-main">
        <DashboardBackButton />
        <div className="communities-container">
          <div className="communities-header">
            <div>
              <h1>Communities</h1>
              <p>
                Join groups, chat with members, follow eco-minded users, and
                share your climate achievements.
              </p>
            </div>
          </div>

          {loading ? (
            <InlineLoader
              text="Loading communities..."
              subtext="Fetching your groups, members, and community stats."
            />
          ) : (
            <>
              {error && (
                <div className="community-alert error">
                  <span>{error}</span>
                  <button onClick={() => setError("")}>
                    <FaTimes />
                  </button>
                </div>
              )}

              {success && (
                <div className="community-alert success">
                  <span>{success}</span>
                  <button onClick={() => setSuccess("")}>
                    <FaTimes />
                  </button>
                </div>
              )}

              <div className="communities-top-grid">
                <form
                  className="create-community-card"
                  onSubmit={handleCreateCommunity}
                >
                  <div className="card-icon green">
                    <FaPlus />
                  </div>

                  <div>
                    <h3>Create Community</h3>
                    <p>
                      Start a group for your campus, family, friends, or
                      workplace.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={newCommunityName}
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    placeholder="Example: Green Campus"
                  />

                  <button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Creating..." : "Create Community"}
                  </button>
                </form>

                <div className="community-info-card">
                  <div className="card-icon blue">
                    <FaLeaf />
                  </div>

                  <h3>Community Climate Action</h3>
                  <p>
                    Communities help users stay motivated through shared goals,
                    chat, following, and social accountability.
                  </p>

                  <div className="info-stats">
                    <div>
                      <strong>{communities.length}</strong>
                      <span>Total Communities</span>
                    </div>

                    <div>
                      <strong>
                        {
                          communities.filter((community) => community.is_member)
                            .length
                        }
                      </strong>
                      <span>Joined</span>
                    </div>

                    <div>
                      <strong>{followingUsers.length}</strong>
                      <span>Following</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="communities-content-grid">
                <section className="communities-list-card">
                  <div className="section-title community-list-header">
                    <div>
                      <h2>Available Communities</h2>
                      <p>Browse, filter, and join sustainability groups.</p>
                    </div>

                    <div className="community-filters">
                      <button
                        className={communityFilter === "all" ? "active" : ""}
                        onClick={() => setCommunityFilter("all")}
                        type="button"
                      >
                        All
                      </button>

                      <button
                        className={
                          communityFilter === "joined" ? "active" : ""
                        }
                        onClick={() => setCommunityFilter("joined")}
                        type="button"
                      >
                        Joined
                      </button>

                      <button
                        className={
                          communityFilter === "created" ? "active" : ""
                        }
                        onClick={() => setCommunityFilter("created")}
                        type="button"
                      >
                        Created by Me
                      </button>
                    </div>
                  </div>

                  <div className="community-search-box">
                    <FaSearch />
                    <input
                      type="text"
                      value={communitySearch}
                      onChange={(e) => setCommunitySearch(e.target.value)}
                      placeholder="Search communities..."
                    />
                  </div>

                  {filteredCommunities.length === 0 && (
                    <p className="empty-text">
                      No communities found for this filter.
                    </p>
                  )}

                  <div className="communities-list">
                    {filteredCommunities.map((community) => (
                      <div
                        className={`community-card ${
                          selectedCommunity?.id === community.id
                            ? "selected"
                            : ""
                        }`}
                        key={community.id}
                      >
                        <div className="community-card-top">
                          <div className="community-avatar">
                            {community.image ? (
                              <img
                                src={getImageSrc(community.image)}
                                alt={community.name}
                              />
                            ) : (
                              <FaUsers />
                            )}
                          </div>

                          <div>
                            <h3>{community.name}</h3>
                            <p>
                              {community.description ||
                                `Created by ${community.creator || "Unknown"}`}
                            </p>
                          </div>
                        </div>

                        <div className="community-meta">
                          <div>
                            <FaUsers />
                            <span>{community.members_count} members</span>
                          </div>

                          <div>
                            <FaBullseye />
                            <span>{community.goals_count} goals</span>
                          </div>

                          {community.role === "admin" && (
                            <div>
                              <FaUserShield />
                              <span>Admin</span>
                            </div>
                          )}
                        </div>

                        <div className="community-actions">
                          <button
                            className="btn-outline"
                            onClick={() => loadCommunityDetails(community.id)}
                          >
                            View
                          </button>

                          {!community.is_member ? (
                            <button
                              className="btn-green"
                              onClick={() => handleJoin(community.id)}
                              disabled={actionLoading}
                            >
                              Join
                            </button>
                          ) : community.role !== "admin" ? (
                            <button
                              className="btn-danger"
                              onClick={() => handleLeave(community.id)}
                              disabled={actionLoading}
                            >
                              Leave
                            </button>
                          ) : (
                            <button className="btn-admin" disabled>
                              Admin
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="community-details-card">
                  {!selectedCommunity ? (
                    <div className="details-empty">
                      <FaUsers />
                      <h3>Select a community</h3>
                      <p>
                        Click “View” on a community to see its members, shared
                        goals, and chat.
                      </p>
                    </div>
                  ) : detailsLoading ? (
                    <InlineLoader
                      text="Loading community..."
                      subtext="Opening details and chat without leaving this page."
                    />
                  ) : (
                    <>
                      <div className="community-details-header">
                        <div className="community-title-row">
                          <div className="community-large-avatar">
                            {selectedCommunity.image ? (
                              <img
                                src={getImageSrc(selectedCommunity.image)}
                                alt={selectedCommunity.name}
                              />
                            ) : (
                              <FaUsers />
                            )}
                          </div>

                          <div>
                            <h2>{selectedCommunity.name}</h2>
                            <p>
                              {selectedCommunity.description ||
                                `Created by ${
                                  selectedCommunity.creator?.name ||
                                  selectedCommunity.creator ||
                                  "Unknown"
                                }`}
                            </p>
                          </div>
                        </div>

                        <div className="community-header-actions">
                          {selectedSummary?.role && (
                            <span className="role-pill">
                              {selectedSummary.role}
                            </span>
                          )}

                          {isSelectedCreator && (
                            <button
                              className="community-edit-btn"
                              onClick={() =>
                                setEditingCommunity(!editingCommunity)
                              }
                            >
                              <FaEdit /> Settings
                            </button>
                          )}
                        </div>
                      </div>

                      {isSelectedCreator && editingCommunity && (
                        <form
                          className="community-settings-card"
                          onSubmit={handleSaveCommunitySettings}
                        >
                          <div className="settings-card-title">
                            <h3>Community Settings</h3>
                            <p>
                              Edit the community name, description, and image.
                            </p>
                          </div>

                          <div className="community-image-upload-row">
                            <div className="community-settings-image">
                              {selectedCommunity.image ? (
                                <img
                                  src={getImageSrc(selectedCommunity.image)}
                                  alt={selectedCommunity.name}
                                />
                              ) : (
                                <FaImage />
                              )}
                            </div>

                            <label className="community-upload-btn">
                              Upload Image
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleCommunityImageUpload}
                                disabled={actionLoading}
                              />
                            </label>
                          </div>

                          <input
                            type="text"
                            value={editCommunityName}
                            onChange={(e) =>
                              setEditCommunityName(e.target.value)
                            }
                            placeholder="Community name"
                          />

                          <textarea
                            value={editCommunityDescription}
                            onChange={(e) =>
                              setEditCommunityDescription(e.target.value)
                            }
                            placeholder="Community description..."
                            rows="4"
                          />

                          <div className="community-settings-actions">
                            <button type="submit" disabled={actionLoading}>
                              <FaSave />{" "}
                              {actionLoading ? "Saving..." : "Save"}
                            </button>

                            <button
                              type="button"
                              className="btn-outline"
                              onClick={() => setEditingCommunity(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {!isSelectedMember && (
                        <div className="join-required-card">
                          <FaUsers />
                          <div>
                            <h3>Join to interact</h3>
                            <p>
                              You can view this community, but you need to join
                              it to chat and share achievements.
                            </p>
                          </div>
                          <button
                            className="btn-green"
                            onClick={() => handleJoin(selectedCommunity.id)}
                          >
                            Join Community
                          </button>
                        </div>
                      )}

                      <div className="details-main-grid">
                        <div>
                          <div className="details-section">
                            <h3>Members</h3>

                            <div className="members-list">
                              {(selectedCommunity.members || []).map(
                                (member) => (
                                  <div className="member-row" key={member.id}>
                                    <UserAvatar
                                      src={member.profile_picture}
                                      name={member.name}
                                      className={`member-avatar ${
                                        member.is_active ? "active" : "offline"
                                      }`}
                                    />

                                    <div className="member-info">
                                      <strong>{member.name}</strong>
                                      <span>{member.email}</span>
                                      <span
                                        className={
                                          member.is_active
                                            ? "active-text"
                                            : "offline-text"
                                        }
                                      >
                                        {member.is_active
                                          ? "Active now"
                                          : "Offline"}
                                      </span>
                                    </div>

                                    <small>{member.pivot?.role || "member"}</small>

                                    {isSelectedMember && (
                                      <div className="member-action-buttons">
                                        {isCurrentUser(member.id) ? (
                                          <button
                                            className="follow-btn me"
                                            disabled
                                          >
                                            Me
                                          </button>
                                        ) : (
                                          <button
                                            className={`follow-btn ${
                                              isFollowing(member.id)
                                                ? "following"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              handleFollowToggle(member)
                                            }
                                            disabled={actionLoading}
                                          >
                                            {isFollowing(member.id) ? (
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

                                        {isSelectedCreator &&
                                          !isCurrentUser(member.id) && (
                                            <button
                                              className="remove-member-btn"
                                              onClick={() =>
                                                handleRemoveMember(member)
                                              }
                                              disabled={actionLoading}
                                            >
                                              Remove
                                            </button>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="details-section monthly-goals-section">
                            <div className="monthly-goals-heading">
                              <div>
                                <h3>
                                  <FaCalendarAlt /> Monthly Goals
                                </h3>
                                <p>
                                  Normal member activities can automatically move
                                  these goals forward when AI detects a match.
                                </p>
                              </div>
                            </div>

                            {selectedMonthlyGoals.length === 0 && (
                              <div className="community-goal-empty">
                                <FaBullseye />
                                <strong>No monthly goals yet</strong>
                                <span>
                                  Add a community goal so members can contribute
                                  through normal activity submissions.
                                </span>
                              </div>
                            )}

                            <div className="goals-list monthly-goals-list">
                              {selectedMonthlyGoals.map((goal) => (
                                <div className="monthly-goal-card" key={goal.id}>
                                  <div className="monthly-goal-top">
                                    <div className="goal-icon-badge">
                                      <FaBullseye />
                                    </div>

                                    <div>
                                      <h4>{goal.title || goal.goal_description}</h4>
                                      <p>{goal.description || goal.goal_description}</p>
                                    </div>
                                  </div>

                                  <div className="goal-badges-row">
                                    <span className="goal-category-badge">
                                      {goal.category || "custom"}
                                    </span>
                                    <span className="goal-score-badge">
                                      <FaMedal /> {goal.score_reward || 0} pts
                                    </span>
                                    <span className={`goal-status-badge ${goal.status}`}>
                                      {goal.status || "active"}
                                    </span>
                                  </div>

                                  <div className="monthly-goal-target">
                                    <span>Target</span>
                                    <strong>
                                      {goal.target || "Reach 100% community progress"}
                                    </strong>
                                  </div>

                                  <div className="monthly-goal-progress-line">
                                    <div>
                                      <span>Monthly progress</span>
                                      <strong>{Math.round(goal.progress || 0)}%</strong>
                                    </div>
                                    <div className="community-progress-track">
                                      <div
                                        className="community-progress-fill"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            Math.max(0, Number(goal.progress) || 0)
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>

                                  <div className="contributors-leaderboard">
                                    <div className="leaderboard-title">
                                      <FaChartLine /> Contributors
                                    </div>

                                    {(goal.contributors || []).length === 0 ? (
                                      <p className="empty-text small">
                                        No activity contributions yet.
                                      </p>
                                    ) : (
                                      (goal.contributors || []).map(
                                        (contributor, index) => (
                                          <div
                                            className="contributor-row"
                                            key={`${goal.id}-${contributor.user_id}`}
                                          >
                                            <span className="contributor-rank">
                                              #{index + 1}
                                            </span>
                                            <UserAvatar
                                              src={contributor.profile_picture}
                                              name={contributor.name}
                                              className="contributor-avatar"
                                            />
                                            <div>
                                              <strong>{contributor.name}</strong>
                                              <small>
                                                {contributor.activities_count} activities · {Math.round(contributor.contribution_points || 0)}%
                                              </small>
                                            </div>
                                            {contributor.score_awarded > 0 && (
                                              <span className="awarded-points">
                                                +{contributor.score_awarded}
                                              </span>
                                            )}
                                          </div>
                                        )
                                      )
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {isSelectedCreator && (
                              <form
                                className="add-goal-form monthly-goal-form"
                                onSubmit={handleAddGoal}
                              >
                                <div className="goal-form-grid">
                                  <input
                                    type="text"
                                    value={newGoal.title}
                                    onChange={(e) =>
                                      handleGoalFormChange("title", e.target.value)
                                    }
                                    placeholder="Monthly goal title"
                                  />

                                  <select
                                    value={newGoal.category}
                                    onChange={(e) =>
                                      handleGoalFormChange("category", e.target.value)
                                    }
                                  >
                                    <option value="custom">Custom</option>
                                    <option value="transport">Transport</option>
                                    <option value="diet">Diet</option>
                                    <option value="energy">Energy</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="waste">Waste</option>
                                    <option value="water">Water</option>
                                    <option value="reuse">Reuse</option>
                                    <option value="carbon">Carbon</option>
                                  </select>

                                  <input
                                    type="text"
                                    value={newGoal.target}
                                    onChange={(e) =>
                                      handleGoalFormChange("target", e.target.value)
                                    }
                                    placeholder="Target, example: Complete 20 bus/walk activities"
                                  />

                                  <input
                                    type="number"
                                    min="50"
                                    max="1000"
                                    value={newGoal.score_reward}
                                    onChange={(e) =>
                                      handleGoalFormChange(
                                        "score_reward",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Reward points"
                                  />
                                </div>

                                <textarea
                                  value={newGoal.description}
                                  onChange={(e) =>
                                    handleGoalFormChange("description", e.target.value)
                                  }
                                  placeholder="Describe what members should do this month..."
                                  rows="3"
                                />

                                <button type="submit" disabled={actionLoading}>
                                  {actionLoading ? "Adding..." : "Add Monthly Goal"}
                                </button>
                              </form>
                            )}
                          </div>



                          <div className="details-section community-score-leaderboard-section">
                            <div className="community-score-heading">
                              <div>
                                <h3><FaTrophy /> Community Leaderboard</h3>
                                <p>Score earned by current members from completed goals and challenges.</p>
                              </div>
                              <span className="community-total-score-badge">
                                {Number(selectedCommunityLeaderboard.total_score || 0).toLocaleString()} pts
                              </span>
                            </div>

                            {(selectedCommunityLeaderboard.top_contributors || []).length === 0 ? (
                              <div className="community-leaderboard-empty">
                                <FaMedal />
                                <strong>No score yet</strong>
                                <span>When members complete goals or challenges, their points appear here.</span>
                              </div>
                            ) : (
                              <div className="community-score-list">
                                {(selectedCommunityLeaderboard.top_contributors || []).map((contributor, index) => (
                                  <div className="community-score-row" key={`score-${contributor.user_id}`}>
                                    <span className="community-score-rank">#{index + 1}</span>
                                    <UserAvatar
                                      src={contributor.profile_picture}
                                      name={contributor.name}
                                      className="community-score-avatar"
                                    />
                                    <div>
                                      <strong>{contributor.name}</strong>
                                      <small>Level {contributor.level || 1}</small>
                                    </div>
                                    <b>{Number(contributor.total_score || contributor.score || 0).toLocaleString()} pts</b>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {isSelectedMember && (
                            <div className="share-panel">
                              <div>
                                <h3>
                                  <FaTrophy /> Share Achievement
                                </h3>
                                <p>
                                  Share your progress inside the community or
                                  copy it for social media.
                                </p>
                              </div>

                              <div className="share-actions">
                                <button
                                  className="share-btn green"
                                  onClick={handleShareAchievementToChat}
                                  disabled={actionLoading}
                                >
                                  <FaComments /> To Chat
                                </button>

                                <button
                                  className="share-btn"
                                  onClick={handleCopyAchievement}
                                >
                                  <FaCopy /> Instagram Copy
                                </button>

                                <button
                                  className="share-btn facebook"
                                  onClick={handleFacebookShare}
                                >
                                  <FaFacebookF /> Facebook
                                </button>

                                <button
                                  className="share-btn"
                                  onClick={handleNativeShare}
                                >
                                  <FaShareAlt /> Share
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {isSelectedMember && (
                          <div className="chat-card">
                            <div className="chat-header whatsapp-style">
                              <div className="chat-community-avatar">
                                {selectedCommunity.image ? (
                                  <img
                                    src={getImageSrc(selectedCommunity.image)}
                                    alt={selectedCommunity.name}
                                  />
                                ) : (
                                  <FaUsers />
                                )}
                              </div>

                              <div>
                                <h3>{selectedCommunity.name}</h3>
                                <p>
                                  {selectedCommunity.members?.length || 0}{" "}
                                  members ·{" "}
                                  {
                                    (selectedCommunity.members || []).filter(
                                      (member) => member.is_active
                                    ).length
                                  }{" "}
                                  active now
                                </p>
                              </div>
                            </div>

                            <div className="messages-list">
                              {messages.length === 0 && (
                                <p className="empty-text">
                                  No messages yet. Start the conversation.
                                </p>
                              )}

                              {messages.map((message) => {
                                const isMine =
                                  Number(message.user?.id) ===
                                  Number(currentUser?.id);

                                return (
                                  <div
                                    className={`message-row ${
                                      isMine ? "mine" : "theirs"
                                    } ${
                                      message.type === "achievement" || message.type === "challenge_share"
                                        ? "achievement"
                                        : ""
                                    }`}
                                    key={message.id}
                                  >
                                    {!isMine && (
                                      <div className="message-avatar-wrapper">
                                        <UserAvatar
                                          src={message.user?.profile_picture}
                                          name={message.user?.name}
                                          className="message-avatar"
                                        />
                                        <span
                                          className={`online-dot ${
                                            message.user?.is_active
                                              ? "active"
                                              : "offline"
                                          }`}
                                        ></span>
                                      </div>
                                    )}

                                    <div className="message-bubble">
                                      {!isMine && (
                                        <div className="message-sender">
                                          {message.user?.name || "User"}
                                        </div>
                                      )}

                                      <p>{message.message}</p>

                                      {message.type === "achievement" && (
                                        <div className="achievement-box">
                                          <FaTrophy />
                                          <div>
                                            <strong>
                                              {message.achievement_data
                                                ?.total_carbon_tracked || 0}{" "}
                                              kg CO2e tracked
                                            </strong>
                                            <span>
                                              {message.achievement_data
                                                ?.activities_count || 0}{" "}
                                              activities logged
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {message.type === "challenge_share" && (
                                        <div className="community-challenge-share-box">
                                          {message.achievement_data?.proof_image_url ? (
                                            <img src={message.achievement_data.proof_image_url} alt={message.achievement_data?.title || "Challenge proof"} />
                                          ) : (
                                            <FaTrophy />
                                          )}
                                          <div>
                                            <strong>{message.achievement_data?.title || "Completed challenge"}</strong>
                                            <span>{message.achievement_data?.description || "Eco challenge completed."}</span>
                                            <em>+{message.achievement_data?.score_awarded || 0} score · x{Number(message.achievement_data?.streak_multiplier || 1).toFixed(2)}</em>
                                          </div>
                                        </div>
                                      )}

                                      <div className="message-meta-line">
                                        <span>{message.created_at}</span>

                                        {isMine && (
                                          <button
                                            type="button"
                                            className={`delivery-status ${
                                              message.is_read_by_everyone
                                                ? "read"
                                                : ""
                                            }`}
                                            title={
                                              message.is_read_by_everyone
                                                ? "Read by everyone"
                                                : `${
                                                    message.read_by_count || 0
                                                  }/${
                                                    message.total_other_members ||
                                                    0
                                                  } members read`
                                            }
                                            onClick={() =>
                                              handleOpenReaders(message)
                                            }
                                          >
                                            ✓✓
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <form
                              className="chat-form"
                              onSubmit={handleSendMessage}
                            >
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) =>
                                  setNewMessage(e.target.value)
                                }
                                placeholder="Write a message..."
                              />

                              <button type="submit" disabled={actionLoading}>
                                <FaPaperPlane />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          )}
        </div>

        {readersModal && (
          <div
            className="readers-backdrop"
            onClick={() => setReadersModal(null)}
          >
            <div
              className="readers-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="readers-modal-header">
                <div>
                  <h3>Read by</h3>
                  <p>{readersModal.message.message}</p>
                </div>

                <button onClick={() => setReadersModal(null)}>
                  <FaTimes />
                </button>
              </div>

              {readersModal.readers.length === 0 ? (
                <p className="empty-text">No one has read this message yet.</p>
              ) : (
                <div className="readers-list">
                  {readersModal.readers.map((reader) => (
                    <div className="reader-row" key={reader.id}>
                      <UserAvatar
                        src={reader.profile_picture}
                        name={reader.name}
                        className="reader-avatar"
                      />

                      <div>
                        <strong>{reader.name}</strong>
                        <span>{reader.email}</span>
                      </div>

                      <small>{reader.read_at}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
