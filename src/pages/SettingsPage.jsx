import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import { getProfile, updateProfile, uploadAvatar } from "../api/profileApi";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const getAvatarSrc = (src) => {
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

    if (src.startsWith("avatars/")) {
      return `http://127.0.0.1:8000/storage/${src}`;
    }

    return `http://127.0.0.1:8000/storage/${src}`;
  };

  const getInitials = () => {
    if (!profile?.name) return "U";

    return profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const avatarSrc = useMemo(() => {
    const rawAvatar =
      profile?.profile?.profile_picture ||
      profile?.profile_picture ||
      profile?.avatar ||
      null;

    return getAvatarSrc(rawAvatar);
  }, [profile]);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data.user);
      setAvatarError(false);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setStatusMessage("");

    setProfile((prev) => ({
      ...prev,
      profile: {
        ...(prev.profile || {}),
        [field]: value,
      },
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);
      setAvatarError(false);
      setStatusMessage("");

      const uploadRes = await uploadAvatar(formData);

      setProfile((prev) => ({
        ...prev,
        profile: {
          ...(prev.profile || {}),
          profile_picture: uploadRes.data.avatar,
        },
      }));

      await loadProfile();
      window.dispatchEvent(new Event("profile-updated"));
      setStatusMessage("Profile photo updated.");
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to upload photo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setStatusMessage("");

      const res = await updateProfile({
        name: profile.name,
        weekly_report: Boolean(profile.profile?.weekly_report),
        sustainability_alerts: Boolean(profile.profile?.sustainability_alerts),
        community_notifications: Boolean(
          profile.profile?.community_notifications
        ),
        message_notifications: Boolean(profile.profile?.message_notifications),
        achievement_notifications: Boolean(
          profile.profile?.achievement_notifications
        ),
        goal_reminders: Boolean(profile.profile?.goal_reminders),
        public_profile: Boolean(profile.profile?.public_profile),
        show_activity_stats: Boolean(profile.profile?.show_activity_stats),
        show_online_status: Boolean(profile.profile?.show_online_status),
        show_email: Boolean(profile.profile?.show_email),
        allow_private_messages: Boolean(profile.profile?.allow_private_messages),
        allow_community_invites: Boolean(
          profile.profile?.allow_community_invites
        ),
      });

      setProfile(res.data.user);
      localStorage.setItem(
        "ecotrack_sidebar_user",
        JSON.stringify(res.data.user)
      );
      window.dispatchEvent(new Event("profile-updated"));
      setAvatarError(false);
      setStatusMessage("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const ToggleRow = ({ title, description, field }) => (
    <div className="toggle">
      <div>
        <b>{title}</b>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`switch ${profile.profile?.[field] ? "active" : ""}`}
        onClick={() => handleChange(field, !profile.profile?.[field])}
        aria-label={title}
      >
        <span className="dot"></span>
      </button>
    </div>
  );

  return (
    <div className="settings-layout">
      <Sidebar />

      <main className="settings-main">
        <DashboardBackButton />
        {!profile ? (
          <InlineLoader
            text="Loading settings..."
            subtext="Your account settings are loading..."
          />
        ) : (
          <>
            <div className="settings-header">
              <div>
                <span className="settings-badge">Account Center</span>
                <h1>Settings</h1>
                <p>
                  Manage your profile, notification preferences, privacy, and
                  account visibility.
                </p>
              </div>
            </div>

            {statusMessage && (
              <div
                className={`settings-status ${
                  statusMessage.toLowerCase().includes("failed")
                    ? "error"
                    : "success"
                }`}
              >
                {statusMessage}
              </div>
            )}

            <section className="settings-card">
              <div className="settings-card-header">
                <h3>Account Information</h3>
                <p>Update your profile photo and personal information.</p>
              </div>

              <div className="avatar-upload">
                {avatarSrc && !avatarError ? (
                  <img
                    src={avatarSrc}
                    className="profile-pic"
                    alt="Profile"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="profile-pic-fallback">{getInitials()}</div>
                )}

                <div className="avatar-upload-actions">
                  <label className="upload-btn">
                    {uploading ? "Uploading..." : "Upload Photo"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                  <span>JPG, PNG, or WEBP up to 2MB.</span>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={profile.name || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input value={profile.email || ""} readOnly />
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <h3>Notification Preferences</h3>
                <p>Control which sustainability updates you receive.</p>
              </div>

              <div className="settings-two-column">
                <ToggleRow
                  title="Weekly Impact Report"
                  description="Receive a summary of your climate impact every Monday."
                  field="weekly_report"
                />

                <ToggleRow
                  title="Sustainability Alerts"
                  description="Get alerts when your carbon footprint exceeds your target."
                  field="sustainability_alerts"
                />

                <ToggleRow
                  title="Community Notifications"
                  description="Get notified when members join, leave, post, or update goals."
                  field="community_notifications"
                />

                <ToggleRow
                  title="Message Notifications"
                  description="Receive notifications for private and community messages."
                  field="message_notifications"
                />

                <ToggleRow
                  title="Achievement Notifications"
                  description="Be notified when you unlock personal or community achievements."
                  field="achievement_notifications"
                />

                <ToggleRow
                  title="Goal Reminders"
                  description="Receive reminders about active personal goals."
                  field="goal_reminders"
                />
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <h3>Privacy & Visibility</h3>
                <p>Choose what other EcoTrack users can see about you.</p>
              </div>

              <div className="privacy-note">
                These options control what your profile is allowed to show.
                Some visibility enforcement may depend on public profile and
                social features.
              </div>

              <div className="settings-two-column">
                <ToggleRow
                  title="Public Profile"
                  description="Allow other users to open your profile page."
                  field="public_profile"
                />

                <ToggleRow
                  title="Show Activity Stats"
                  description="Show CO2 tracked, activity count, and top category on your public profile."
                  field="show_activity_stats"
                />

                <ToggleRow
                  title="Show Online Status"
                  description="Let others see if you are active now or offline."
                  field="show_online_status"
                />

                <ToggleRow
                  title="Show Email"
                  description="Allow other users to see your email on profile and social cards."
                  field="show_email"
                />

                <ToggleRow
                  title="Allow Private Messages"
                  description="Allow mutual followers to start or continue private chats with you."
                  field="allow_private_messages"
                />

                <ToggleRow
                  title="Allow Community Invites"
                  description="Allow community members to invite you to sustainability groups."
                  field="allow_community_invites"
                />
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <h3>Local Desktop Notifications</h3>
                <p>
                  This controls browser desktop notifications on this device
                  only.
                </p>
              </div>

              <div className="desktop-help-card">
                <div>
                  <b>Desktop notification permission</b>
                  <p>
                    Manage this from the Notifications page. Browser permissions
                    are stored locally and are not part of your backend profile.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => (window.location.href = "/notifications")}
                >
                  Open Notifications
                </button>
              </div>
            </section>

            <section className="settings-actions-card">
              <div>
                <h3>Account Actions</h3>
                <p>Save your updates or end your current session.</p>
              </div>

              <div className="settings-actions">
                <button
                  className="save-btn"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}