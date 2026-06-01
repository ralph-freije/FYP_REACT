import { useEffect, useState } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import "./ActivityHistory.css";
import { useNavigate } from "react-router-dom";

export default function ActivityHistory() {
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const res = await api.get("/auth/activity");
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatData = (data) => {
    if (!data) return "";

    if (data.vehicle) return `${data.vehicle} • ${data.distance} km`;
    if (data.type && data.quantity) return `${data.type} • ${data.quantity}`;
    if (data.type && data.usage) return `${data.type} • ${data.usage} kWh`;
    if (data.type && data.amount) return `${data.type} • ${data.amount}`;

    return JSON.stringify(data);
  };

  const getIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "transport":
        return "🚗";
      case "diet":
        return "🥗";
      case "energy":
        return "⚡";
      case "shopping":
        return "🛍️";
      default:
        return "📊";
    }
  };

  const handleClick = (activity) => {
    navigate("/activity", {
      state: {
        category: activity.category?.name?.toLowerCase(),
        data: activity.activity_data,
      },
    });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-container">
          <h1 className="history-title">Activity History</h1>

          <div className="history-grid">
            {activities.map((a) => (
              <div
                key={a.id}
                className="history-card"
                onClick={() => handleClick(a)}
              >
                {/* ICON */}
                <div className="history-icon">
                  {getIcon(a.category?.name)}
                </div>

                {/* CONTENT */}
                <div className="history-content">
                  <h3>{a.category?.name || "Activity"}</h3>

                  <p className="history-data">
                    {formatData(a.activity_data)}
                  </p>

                  <p className="history-carbon">
                    {a.carbon_value} kg CO2e
                  </p>

                  <small className="history-date">
                    {new Date(a.recorded_at).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}