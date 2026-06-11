import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  FaCarSide,
  FaUtensils,
  FaBolt,
  FaShoppingBag,
  FaChartLine,
  FaHistory,
  FaMapMarkedAlt,
  FaLocationArrow,
  FaRoute,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import "./TrackPage.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const categories = [
  {
    id: "transport",
    title: "Transport",
    icon: <FaCarSide />,
    description: "Track car, bus, train, bicycle, and daily travel emissions.",
    color: "green",
  },
  {
    id: "diet",
    title: "Diet",
    icon: <FaUtensils />,
    description: "Log meals and understand the footprint of your food choices.",
    color: "blue",
  },
  {
    id: "energy",
    title: "Energy",
    icon: <FaBolt />,
    description: "Track electricity, gas, solar usage, and home energy impact.",
    color: "yellow",
  },
  {
    id: "shopping",
    title: "Shopping",
    icon: <FaShoppingBag />,
    description: "Measure emissions from clothing, electronics, and purchases.",
    color: "purple",
  },
];

const VEHICLE_OPTIONS = [
  { name: "Electric Car (Tesla Model 3)", emission: 0.05 },
  { name: "Hybrid Car (Toyota Prius)", emission: 0.08 },
  { name: "Petrol Car (Sedan)", emission: 0.12 },
  { name: "Petrol Car (SUV)", emission: 0.18 },
  { name: "Public Bus", emission: 0.05 },
  { name: "Train", emission: 0.03 },
  { name: "Bicycle", emission: 0 },
  { name: "Walking", emission: 0 },
];

function FitRouteBounds({ coordinates }) {
  const map = useMap();

  useMemo(() => {
    if (!coordinates || coordinates.length < 2) return;

    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, {
      padding: [30, 30],
    });
  }, [coordinates, map]);

  return null;
}

