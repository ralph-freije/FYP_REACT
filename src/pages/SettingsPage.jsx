import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import InlineLoader from "../components/InlineLoader";
import { getProfile, updateProfile, uploadAvatar } from "../api/profileApi";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const res = await updateProfile({
        name: profile.name,
        weekly_report: Boolean(profile.profile?.weekly_report),
        sustainability_alerts: Boolean(profile.profile?.sustainability_alerts),
        public_profile: Boolean(profile.profile?.public_profile),
      });

      localStorage.setItem("ecotrack_sidebar_user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("profile-updated"));
      setAvatarError(false);
      alert("Profile updated");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="settings-layout">
      <Sidebar />

      <main className="settings-main">
        {!profile ? (
          <InlineLoader
            text="Loading settings..."
            subtext="Your account settings are loading..."
          />
        ) : (
          <>
            <div className="settings-header">
              <div>
                <h1>Settings</h1>
                <p>
                  Manage your account preferences and climate impact visibility.
                </p>
              </div>
            </div>

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
                <p>Control the sustainability notifications you receive.</p>
              </div>

              <div className="toggle">
                <div>
                  <b>Weekly Impact Report</b>
                  <p>Receive a summary every Monday.</p>
                </div>

                <button
                  type="button"
                  className={`switch ${
                    profile.profile?.weekly_report ? "active" : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "weekly_report",
                      !profile.profile?.weekly_report
                    )
                  }
                >
                  <span className="dot"></span>
                </button>
              </div>

              <div className="toggle">
                <div>
                  <b>Sustainability Alerts</b>
                  <p>Alerts when footprint exceeds target.</p>
                </div>

                <button
                  type="button"
                  className={`switch ${
                    profile.profile?.sustainability_alerts ? "active" : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "sustainability_alerts",
                      !profile.profile?.sustainability_alerts
                    )
                  }
                >
                  <span className="dot"></span>
                </button>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <h3>Privacy & Visibility</h3>
                <p>Choose how your activity appears to other users.</p>
              </div>

              <div className="toggle">
                <div>
                  <b>Public Profile</b>
                  <p>Allow others to see achievements.</p>
                </div>

                <button
                  type="button"
                  className={`switch ${
                    profile.profile?.public_profile ? "active" : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "public_profile",
                      !profile.profile?.public_profile
                    )
                  }
                >
                  <span className="dot"></span>
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