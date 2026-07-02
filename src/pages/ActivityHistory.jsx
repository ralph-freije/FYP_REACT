import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import "./ActivityHistory.css";
import { useNavigate } from "react-router-dom";
import {
  FaCarSide,
  FaUtensils,
  FaBolt,
  FaShoppingBag,
  FaRoute,
  FaCalendarAlt,
  FaLeaf,
  FaArrowRight,
  FaMapMarkerAlt,
  FaClock,
  FaSyncAlt,
  FaFilter,
} from "react-icons/fa";

export default function ActivityHistory() {
  const [activities, setActivities] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/activity");
      setActivities(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    if (activeFilter === "all") return activities;

    return activities.filter(
      (activity) => activity.category?.name?.toLowerCase() === activeFilter
    );
  }, [activities, activeFilter]);

  const totals = useMemo(() => {
    const totalCarbon = activities.reduce(
      (sum, activity) => sum + Number(activity.carbon_value || 0),
      0
    );

    const routeCount = activities.filter(
      (activity) => activity.activity_data?.tracking_type === "route"
    ).length;

    return {
      activities: activities.length,
      totalCarbon: totalCarbon.toFixed(2),
      routes: routeCount,
    };
  }, [activities]);

  const filters = [
    { label: "All", value: "all" },
    { label: "Transport", value: "transport" },
    { label: "Diet", value: "diet" },
    { label: "Energy", value: "energy" },
    { label: "Shopping", value: "shopping" },
  ];

  const getCategoryName = (activity) => {
    return activity.category?.name || "Activity";
  };

  const getIcon = (category, data) => {
    if (data?.tracking_type === "route") {
      return <FaRoute />;
    }

    switch (category?.toLowerCase()) {
      case "transport":
        return <FaCarSide />;
      case "diet":
        return <FaUtensils />;
      case "energy":
        return <FaBolt />;
      case "shopping":
        return <FaShoppingBag />;
      default:
        return <FaLeaf />;
    }
  };

  const getIconClass = (category, data) => {
    if (data?.tracking_type === "route") return "route";

    switch (category?.toLowerCase()) {
      case "transport":
        return "transport";
      case "diet":
        return "diet";
      case "energy":
        return "energy";
      case "shopping":
        return "shopping";
      default:
        return "default";
    }
  };

  const formatDate = (date) => {
    if (!date) return "No date";

    return new Date(date).toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTitle = (activity) => {
    const data = activity.activity_data || {};
    const category = getCategoryName(activity);

    if (data.tracking_type === "route") {
      return "Route Trip";
    }

    if (category.toLowerCase() === "transport") {
      return data.vehicle || "Transport Activity";
    }

    if (category.toLowerCase() === "diet") {
      return data.type || "Diet Activity";
    }

    if (category.toLowerCase() === "energy") {
      return data.type || "Energy Activity";
    }

    if (category.toLowerCase() === "shopping") {
      return data.type || "Shopping Activity";
    }

    return category;
  };

  const formatSubtitle = (activity) => {
    const data = activity.activity_data || {};
    const category = getCategoryName(activity).toLowerCase();

    if (data.tracking_type === "route") {
      return `${data.start_location || "Start"} → ${
        data.end_location || "Destination"
      }`;
    }

    if (category === "transport") {
      return `${data.distance || 0} km traveled`;
    }

    if (category === "diet") {
      return `${data.quantity || 1} item/meal logged`;
    }

    if (category === "energy") {
      return `${data.usage || 0} kWh usage`;
    }

    if (category === "shopping") {
      return `${data.amount || 1} purchase/item logged`;
    }

    return "Activity logged";
  };

  const getActivityDetails = (activity) => {
    const data = activity.activity_data || {};
    const category = getCategoryName(activity).toLowerCase();

    if (data.tracking_type === "route") {
      return [
        {
          label: "Distance",
          value: `${Number(data.distance || 0).toFixed(2)} km`,
        },
        {
          label: "Duration",
          value: data.duration_minutes
            ? `${data.duration_minutes} min`
            : "Not available",
        },
        {
          label: "Vehicle",
          value: data.vehicle || "Vehicle",
        },
        {
          label: "Source",
          value: data.route_source || "Route tracker",
        },
      ];
    }

    if (category === "transport") {
      return [
        {
          label: "Distance",
          value: `${Number(data.distance || 0).toFixed(2)} km`,
        },
        {
          label: "Vehicle",
          value: data.vehicle || "Vehicle",
        },
        {
          label: "Carpool",
          value: data.carpool ? "Enabled" : "No",
        },
        {
          label: "Eco Mode",
          value: data.eco_mode ? "Enabled" : "No",
        },
      ];
    }

    if (category === "diet") {
      return [
        {
          label: "Food",
          value: data.type || "Food item",
        },
        {
          label: "Quantity",
          value: data.quantity || 1,
        },
      ];
    }

    if (category === "energy") {
      return [
        {
          label: "Energy",
          value: data.type || "Energy source",
        },
        {
          label: "Usage",
          value: `${data.usage || 0} kWh`,
        },
      ];
    }

    if (category === "shopping") {
      return [
        {
          label: "Item",
          value: data.type || "Item",
        },
        {
          label: "Amount",
          value: data.amount || 1,
        },
      ];
    }

    return [];
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
        <DashboardBackButton />
        <div className="history-container">
          <div className="history-header">
            <div>
              <span className="history-badge">
                <FaCalendarAlt /> Activity Timeline
              </span>
              <h1>Activity History</h1>
              <p>
                Review your logged carbon activities, route trips, and emissions
                over time.
              </p>
            </div>

            <button className="history-refresh-btn" onClick={loadActivities}>
              <FaSyncAlt /> Refresh
            </button>
          </div>

          <div className="history-summary-grid">
            <div className="history-summary-card">
              <span>Total Activities</span>
              <strong>{totals.activities}</strong>
            </div>

            <div className="history-summary-card">
              <span>Total Carbon</span>
              <strong>{totals.totalCarbon} kg</strong>
            </div>

            <div className="history-summary-card">
              <span>Route Trips</span>
              <strong>{totals.routes}</strong>
            </div>
          </div>

          <div className="history-filter-row">
            <div className="filter-label">
              <FaFilter /> Filter
            </div>

            <div className="history-filters">
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
          </div>

          {loading ? (
            <div className="history-empty-card">Loading history...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="history-empty-card">
              <FaLeaf />
              <h2>No activities found</h2>
              <p>
                Start logging activities from the tracking page to see them here.
              </p>
            </div>
          ) : (
            <div className="history-timeline">
              {filteredActivities.map((activity) => {
                const category = getCategoryName(activity);
                const data = activity.activity_data || {};
                const details = getActivityDetails(activity);

                return (
                  <div
                    key={activity.id}
                    className="history-timeline-card"
                    onClick={() => handleClick(activity)}
                  >
                    <div
                      className={`history-icon ${getIconClass(category, data)}`}
                    >
                      {getIcon(category, data)}
                    </div>

                    <div className="history-card-main">
                      <div className="history-card-top">
                        <div>
                          <span className="history-category">
                            {data.tracking_type === "route"
                              ? "Transport Route"
                              : category}
                          </span>
                          <h3>{formatTitle(activity)}</h3>
                          <p>{formatSubtitle(activity)}</p>
                        </div>

                        <div className="history-carbon-pill">
                          <strong>
                            {Number(activity.carbon_value || 0).toFixed(2)}
                          </strong>
                          <span>kg CO2e</span>
                        </div>
                      </div>

                      {data.tracking_type === "route" && (
                        <div className="route-line-preview">
                          <div className="route-point">
                            <FaMapMarkerAlt />
                            <span>{data.start_location || "Start"}</span>
                          </div>

                          <FaArrowRight className="route-arrow" />

                          <div className="route-point destination">
                            <FaMapMarkerAlt />
                            <span>{data.end_location || "Destination"}</span>
                          </div>
                        </div>
                      )}

                      {details.length > 0 && (
                        <div className="history-detail-grid">
                          {details.map((detail) => (
                            <div key={detail.label}>
                              <span>{detail.label}</span>
                              <strong>{detail.value}</strong>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="history-card-footer">
                        <span>
                          <FaClock /> {formatDate(activity.recorded_at)}
                        </span>
                        <small>Click to edit/reuse</small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}