export default function TrackPage() {
  const navigate = useNavigate();

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_OPTIONS[2]);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [success, setSuccess] = useState("");

  const openCategory = (category) => {
    navigate("/activity", {
      state: {
        category,
      },
    });
  };

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

  const carbonEstimate = useMemo(() => {
    return Number(routeDistanceKm * selectedVehicle.emission).toFixed(2);
  }, [routeDistanceKm, selectedVehicle]);

  const mapCenter = useMemo(() => {
    if (routeCoordinates.length > 0) {
      return routeCoordinates[Math.floor(routeCoordinates.length / 2)];
    }

    return [33.8938, 35.5018];
  }, [routeCoordinates]);

  const geocodeLocation = async (location) => {
    const query = encodeURIComponent(location.trim());

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
    );

    if (!response.ok) {
      throw new Error("Failed to search location.");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`Could not find location: ${location}`);
    }

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      displayName: data[0].display_name,
    };
  };

  const calculateRoute = async () => {
    setRouteError("");
    setSuccess("");
    setRouteData(null);

    if (!startLocation.trim() || !endLocation.trim()) {
      setRouteError("Please enter both start location and destination.");
      return;
    }

    try {
      setRouteLoading(true);

      const start = await geocodeLocation(startLocation);
      const end = await geocodeLocation(endLocation);

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;

      const routeResponse = await fetch(routeUrl);

      if (!routeResponse.ok) {
        throw new Error("Could not calculate route.");
      }

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
          start_coordinates: {
            lat: routeData.start.lat,
            lon: routeData.start.lon,
          },
          end_coordinates: {
            lat: routeData.end.lat,
            lon: routeData.end.lon,
          },
          distance: Number(routeDistanceKm.toFixed(2)),
          duration_minutes: routeDurationMinutes,
          vehicle: selectedVehicle.name,
          emission_rate: selectedVehicle.emission,
          carbon_estimate: Number(carbonEstimate),
          route_source: "OpenStreetMap + OSRM",
          route_coordinates: limitedCoordinates,
        },
      });

      setSuccess("Route activity saved successfully.");
      setTimeout(() => {
        navigate("/dashboard?refresh=route-saved");
      }, 700);
    } catch (err) {
      console.error(err);
      setRouteError(
        err.response?.data?.message || "Failed to save route activity."
      );
    } finally {
      setSaving(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setRouteError("");
    setSuccess("");
    setStartLocation("");
    setEndLocation("");
    setSelectedVehicle(VEHICLE_OPTIONS[2]);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="track-container">
          <div className="track-header">
            <div>
              <span className="track-badge">Impact Tracking</span>
              <h1>Track your carbon impact</h1>
              <p>
                Choose a category, log your activity, or calculate a real route
                to estimate transport emissions from start to destination.
              </p>
            </div>

            <div className="track-header-actions">
              <button
                className="track-secondary-btn"
                onClick={() => navigate("/history")}
              >
                <FaHistory /> View History
              </button>

              <button
                className="track-primary-btn"
                onClick={() => navigate("/activity")}
              >
                + Log Activity
              </button>
            </div>
          </div>

          <div className="track-overview-card">
            <div className="track-overview-icon">
              <FaChartLine />
            </div>

            <div>
              <h2>How tracking works</h2>
              <p>
                EcoTrack uses your activity details to estimate emissions across
                transport, diet, energy, and shopping. The new route tracker
                uses OpenStreetMap and OSRM to calculate distance, then saves
                the result as a normal transport activity.
              </p>
            </div>
          </div>

          <div className="route-tracker-card">
            <div className="route-card-header">
              <div>
                <span className="route-kicker">
                  <FaMapMarkedAlt /> Route Tracking
                </span>
                <h2>Calculate trip emissions</h2>
                <p>
                  Enter your start point and destination, choose a vehicle, then
                  EcoTrack will estimate route distance and carbon impact.
                </p>
              </div>
            </div>

            <div className="route-grid">
              <div className="route-form-panel">
                <div className="route-field">
                  <label>
                    <FaLocationArrow /> Start location
                  </label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="Example: Beirut, Lebanon"
                  />
                </div>

                <div className="route-field">
                  <label>
                    <FaRoute /> Destination
                  </label>
                  <input
                    type="text"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    placeholder="Example: Byblos, Lebanon"
                  />
                </div>

                <div className="route-field">
                  <label>
                    <FaCarSide /> Vehicle type
                  </label>
                  <select
                    value={selectedVehicle.name}
                    onChange={(e) => {
                      const vehicle = VEHICLE_OPTIONS.find(
                        (item) => item.name === e.target.value
                      );
                      setSelectedVehicle(vehicle || VEHICLE_OPTIONS[2]);
                    }}
                  >
                    {VEHICLE_OPTIONS.map((vehicle) => (
                      <option key={vehicle.name} value={vehicle.name}>
                        {vehicle.name} · {vehicle.emission} kg/km
                      </option>
                    ))}
                  </select>
                </div>

                {routeError && (
                  <div className="route-message error">{routeError}</div>
                )}

                {success && (
                  <div className="route-message success">{success}</div>
                )}

                <div className="route-actions">
                  <button
                    className="track-primary-btn"
                    onClick={calculateRoute}
                    disabled={routeLoading || saving}
                  >
                    {routeLoading ? "Calculating..." : "Calculate Route"}
                  </button>

                  <button
                    className="track-secondary-btn"
                    onClick={clearRoute}
                    disabled={routeLoading || saving}
                  >
                    <FaTimes /> Clear
                  </button>
                </div>

                {routeData && (
                  <div className="route-results">
                    <div>
                      <span>Distance</span>
                      <strong>{routeDistanceKm.toFixed(2)} km</strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>{routeDurationMinutes} min</strong>
                    </div>

                    <div>
                      <span>Carbon</span>
                      <strong>{carbonEstimate} kg CO2e</strong>
                    </div>

                    <button
                      className="save-route-btn"
                      onClick={saveRouteActivity}
                      disabled={saving}
                    >
                      <FaSave /> {saving ? "Saving..." : "Save Route Activity"}
                    </button>
                  </div>
                )}
              </div>

              <div className="route-map-panel">
                <MapContainer
                  center={mapCenter}
                  zoom={routeData ? 11 : 9}
                  className="route-map"
                  key={
                    routeData
                      ? `${routeData.start.lat}-${routeData.end.lat}`
                      : "default-map"
                  }
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {routeCoordinates.length > 0 && (
                    <>
                      <FitRouteBounds coordinates={routeCoordinates} />

                      <Polyline
                        positions={routeCoordinates}
                        pathOptions={{
                          weight: 5,
                        }}
                      />

                      <Marker position={[routeData.start.lat, routeData.start.lon]}>
                        <Popup>Start: {startLocation}</Popup>
                      </Marker>

                      <Marker position={[routeData.end.lat, routeData.end.lon]}>
                        <Popup>Destination: {endLocation}</Popup>
                      </Marker>
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="track-grid">
            {categories.map((category) => (
              <div className="track-card" key={category.id}>
                <div className={`track-card-icon ${category.color}`}>
                  {category.icon}
                </div>

                <h3>{category.title}</h3>
                <p>{category.description}</p>

                <button onClick={() => openCategory(category.id)}>
                  Track {category.title}
                </button>
              </div>
            ))}
          </div>

          <div className="track-bottom-grid">
            <div className="track-info-card">
              <h3>Current scope</h3>
              <p>
                This page connects to your existing activity system. Manual
                activity tracking and route tracking both save to the same
                backend carbon records.
              </p>
            </div>

            <div className="track-info-card">
              <h3>AI ready</h3>
              <p>
                Once the AI model is ready, route emissions and weekly category
                totals can help generate personalized recommendations and
                suggested challenges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}