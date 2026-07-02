import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import {
  FaBolt,
  FaCarSide,
  FaChartLine,
  FaHistory,
  FaLeaf,
  FaMapMarkedAlt,
  FaShoppingBag,
  FaUtensils,
} from "react-icons/fa";
import "./TrackPage.css";

const categories = [
  {
    id: "transport",
    title: "Transport",
    icon: <FaCarSide />,
    description: "Trace a real route with a map, choose a vehicle, and save the trip as a transport activity.",
    color: "green",
  },
  {
    id: "diet",
    title: "Diet",
    icon: <FaUtensils />,
    description: "Describe your meal and let EcoTrack estimate the food footprint with smart estimate logic.",
    color: "blue",
  },
  {
    id: "energy",
    title: "Energy",
    icon: <FaBolt />,
    description: "Log electricity, gas, cooling, or appliance usage with a live impact assistant.",
    color: "yellow",
  },
  {
    id: "shopping",
    title: "Shopping",
    icon: <FaShoppingBag />,
    description: "Estimate carbon impact from purchases like clothes, electronics, groceries, or reuse items.",
    color: "purple",
  },
];

export default function TrackPage() {
  const navigate = useNavigate();

  const openCategory = (category) => {
    navigate("/activity", { state: { category } });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardBackButton />
        <div className="track-container">
          <div className="track-header">
            <div>
              <span className="track-badge"><FaLeaf /> Smart activity tracker</span>
              <h1>Track your daily impact</h1>
              <p>
                Route tracking now lives inside the Transport activity. Diet, Energy, and Shopping also use smart estimates so every activity is logged with a clearer carbon explanation.
              </p>
            </div>

            <div className="track-header-actions">
              <button className="track-secondary-btn" onClick={() => navigate("/history")}>
                <FaHistory /> View History
              </button>
              <button className="track-primary-btn" onClick={() => navigate("/activity")}>
                + Log Activity
              </button>
            </div>
          </div>

          <div className="track-overview-card">
            <div className="track-overview-icon"><FaChartLine /></div>
            <div>
              <h2>One activity flow</h2>
              <p>
                Use the activity page as the main tracking workspace. Transport uses a route map, while Diet, Energy, and Shopping use guided forms with live carbon estimates and reduction tips.
              </p>
            </div>
          </div>

          <div className="track-grid">
            {categories.map((category) => (
              <div className="track-card" key={category.id}>
                <div className={`track-card-icon ${category.color}`}>{category.icon}</div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <button onClick={() => openCategory(category.id)}>
                  {category.id === "transport" ? <FaMapMarkedAlt /> : category.icon}
                  Track {category.title}
                </button>
              </div>
            ))}
          </div>

          <div className="track-bottom-grid">
            <div className="track-info-card">
              <h3>Transport route tracing</h3>
              <p>
                The map, route distance, vehicle model search, and carbon calculation are now part of the Transport activity instead of being separate from the activity flow.
              </p>
            </div>
            <div className="track-info-card">
              <h3>Guided categories</h3>
              <p>
                Diet, Energy, and Shopping ask for natural descriptions, estimate emissions, show tips, and then save the activity normally to the same dashboard and history system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
