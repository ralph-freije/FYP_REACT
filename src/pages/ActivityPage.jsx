import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import api from "../api/axios";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  FaBicycle,
  FaBolt,
  FaBus,
  FaArrowRight,
  FaCarSide,
  FaCheckCircle,
  FaCamera,
  FaFileImage,
  FaLeaf,
  FaLocationArrow,
  FaMagic,
  FaMapMarkedAlt,
  FaRecycle,
  FaRoute,
  FaSave,
  FaSearch,
  FaSeedling,
  FaShoppingBag,
  FaTimes,
  FaTrain,
  FaUtensils,
  FaWalking,
} from "react-icons/fa";
import "./ActivityPage.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ACTIVITY_TABS = [
  {
    id: "transport",
    title: "Transport",
    icon: <FaCarSide />,
    description: "Trace a route and calculate trip impact from distance and vehicle type.",
  },
  {
    id: "diet",
    title: "Diet",
    icon: <FaUtensils />,
    description: "Describe a meal and let EcoTrack estimate its carbon footprint.",
  },
  {
    id: "shopping",
    title: "Shopping",
    icon: <FaShoppingBag />,
    description: "Estimate impact from purchases, reuse, electronics, clothing, and groceries.",
  },
  {
    id: "energy",
    title: "Energy",
    icon: <FaBolt />,
    description: "Log electricity, gas, cooling, or appliance usage with smart assistance.",
  },
];

const MANUAL_TRANSPORT_OPTIONS = [
  {
    id: "public-bus",
    label: "Public Bus",
    icon: <FaBus />,
    fuel_type: "Shared transport",
    vehicle_class: "Bus",
    emission_rate_kg_per_km: 0.05,
    emission_rate_source: "manual_shared_transport",
  },
  {
    id: "train",
    label: "Train",
    icon: <FaTrain />,
    fuel_type: "Shared rail",
    vehicle_class: "Train",
    emission_rate_kg_per_km: 0.03,
    emission_rate_source: "manual_shared_transport",
  },
  {
    id: "bicycle",
    label: "Bicycle",
    icon: <FaBicycle />,
    fuel_type: "Human powered",
    vehicle_class: "Bicycle",
    emission_rate_kg_per_km: 0,
    emission_rate_source: "zero_direct_emissions",
  },
  {
    id: "walking",
    label: "Walking",
    icon: <FaWalking />,
    fuel_type: "Human powered",
    vehicle_class: "Walking",
    emission_rate_kg_per_km: 0,
    emission_rate_source: "zero_direct_emissions",
  },
];

const SMART_FORMS = {
  diet: {
    title: "Diet log",
    kicker: "Food impact assistant",
    icon: <FaUtensils />,
    queryLabel: "What did you eat?",
    amountLabel: "Servings / portions",
    unit: "serving",
    placeholder: "Example: chicken rice bowl, vegan salad, beef burger...",
    examples: ["Chicken rice bowl", "Beef burger", "Vegan salad", "Vegetarian lentil meal", "Cheese pizza"],
    uploadTitle: "Scan food photo",
    uploadHelp: "Upload a meal image and EcoTrack fills the food name and servings for you.",
    uploadAccept: "image/*",
    defaultQuery: "Chicken rice bowl",
    defaultAmount: 1,
    saveRefresh: "diet",
  },
  energy: {
    title: "Energy log",
    kicker: "Home energy assistant",
    icon: <FaBolt />,
    queryLabel: "Energy source or appliance",
    amountLabel: "Usage",
    unit: "kWh",
    placeholder: "Example: electricity, solar, AC cooling, gas heating...",
    examples: ["Electricity", "Solar electricity", "Air conditioner", "Gas heating", "Laundry dryer"],
    defaultQuery: "Electricity",
    defaultAmount: 10,
    saveRefresh: "energy",
  },
  shopping: {
    title: "Shopping log",
    kicker: "Purchase impact assistant",
    icon: <FaShoppingBag />,
    queryLabel: "What did you buy?",
    amountLabel: "Quantity",
    unit: "item",
    placeholder: "Example: refurbished phone, jeans, groceries, reusable bottle...",
    examples: ["Refurbished phone", "New jeans", "Groceries", "Reusable bottle", "Second-hand chair"],
    uploadTitle: "Scan receipt or product photo",
    uploadHelp: "Upload a receipt or product image and EcoTrack detects purchases for you.",
    uploadAccept: "image/*",
    defaultQuery: "Groceries",
    defaultAmount: 1,
    saveRefresh: "shopping",
  },
};

