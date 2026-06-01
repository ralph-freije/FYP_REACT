import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageLoader from "../components/PageLoader";
import { getProfile, updateProfile, uploadAvatar } from "../api/profileApi";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

    return src;
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

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data.user);
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

  if (!profile) return <PageLoader text="Loading settings..." />;

  const avatarSrc = getAvatarSrc(profile.profile?.profile_picture);

  const handleChange = (field, value) => {
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        [field]: value,
      },
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);
      const uploadRes = await uploadAvatar(formData);

      setProfile({
        ...profile,
        profile: {
          ...profile.profile,
          profile_picture: uploadRes.data.avatar,
        },
      });

      await loadProfile();
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const res = await updateProfile({
        name: profile.name,
        weekly_report: profile.profile?.weekly_report,
        sustainability_alerts: profile.profile?.sustainability_alerts,
        public_profile: profile.profile?.public_profile,
      });

      setProfile(res.data.user);
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
        <div className="settings-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account preferences and climate impact visibility.</p>
          </div>
        </div>

        <section className="settings-card">
          <div className="settings-card-header">
            <h3>Account Information</h3>
            <p>Update your profile photo and personal information.</p>
          </div>

          <div className="avatar-upload">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                className="profile-pic"
                alt="Profile"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />
            ) : null}

            <div
              className="profile-pic-fallback"
              style={{ display: avatarSrc ? "none" : "flex" }}
            >
              {getInitials()}
            </div>

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
                handleChange("weekly_report", !profile.profile?.weekly_report)
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
                handleChange("public_profile", !profile.profile?.public_profile)
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
            <button className="save-btn" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}