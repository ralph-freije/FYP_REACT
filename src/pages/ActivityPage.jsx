import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import "./ActivityPage.css";
const VEHICLE_OPTIONS = [
  { name: "Electric Car (Tesla Model 3)", emission: 0.05, compareLabel: "vs Public Bus" },
  { name: "Hybrid Car (Toyota Prius)", emission: 0.08, compareLabel: "vs Public Bus" },
  { name: "Petrol Car (Sedan)", emission: 0.12, compareLabel: "vs Public Bus" },
  { name: "Petrol Car (SUV)", emission: 0.18, compareLabel: "vs Public Bus" },
  { name: "Public Bus", emission: 0.05, compareLabel: "vs Train" },
  { name: "Train", emission: 0.03, compareLabel: "vs Public Bus" },
  { name: "Bicycle", emission: 0, compareLabel: "vs Public Bus" },
];

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState("transport");

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-container">
          <h1 className="activity-page-title">Track Daily Activity</h1>
          <p className="activity-page-subtitle">
            Log your habits to calculate your real-time carbon footprint.
          </p>

          <div className="tabs">
            {["transport", "diet", "energy", "shopping"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="activity-card">
            {activeTab === "transport" && <TransportForm />}
            {activeTab === "diet" && <ComingSoon title="Diet" />}
            {activeTab === "energy" && <ComingSoon title="Energy" />}
            {activeTab === "shopping" && <ComingSoon title="Shopping" />}
          </div>

          <div className="goals-section">
            <h3>Your Sustainability Goals</h3>

            <div className="goals-grid">
              <div className="goal-card">
                <h4>Renewable Energy Shift</h4>
                <p>Progress: 25%</p>
              </div>

              <div className="goal-card">
                <h4>Zero Waste Month</h4>
                <p>Progress: 82%</p>
              </div>

              <div className="goal-card">
                <h4>Reforestation Support</h4>
                <p>Progress: 0%</p>
              </div>

              <div className="goal-card">
                <h4>Carbon Footprint</h4>
                <p>Progress: 85%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportForm() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [distance, setDistance] = useState(42);
  const [vehicle, setVehicle] = useState(VEHICLE_OPTIONS[0]);
  const [search, setSearch] = useState(VEHICLE_OPTIONS[0].name);
  const [open, setOpen] = useState(false);
  const [carpool, setCarpool] = useState(false);
  const [ecoMode, setEcoMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return VEHICLE_OPTIONS;

    return VEHICLE_OPTIONS.filter((item) =>
      item.name.toLowerCase().includes(keyword)
    );
  }, [search]);

  const adjustedEmissionRate = useMemo(() => {
    let rate = vehicle?.emission ?? 0.12;

    if (carpool) rate *= 0.8;
    if (ecoMode) rate *= 0.9;

    return rate;
  }, [vehicle, carpool, ecoMode]);

  const carbon = useMemo(() => {
    return (Number(distance) * adjustedEmissionRate).toFixed(2);
  }, [distance, adjustedEmissionRate]);

  const comparisonText = useMemo(() => {
    const busRate = 0.05;
    const current = Number(carbon);
    const busEmission = Number(distance) * busRate;

    if (current === 0) return "You produce almost no CO2";
    if (current < busEmission) return "You produce less CO2";
    if (current > busEmission) return "You produce more CO2";
    return "You produce about the same CO2";
  }, [carbon, distance]);

  const handleVehicleSelect = (selectedVehicle) => {
    setVehicle(selectedVehicle);
    setSearch(selectedVehicle.name);
    setOpen(false);
  };

  const handleSave = async () => {
    if (!search.trim()) {
      setSaveError("Please choose a vehicle type.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      await api.post("/auth/activity", {
        category: "transport",
        data: {
          distance: Number(distance),
          vehicle: vehicle?.name || search.trim(),
          carpool,
          eco_mode: ecoMode,
          carbon_estimate: Number(carbon),
        },
      });

      navigate("/dashboard?refresh=activity-saved");
    } catch (error) {
      console.error("Failed to save activity:", error);
      setSaveError(
        error?.response?.data?.message || "Failed to save activity. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDistance(42);
    setVehicle(VEHICLE_OPTIONS[0]);
    setSearch(VEHICLE_OPTIONS[0].name);
    setCarpool(false);
    setEcoMode(false);
    setOpen(false);
    setSaveError("");
  };

  return (
    <div className="activity-layout">
      <div className="activity-left">
        <h3>Transport Details</h3>

        <label className="field-label">Vehicle Type</label>

        <div
          className={`custom-select ${open ? "open" : ""}`}
          ref={dropdownRef}
        >
          <input
            type="text"
            className="vehicle-input"
            placeholder="Search vehicle..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />

          {open && (
            <div className="vehicle-dropdown">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className={`option ${vehicle?.name === item.name ? "selected-option" : ""}`}
                    onClick={() => handleVehicleSelect(item)}
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <div className="option no-results">No matching vehicle found</div>
              )}
            </div>
          )}
        </div>

       <div className="distance-header">
  <label className="field-label">Distance Traveled</label>

  <input
    type="number"
    min="0"
    max="250"
    value={distance}
    onChange={(e) => {
      let value = Number(e.target.value);
      if (value > 250) value = 250;
      if (value < 0) value = 0;
      setDistance(value);
    }}
    className="distance-input"
  />
</div>

<div className="slider-labels">
  <span>0 km</span>
  <span>250 km</span>
</div>

        <input
          className="distance-slider"
          type="range"
          min="0"
          max="250"
          step="1"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
        />

        <div className="slider-labels">
          <span>0 km</span>
          <span>250 km</span>
        </div>

        <div className="options-section">
          <h4 className="options-title">Additional Options</h4>

          <div className="toggle-card">
            <div className="toggle-text">
              <span>Carpooling with others</span>
              <small>Share rides to reduce emissions</small>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={carpool}
                onChange={() => setCarpool((prev) => !prev)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="toggle-card">
            <div className="toggle-text">
              <span>Eco-mode driving enabled</span>
              <small>Reduces fuel consumption</small>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={ecoMode}
                onChange={() => setEcoMode((prev) => !prev)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="activity-right">
        <h3>Live Carbon Impact</h3>

        <div className="impact-box">
          <span className="impact-label">Estimated Emissions</span>
          <div className="impact-value-row">
            <h2>{carbon}</h2>
            <span className="impact-unit">kg CO2e</span>
          </div>
          <div className="impact-progress">
            <div
              className="impact-progress-fill"
              style={{ width: `${Math.min((Number(carbon) / 25) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="comparison">
          <p>{vehicle?.compareLabel || "vs Public Bus"}</p>
          <small>{comparisonText}</small>
        </div>

        {saveError ? <div className="error-message">{saveError}</div> : null}

        <button
          type="button"
          className="btn-green"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Activity"}
        </button>

        <button
          type="button"
          className="btn-light"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="coming-soon">
      <h3>{title} Form</h3>
      <p>Coming next step 🚀</p>
    </div>
  );
}