function FitRouteBounds({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) return;
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [34, 34] });
  }, [coordinates, map]);

  return null;
}

const numberOf = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const vehicleDisplayName = (vehicle) => {
  if (!vehicle) return "No vehicle selected";
  return (
    vehicle.label ||
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    vehicle.name
  );
};

export default function ActivityPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.category || "transport");

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main activity-shell-bg">
        <DashboardBackButton />
        <div className="dashboard-container activity-container">
          <div className="activity-hero">
            <div>
              <span className="activity-hero-badge">
                <FaLeaf /> Daily carbon tracker
              </span>
              <h1 className="activity-page-title">Track Daily Activity</h1>
              <p className="activity-page-subtitle">
                Log transport, diet, energy, and shopping with smart estimates that still save into your normal carbon history.
              </p>
            </div>
            <div className="activity-hero-orb">
              <FaSeedling />
            </div>
          </div>

          <div className="activity-tabs-grid">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "activity-tab active" : "activity-tab"}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
              >
                <span className="activity-tab-icon">{tab.icon}</span>
                <span className="activity-tab-copy">
                  <strong>{tab.title}</strong>
                  <small>{tab.description}</small>
                </span>
                <span className="activity-tab-cue" aria-hidden="true">
                  <FaArrowRight />
                </span>
              </button>
            ))}
          </div>

          <div className="activity-card modern-activity-card">
            {activeTab === "transport" && <TransportRouteActivity initialData={location.state?.data} />}
            {activeTab === "diet" && <SmartActivityForm category="diet" initialData={location.state?.data} />}
            {activeTab === "energy" && <SmartActivityForm category="energy" initialData={location.state?.data} />}
            {activeTab === "shopping" && <SmartActivityForm category="shopping" initialData={location.state?.data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportRouteActivity({ initialData = {} }) {
  const navigate = useNavigate();
  const [startLocation, setStartLocation] = useState(initialData.start_location || "");
  const [endLocation, setEndLocation] = useState(initialData.end_location || "");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleQuery, setVehicleQuery] = useState(initialData.vehicle || "");
  const [vehicleResults, setVehicleResults] = useState([]);
  const [vehicleSearchMessage, setVehicleSearchMessage] = useState("Search a car model or choose shared transport below.");
  const [vehicleSearchError, setVehicleSearchError] = useState("");
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [success, setSuccess] = useState("");

  const routeCoordinates = useMemo(() => {
    if (!routeData?.coordinates) return [];
    return routeData.coordinates.map((coord) => [coord[1], coord[0]]);
  }, [routeData]);

  const routeDistanceKm = useMemo(() => {
    if (!routeData?.distanceMeters) return 0;
    return routeData.distanceMeters / 1000;
  }, [routeData]);

  const routeDurationMinutes = useMemo(() => {
    if (!routeData?.durationSeconds) return 0;
    return Math.round(routeData.durationSeconds / 60);
  }, [routeData]);

  const selectedEmissionRate = useMemo(
    () => numberOf(selectedVehicle?.emission_rate_kg_per_km, 0),
    [selectedVehicle]
  );

  const carbonEstimate = useMemo(
    () => Number(routeDistanceKm * selectedEmissionRate).toFixed(2),
    [routeDistanceKm, selectedEmissionRate]
  );

  const mapCenter = useMemo(() => {
    if (routeCoordinates.length > 0) return routeCoordinates[Math.floor(routeCoordinates.length / 2)];
    return [33.8938, 35.5018];
  }, [routeCoordinates]);

  const geocodeLocation = async (location) => {
    const query = encodeURIComponent(location.trim());
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    if (!response.ok) throw new Error("Failed to search location.");
    const data = await response.json();
    if (!data || data.length === 0) throw new Error(`Could not find location: ${location}`);
    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      displayName: data[0].display_name,
    };
  };

  const loadVehicleModels = async (query, { autoSelect = false, clearSelection = false } = {}) => {
    setVehicleSearchError("");
    if (clearSelection) setSelectedVehicle(null);

    try {
      setVehicleSearchLoading(true);
      const trimmedQuery = (query || "").trim();
      const response = await api.get("/auth/vehicles/search", {
        params: trimmedQuery ? { q: trimmedQuery, limit: 18 } : { limit: 18 },
      });

      const vehicles = Array.isArray(response.data?.vehicles) ? response.data.vehicles : [];
      setVehicleResults(vehicles);
      setVehicleSearchMessage(
        vehicles.length > 0
          ? "Select the closest matching car model."
          : "No matching car found. Try manufacturer + model, like Mercedes C300 or Toyota Corolla."
      );

      if (autoSelect && vehicles.length > 0) setSelectedVehicle(vehicles[0]);
    } catch (err) {
      console.error(err);
      setVehicleResults([]);
      const apiMessage = err.response?.data?.message;
      setVehicleSearchError(
        apiMessage === "The q field is required."
          ? "Type a car make or model to search the vehicle list."
          : apiMessage || "Failed to load the vehicle model list."
      );
    } finally {
      setVehicleSearchLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadVehicleModels(vehicleQuery, { autoSelect: false, clearSelection: false });
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [vehicleQuery]);

  const searchVehicleModels = async () => {
    await loadVehicleModels(vehicleQuery, {
      autoSelect: Boolean(vehicleQuery.trim()),
      clearSelection: true,
    });
  };

  const selectManualTransport = (option) => {
    setVehicleResults([]);
    setVehicleSearchMessage("");
    setVehicleSearchError("");
    setSelectedVehicle(option);
  };

  const calculateRoute = async () => {
    setRouteError("");
    setSuccess("");
    setRouteData(null);

    if (!startLocation.trim() || !endLocation.trim()) {
      setRouteError("Please enter both start location and destination.");
      return;
    }
    if (!selectedVehicle) {
      setRouteError("Search and select a car model, or choose a shared transport option.");
      return;
    }

    try {
      setRouteLoading(true);
      const start = await geocodeLocation(startLocation);
      const end = await geocodeLocation(endLocation);
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
      const routeResponse = await fetch(routeUrl);
      if (!routeResponse.ok) throw new Error("Could not calculate route.");
      const routeJson = await routeResponse.json();
      if (!routeJson.routes || routeJson.routes.length === 0) {
        throw new Error("No route found between these locations.");
      }
      const route = routeJson.routes[0];
      setRouteData({
        start,
        end,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        coordinates: route.geometry.coordinates,
      });
    } catch (err) {
      console.error(err);
      setRouteError(err.message || "Failed to calculate route.");
    } finally {
      setRouteLoading(false);
    }
  };

  const saveRouteActivity = async () => {
    setRouteError("");
    setSuccess("");

    if (!routeData) {
      setRouteError("Calculate a route before saving.");
      return;
    }
    if (!selectedVehicle) {
      setRouteError("Select a vehicle before saving.");
      return;
    }

    try {
      setSaving(true);
      const limitedCoordinates = routeData.coordinates.filter((_, index) => {
        if (routeData.coordinates.length <= 80) return true;
        return index % Math.ceil(routeData.coordinates.length / 80) === 0;
      });

      await api.post("/auth/activity", {
        category: "transport",
        data: {
          tracking_type: "route",
          start_location: startLocation.trim(),
          end_location: endLocation.trim(),
          start_display_name: routeData.start.displayName,
          end_display_name: routeData.end.displayName,
          start_coordinates: { lat: routeData.start.lat, lon: routeData.start.lon },
          end_coordinates: { lat: routeData.end.lat, lon: routeData.end.lon },
          distance: Number(routeDistanceKm.toFixed(2)),
          duration_minutes: routeDurationMinutes,
          vehicle: vehicleDisplayName(selectedVehicle),
          vehicle_model_id: selectedVehicle.external_id || selectedVehicle.id,
          vehicle_year: selectedVehicle.year || null,
          vehicle_make: selectedVehicle.make || null,
          vehicle_model: selectedVehicle.model || null,
          vehicle_fuel_type: selectedVehicle.fuel_type || null,
          vehicle_class: selectedVehicle.vehicle_class || null,
          engine_displacement_liters: selectedVehicle.engine_displacement_liters || null,
          cylinders: selectedVehicle.cylinders || null,
          combined_mpg: selectedVehicle.combined_mpg || null,
          emission_rate: selectedEmissionRate,
          emission_rate_source: selectedVehicle.emission_rate_source || null,
          carbon_estimate: Number(carbonEstimate),
          route_coordinates: limitedCoordinates,
        },
      });

      setSuccess("Route activity saved successfully.");
      window.setTimeout(() => navigate("/dashboard?refresh=route"), 650);
    } catch (err) {
      console.error(err);
      setRouteError(err?.response?.data?.message || "Failed to save route activity.");
    } finally {
      setSaving(false);
    }
  };

  const clearRoute = () => {
    setStartLocation("");
    setEndLocation("");
    setSelectedVehicle(null);
    setVehicleQuery("");
    setVehicleResults([]);
    setRouteData(null);
    setRouteError("");
    setSuccess("");
    setVehicleSearchMessage("Search a car model or choose shared transport below.");
  };

  return (
    <div className="activity-route-layout">
      <div className="activity-route-form">
        <div className="activity-section-heading">
          <span className="section-icon"><FaMapMarkedAlt /></span>
          <div>
            <p>Transport activity</p>
            <h2>Route Tracking</h2>
            <small>Enter a trip, select a vehicle, calculate the route, then save it as your transport activity.</small>
          </div>
        </div>

        <div className="route-fields-grid">
          <div className="route-field">
            <label><FaLocationArrow /> Start location</label>
            <input value={startLocation} onChange={(e) => setStartLocation(e.target.value)} placeholder="Example: Beirut, Lebanon" />
          </div>
          <div className="route-field">
            <label><FaRoute /> Destination</label>
            <input value={endLocation} onChange={(e) => setEndLocation(e.target.value)} placeholder="Example: Byblos, Lebanon" />
          </div>
        </div>

        <div className="vehicle-search-card activity-vehicle-search-card">
          <div className="vehicle-search-title">
            <span><FaCarSide /></span>
            <div>
              <h3>Choose your car model</h3>
              <p>Search the seeded vehicle database or choose shared transport.</p>
            </div>
          </div>

          <div className="vehicle-search-row">
            <input
              type="text"
              value={vehicleQuery}
              onChange={(e) => {
                setVehicleQuery(e.target.value);
                setSelectedVehicle(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchVehicleModels();
                }
              }}
              placeholder="Example: Mercedes C300, Toyota Corolla, BMW X5..."
            />
            <button className="vehicle-search-btn" onClick={searchVehicleModels} disabled={vehicleSearchLoading}>
              <FaSearch /> {vehicleSearchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {vehicleSearchError ? <div className="route-message error">{vehicleSearchError}</div> : null}
          {!vehicleSearchError && vehicleSearchMessage ? <div className="route-message info">{vehicleSearchMessage}</div> : null}

          {vehicleResults.length > 0 && (
            <div className="vehicle-results-list activity-vehicle-results-list">
              {vehicleResults.map((vehicle) => {
                const active = selectedVehicle?.id === vehicle.id;
                const rate = numberOf(vehicle.emission_rate_kg_per_km, 0);
                return (
                  <button
                    type="button"
                    className={`vehicle-result-card ${active ? "active" : ""}`}
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <span className="vehicle-result-main">
                      <strong>{vehicleDisplayName(vehicle)}</strong>
                      <small>
                        {[vehicle.vehicle_class, vehicle.fuel_type, vehicle.combined_mpg ? `${vehicle.combined_mpg} MPG` : null]
                          .filter(Boolean)
                          .join(" · ") || "Vehicle model"}
                      </small>
                    </span>
                    <span className="vehicle-result-impact">
                      <em>{rate.toFixed(3)} kg/km</em>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="manual-transport-options">
            <span>Shared / zero emission transport</span>
            <div>
              {MANUAL_TRANSPORT_OPTIONS.map((option) => (
                <button key={option.id} type="button" className={selectedVehicle?.id === option.id ? "active" : ""} onClick={() => selectManualTransport(option)}>
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedVehicle && (
          <div className="selected-vehicle-summary">
            <div>
              <span>Selected</span>
              <strong>{vehicleDisplayName(selectedVehicle)}</strong>
            </div>
            <div>
              <span>Rate</span>
              <strong>{selectedEmissionRate.toFixed(3)} kg/km</strong>
            </div>
          </div>
        )}

        {routeError ? <div className="route-message error">{routeError}</div> : null}
        {success ? <div className="route-message success">{success}</div> : null}

        <div className="route-actions">
          <button className="track-primary-btn" onClick={calculateRoute} disabled={routeLoading || saving}>
            <FaMagic /> {routeLoading ? "Calculating..." : "Calculate Route"}
          </button>
          <button className="track-secondary-btn" onClick={clearRoute} disabled={routeLoading || saving}>
            <FaTimes /> Clear
          </button>
        </div>
      </div>

      <div className="activity-route-preview">
        <div className="activity-route-map-panel">
          <MapContainer center={mapCenter} zoom={routeData ? 11 : 9} className="activity-route-map" key={routeData ? `${routeData.start.lat}-${routeData.end.lat}` : "activity-map"}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {routeCoordinates.length > 0 && (
              <>
                <FitRouteBounds coordinates={routeCoordinates} />
                <Polyline positions={routeCoordinates} pathOptions={{ weight: 5 }} />
                <Marker position={[routeData.start.lat, routeData.start.lon]}><Popup>Start: {startLocation}</Popup></Marker>
                <Marker position={[routeData.end.lat, routeData.end.lon]}><Popup>Destination: {endLocation}</Popup></Marker>
              </>
            )}
          </MapContainer>
        </div>

        <div className="route-results activity-route-results">
          <div><span>Distance</span><strong>{routeDistanceKm.toFixed(2)} km</strong></div>
          <div><span>Duration</span><strong>{routeDurationMinutes} min</strong></div>
          <div><span>Carbon</span><strong>{carbonEstimate} kg CO2e</strong></div>
          <button className="save-route-btn" onClick={saveRouteActivity} disabled={saving || !routeData}>
            <FaSave /> {saving ? "Saving..." : "Save Transport Activity"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SmartActivityForm({ category, initialData = {} }) {
  const navigate = useNavigate();
  const config = SMART_FORMS[category];
  const [query, setQuery] = useState(initialData.type || config.defaultQuery);
  const [amount, setAmount] = useState(initialData.amount || initialData.quantity || initialData.usage || config.defaultAmount);
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaAnalyzing, setMediaAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const supportsMediaScan = category === "diet" || category === "shopping";

  const fallbackEstimate = (search, quantity) => {
    const text = `${search}`.toLowerCase();
    let rate = category === "energy" ? 0.45 : category === "shopping" ? 2 : 1.2;
    let label = "Smart estimate";
    let tips = ["EcoTrack used a conservative fallback estimate.", "Add more detail for a better estimate."];

    if (category === "diet") {
      if (text.includes("beef") || text.includes("lamb")) rate = 4.8;
      else if (text.includes("chicken")) rate = 1.7;
      else if (text.includes("vegan") || text.includes("salad")) rate = 0.45;
      else if (text.includes("vegetarian") || text.includes("lentil")) rate = 0.7;
      label = "Food footprint estimate";
    }
    if (category === "energy") {
      if (text.includes("solar")) rate = 0.05;
      else if (text.includes("gas")) rate = 0.62;
      else if (text.includes("generator")) rate = 0.78;
      label = "Energy footprint estimate";
    }
    if (category === "shopping") {
      if (text.includes("phone") || text.includes("laptop") || text.includes("electronics")) rate = 18;
      else if (text.includes("clothing") || text.includes("jeans") || text.includes("shoes")) rate = 5.5;
      else if (text.includes("second") || text.includes("refurbished")) rate = 0.7;
      label = "Shopping footprint estimate";
    }

    const carbon = Number(quantity || 0) * rate;
    return {
      carbon_kg: Number(carbon.toFixed(2)),
      rate: Number(rate.toFixed(3)),
      label,
      confidence: "fallback",
      source: "frontend_fallback_estimate",
      summary: `Estimated ${carbon.toFixed(2)} kg CO2e from ${quantity} ${config.unit} of ${search || "activity"}.`,
      tips,
    };
  };

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setDetectedItems([]);
    setError("");
  };

  const analyzeMedia = async () => {
    if (!mediaFile) {
      setError(category === "diet" ? "Upload a food image first." : "Upload a receipt or product image first.");
      return;
    }

    setError("");
    try {
      setMediaAnalyzing(true);
      const formData = new FormData();
      formData.append("category", category);
      formData.append("image", mediaFile);

      const response = await api.post("/auth/activity/analyze-media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const detected = response.data?.detected || {};
      const items = Array.isArray(detected.items) ? detected.items : [];

      if (items.length > 0) {
        setDetectedItems(items);
        const first = items[0];
        setQuery(first.query || first.name || config.defaultQuery);
        setAmount(Number(first.amount || first.quantity || config.defaultAmount));
        if (first.estimate) setEstimate(first.estimate);
      } else {
        const detectedQuery = detected.query || detected.primary_query || config.defaultQuery;
        const detectedAmount = Number(detected.amount || config.defaultAmount);
        setQuery(detectedQuery);
        setAmount(detectedAmount);
        if (detected.estimate) setEstimate(detected.estimate);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Could not scan the image. You can still type the activity manually.");
    } finally {
      setMediaAnalyzing(false);
    }
  };

  const runEstimate = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setError(`Describe the ${category} activity first.`);
      return;
    }

    setError("");
    try {
      setEstimating(true);
      const response = await api.post("/auth/activity/estimate", {
        category,
        query: cleanQuery,
        amount: Number(amount),
        unit: config.unit,
      });
      setEstimate(response.data?.estimate || fallbackEstimate(cleanQuery, amount));
    } catch (err) {
      console.error(err);
      setEstimate(fallbackEstimate(cleanQuery, amount));
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => runEstimate(), 450);
    return () => window.clearTimeout(timeoutId);
  }, [query, amount, category]);

  const carbon = numberOf(estimate?.carbon_kg, 0);

  const handleSave = async () => {
    if (!query.trim()) {
      setError(`Describe the ${category} activity first.`);
      return;
    }

    setError("");
    try {
      setSaving(true);
      const currentEstimate = estimate || fallbackEstimate(query, amount);
      const payload = {
        type: query.trim(),
        amount: Number(amount),
        unit: config.unit,
        carbon_estimate: numberOf(currentEstimate.carbon_kg, 0),
        emission_rate: numberOf(currentEstimate.rate, 0),
        ai_label: currentEstimate.label,
        ai_confidence: currentEstimate.confidence,
        ai_source: currentEstimate.source,
        ai_summary: currentEstimate.summary,
        ai_tips: currentEstimate.tips || [],
      };

      if (category === "diet") payload.quantity = Number(amount);
      if (category === "energy") payload.usage = Number(amount);

      await api.post("/auth/activity", { category, data: payload });
      navigate(`/dashboard?refresh=${config.saveRefresh}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || `Failed to save ${category} activity.`);
    } finally {
      setSaving(false);
    }
  };

  const saveDetectedShoppingItems = async () => {
    if (category !== "shopping" || detectedItems.length === 0) return;

    setError("");
    try {
      setSaving(true);
      for (const item of detectedItems) {
        const itemQuery = item.query || item.name || "Detected purchase";
        const itemAmount = Number(item.amount || item.quantity || 1);
        const itemEstimate = item.estimate || fallbackEstimate(itemQuery, itemAmount);

        await api.post("/auth/activity", {
          category: "shopping",
          data: {
            type: itemQuery,
            amount: itemAmount,
            quantity: itemAmount,
            unit: config.unit,
            source: "receipt_or_product_scan",
            carbon_estimate: numberOf(itemEstimate.carbon_kg, 0),
            emission_rate: numberOf(itemEstimate.rate, 0),
            ai_label: itemEstimate.label,
            ai_confidence: itemEstimate.confidence,
            ai_source: itemEstimate.source,
            ai_summary: itemEstimate.summary,
            ai_tips: itemEstimate.tips || [],
          },
        });
      }
      navigate(`/dashboard?refresh=${config.saveRefresh}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to save detected shopping items.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setQuery(config.defaultQuery);
    setAmount(config.defaultAmount);
    setError("");
  };

  return (
    <div className="smart-activity-layout">
      <div className="smart-form-panel">
        <div className="activity-section-heading">
          <span className="section-icon">{config.icon}</span>
          <div>
            <p>{config.kicker}</p>
            <h2>{config.title}</h2>
            <small>Describe the activity naturally. EcoTrack estimates the carbon impact and stores it in your normal stats.</small>
          </div>
        </div>

        <div className="smart-input-card">
          <label className="field-label">{config.queryLabel}</label>
          <div className="smart-search-input">
            <FaMagic />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={config.placeholder} />
          </div>
        </div>

        <div className="smart-examples">
          {config.examples.map((example) => (
            <button key={example} type="button" onClick={() => setQuery(example)}>
              {example}
            </button>
          ))}
        </div>

        {supportsMediaScan && (
          <div className="media-scan-card">
            <div className="media-scan-copy">
              <span><FaCamera /></span>
              <div>
                <strong>{config.uploadTitle}</strong>
                <small>{config.uploadHelp}</small>
              </div>
            </div>
            <label className="media-upload-dropzone">
              {mediaPreview ? (
                <img src={mediaPreview} alt="Uploaded activity preview" />
              ) : (
                <span><FaFileImage /> Choose image</span>
              )}
              <input type="file" accept={config.uploadAccept || "image/*"} onChange={handleMediaChange} />
            </label>
            <button className="track-secondary-btn media-scan-btn" type="button" onClick={analyzeMedia} disabled={mediaAnalyzing || !mediaFile}>
              <FaMagic /> {mediaAnalyzing ? "Scanning..." : "Fill from image"}
            </button>
          </div>
        )}

        <div className="amount-card">
          <div>
            <label className="field-label">{config.amountLabel}</label>
          </div>
          <div className="amount-input-wrap">
            <input type="number" min="0" step="0.1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="distance-input" />
            <span>{config.unit}</span>
          </div>
        </div>


        {category === "shopping" && detectedItems.length > 1 && (
          <div className="detected-items-card">
            <div className="detected-items-header">
              <strong>Detected products</strong>
              <span>{detectedItems.length} items</span>
            </div>
            <div className="detected-items-list">
              {detectedItems.map((item, index) => (
                <button
                  type="button"
                  key={`${item.query || item.name}-${index}`}
                  onClick={() => {
                    setQuery(item.query || item.name || "Detected purchase");
                    setAmount(Number(item.amount || item.quantity || 1));
                    if (item.estimate) setEstimate(item.estimate);
                  }}
                >
                  <span>{item.query || item.name || "Detected purchase"}</span>
                  <em>{Number(item.amount || item.quantity || 1)} {config.unit}</em>
                </button>
              ))}
            </div>
            <button className="track-primary-btn" type="button" onClick={saveDetectedShoppingItems} disabled={saving}>
              <FaSave /> {saving ? "Saving..." : "Save all detected products"}
            </button>
          </div>
        )}

        <div className="smart-actions">
          <button className="track-primary-btn" type="button" onClick={runEstimate} disabled={estimating}>
            <FaMagic /> {estimating ? "Analyzing..." : "Analyze Impact"}
          </button>
          <button className="track-secondary-btn" type="button" onClick={resetForm}>
            <FaTimes /> Reset
          </button>
        </div>
      </div>

      <div className="smart-impact-panel">
        <div className="smart-impact-header">
          <span><FaLeaf /></span>
          <div>
            <p>Live Carbon Impact</p>
            <h3>{estimate?.label || "Waiting for activity details"}</h3>
          </div>
        </div>

        <div className="impact-box modern-impact-box">
          <span className="impact-label">Estimated Emissions</span>
          <div className="impact-value-row">
            <h2>{carbon.toFixed(2)}</h2>
            <span className="impact-unit">kg CO2e</span>
          </div>
          <div className="impact-progress">
            <div className="impact-progress-fill" style={{ width: `${Math.min((carbon / 25) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="ai-summary-card">
          <strong><FaCheckCircle /> Smart summary</strong>
          <p>{estimate?.summary || "EcoTrack will summarize the estimated impact here."}</p>
        </div>

        <div className="smart-tips-grid">
          {(estimate?.tips || ["Add a clear activity description.", "EcoTrack will suggest practical ways to reduce impact."]).slice(0, 2).map((tip) => (
            <div className="smart-tip" key={tip}>
              <FaRecycle />
              <span>{tip}</span>
            </div>
          ))}
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        <button type="button" className="btn-green" onClick={handleSave} disabled={saving || estimating}>
          {saving ? "Saving..." : "Save Activity"}
        </button>
      </div>
    </div>
  );
}
