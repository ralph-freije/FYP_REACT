import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import InlineLoader from "../components/InlineLoader";
import UserAvatar from "../components/UserAvatar";
import {
  getPrivateConversations,
  getMutualUsers,
  startPrivateConversation,
  getPrivateMessages,
  sendPrivateMessage,
  sharePrivateAchievement,
  markPrivateMessagesRead,
  getPrivateMessageReaders,
} from "../api/privateChatApi";
import {
  FaSearch,
  FaPaperPlane,
  FaUserFriends,
  FaComments,
  FaTrophy,
  FaTimes,
  FaLeaf,
} from "react-icons/fa";
import "./Messages.css";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [mutualUsers, setMutualUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [readersModal, setReadersModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedOtherUser = selectedConversation?.other_user;

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });
  }, [conversations]);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const loadConversations = async () => {
    const res = await getPrivateConversations();
    setConversations(res.data || []);
    return res.data || [];
  };

  const loadMutualUsers = async (search = query) => {
    const res = await getMutualUsers(search);
    setMutualUsers(res.data || []);
  };

  const loadMessages = async (conversationId, showLoader = true) => {
    try {
      if (showLoader) {
        setChatLoading(true);
      }

      await markPrivateMessagesRead(conversationId);

      const res = await getPrivateMessages(conversationId);
      setMessages(res.data || []);

      await loadConversations();

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
      setError("Failed to load messages.");
    } finally {
      if (showLoader) {
        setChatLoading(false);
      }
    }
  };

  const refreshSelectedConversation = async () => {
    if (!selectedConversation?.id) return;

    try {
      await markPrivateMessagesRead(selectedConversation.id);

      const res = await getPrivateMessages(selectedConversation.id);
      setMessages(res.data || []);

      await loadConversations();

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error("Failed to refresh private messages:", err);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([loadConversations(), loadMutualUsers("")]);
    } catch (err) {
      console.error(err);
      setError("Failed to load private messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedConversation?.id) return;

    let cancelled = false;

    const refreshMessages = async () => {
      if (cancelled) return;
      await refreshSelectedConversation();
    };

    refreshMessages();

    const interval = setInterval(refreshMessages, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedConversation?.id]);

  const handleSearchMutuals = async (e) => {
    e.preventDefault();
    clearAlerts();

    try {
      setActionLoading(true);
      await loadMutualUsers(query);
    } catch (err) {
      console.error(err);
      setError("Failed to search mutual followers.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    clearAlerts();
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  const handleStartConversation = async (user) => {
    clearAlerts();

    try {
      setActionLoading(true);

      const res = await startPrivateConversation(user.id);
      const conversation = res.data.conversation;

      setSelectedConversation(conversation);
      await loadConversations();
      await loadMessages(conversation.id, true);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to start private conversation."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setActionLoading(true);

      await sendPrivateMessage(selectedConversation.id, {
        message: newMessage.trim(),
      });

      setNewMessage("");
      await loadMessages(selectedConversation.id, false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareAchievement = async () => {
    clearAlerts();

    if (!selectedConversation) return;

    try {
      setActionLoading(true);

      await sharePrivateAchievement(selectedConversation.id);
      setSuccess("Achievement shared.");
      await loadMessages(selectedConversation.id, false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to share achievement.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReaders = async (message) => {
    clearAlerts();

    if (!message?.is_mine) return;

    try {
      await refreshSelectedConversation();

      const res = await getPrivateMessageReaders(message.id);

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
    <div className="messages-layout">
      <Sidebar />

      <main className="messages-main">
        <div className="messages-container">
          <div className="messages-header">
            <div>
              <h1>Messages</h1>
              <p>Private conversations between users who follow each other.</p>
            </div>
          </div>

          {loading ? (
            <InlineLoader
              text="Loading messages..."
              subtext="Loading conversations...."
            />
          ) : (
            <>
              {error && (
                <div className="message-alert error">
                  <span>{error}</span>
                  <button onClick={() => setError("")}>
                    <FaTimes />
                  </button>
                </div>
              )}

              {success && (
                <div className="message-alert success">
                  <span>{success}</span>
                  <button onClick={() => setSuccess("")}>
                    <FaTimes />
                  </button>
                </div>
              )}

              <div className="messages-grid">
                <section className="dm-sidebar-card">
                  <div className="dm-panel-title">
                    <FaComments />
                    <div>
                      <h2>Chats</h2>
                      <p>Your private DM conversations</p>
                    </div>
                  </div>

                  <div className="conversation-list">
                    {sortedConversations.length === 0 && (
                      <p className="empty-text">No conversations yet.</p>
                    )}

                    {sortedConversations.map((conversation) => (
                      <button
                        className={`conversation-row ${
                          selectedConversation?.id === conversation.id
                            ? "active"
                            : ""
                        }`}
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <UserAvatar
                          src={conversation.other_user?.profile_picture}
                          name={conversation.other_user?.name}
                          className={`dm-avatar ${
                            conversation.other_user?.is_active
                              ? "active"
                              : "offline"
                          }`}
                        />

                        <div className="conversation-info">
                          <strong>{conversation.other_user?.name}</strong>
                          <span>
                            {conversation.last_message
                              ? `${
                                  conversation.last_message.is_mine ? "You: " : ""
                                }${conversation.last_message.message}`
                              : "No messages yet"}
                          </span>
                        </div>

                        {conversation.unread_count > 0 && (
                          <small className="unread-badge">
                            {conversation.unread_count}
                          </small>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mutual-section">
                    <div className="dm-panel-title smaller">
                      <FaUserFriends />
                      <div>
                        <h3>Start New Chat</h3>
                        <p>Only mutual followers appear here</p>
                      </div>
                    </div>

                    <form
                      className="mutual-search"
                      onSubmit={handleSearchMutuals}
                    >
                      <FaSearch />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search mutual followers..."
                      />
                      <button type="submit" disabled={actionLoading}>
                        Search
                      </button>
                    </form>

                    <div className="mutual-list">
                      {mutualUsers.length === 0 && (
                        <p className="empty-text">
                          No mutual followers found. Follow each other first.
                        </p>
                      )}

                      {mutualUsers.map((user) => (
                        <button
                          className="mutual-user-row"
                          key={user.id}
                          onClick={() => handleStartConversation(user)}
                        >
                          <UserAvatar
                            src={user.profile_picture}
                            name={user.name}
                            className={`dm-avatar small ${
                              user.is_active ? "active" : "offline"
                            }`}
                          />

                          <div>
                            <strong>{user.name}</strong>
                            <span>
                              {user.is_active ? "Active now" : "Offline"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="dm-chat-card">
                  {!selectedConversation ? (
                    <div className="dm-empty">
                      <FaComments />
                      <h3>Select a chat</h3>
                      <p>
                        Choose an existing conversation or start a new one with a
                        mutual follower.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="dm-chat-header">
                        <UserAvatar
                          src={selectedOtherUser?.profile_picture}
                          name={selectedOtherUser?.name}
                          className={`dm-avatar ${
                            selectedOtherUser?.is_active ? "active" : "offline"
                          }`}
                        />

                        <div>
                          <h2>{selectedOtherUser?.name}</h2>
                          <p>
                            {selectedOtherUser?.is_active
                              ? "Active now"
                              : selectedOtherUser?.last_seen_at
                              ? `Last seen ${selectedOtherUser.last_seen_at}`
                              : "Offline"}
                          </p>
                        </div>

                        <button
                          className="achievement-dm-btn"
                          onClick={handleShareAchievement}
                          disabled={actionLoading}
                        >
                          <FaTrophy /> Share Achievement
                        </button>
                      </div>

                      <div className="dm-messages">
                        {chatLoading && messages.length === 0 ? (
                          <InlineLoader
                            text="Loading chat..."
                            subtext="Fetching the latest messages."
                          />
                        ) : messages.length === 0 ? (
                          <p className="empty-text">
                            No messages yet. Start the conversation.
                          </p>
                        ) : (
                          messages.map((message) => (
                            <div
                              className={`dm-message-row ${
                                message.is_mine ? "mine" : "theirs"
                              } ${
                                message.type === "achievement"
                                  ? "achievement"
                                  : ""
                              }`}
                              key={message.id}
                            >
                              {!message.is_mine && (
                                <UserAvatar
                                  src={message.user?.profile_picture}
                                  name={message.user?.name}
                                  className={`dm-message-avatar ${
                                    message.user?.is_active
                                      ? "active"
                                      : "offline"
                                  }`}
                                />
                              )}

                              <div className="dm-bubble">
                                {!message.is_mine && (
                                  <strong>{message.user?.name}</strong>
                                )}

                                <p>{message.message}</p>

                                {message.type === "achievement" && (
                                  <div className="dm-achievement-box">
                                    <FaLeaf />
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

                                <div className="dm-meta">
                                  <span>{message.created_at}</span>

                                  {message.is_mine && (
                                    <button
                                      type="button"
                                      className={`dm-ticks ${
                                        message.is_read ? "read" : ""
                                      }`}
                                      title={
                                        message.is_read ? "Read" : "Delivered"
                                      }
                                      onClick={() => handleOpenReaders(message)}
                                    >
                                      ✓✓
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <form className="dm-form" onSubmit={handleSendMessage}>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Write a private message..."
                        />

                        <button type="submit" disabled={actionLoading}>
                          <FaPaperPlane />
                        </button>
                      </form>
                    </>
                  )}
                </section>
              </div>
            </>
          )}
        </div>

        {readersModal && (
          <div
            className="dm-readers-backdrop"
            onClick={() => setReadersModal(null)}
          >
            <div
              className="dm-readers-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dm-readers-header">
                <div>
                  <h3>Read by</h3>
                  <p>{readersModal.message.message}</p>
                </div>

                <button onClick={() => setReadersModal(null)}>
                  <FaTimes />
                </button>
              </div>

              {readersModal.readers.length === 0 ? (
                <p className="empty-text">Not read yet.</p>
              ) : (
                <div className="dm-readers-list">
                  {readersModal.readers.map((reader) => (
                    <div className="dm-reader-row" key={reader.id}>
                      <UserAvatar
                        src={reader.profile_picture}
                        name={reader.name}
                        className="dm-avatar small"
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
