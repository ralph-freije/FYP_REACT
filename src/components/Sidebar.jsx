import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../api/profileApi";
import "./Sidebar.css";

export default function Sidebar() {

  const [user, setUser] = useState(null);

  useEffect(() => {

    const loadUser = async () => {
      const res = await getProfile();
      setUser(res.data.user);
    };

    loadUser();

  }, []);

  return (

    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">

        <div className="logo-circle">🌱</div>

        <div className="logo-text">
          <div className="logo-title">EcoTrack</div>
          <div className="logo-sub">Carbon Tracking</div>
        </div>

      </div>

      {/* Navigation */}
      <nav className="sidebar-menu">

        <Link to="/dashboard" className="menu-item">
          Dashboard
        </Link>

        <Link to="/track" className="menu-item">
          Impact Tracking
        </Link>

        <Link to="/settings" className="menu-item active">
          Settings
        </Link>

        <Link to="/notifications" className="menu-item">
          Notifications
        </Link>

        <Link to="/privacy" className="menu-item">
          Privacy
        </Link>

      </nav>

      {/* Bottom profile */}
      <div className="sidebar-profile">

        <img
          src={user?.profile?.profile_picture || "/default-avatar.png"}
          className="avatar"
        />

        <div>
          <div className="profile-name">{user?.name || "User"}</div>
          <div className="profile-email">{user?.email}</div>
        </div>

      </div>

    </aside>

  );

}