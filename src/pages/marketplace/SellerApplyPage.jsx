import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStore, FaUserTie } from "react-icons/fa";
import {
  getSellerApplication,
  submitSellerApplication,
} from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  StateBlock,
  getErrorMessage,
} from "./MarketplaceShared";

export default function SellerApplyPage() {
  const [application, setApplication] = useState(null);
  const [activeStore, setActiveStore] = useState(null);
  const [form, setForm] = useState({
    store_name: "",
    description: "",
    contact_email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getSellerApplication();
      setApplication(response.data.application || null);
      setActiveStore(response.data.active_store || null);

      if (response.data.application) {
        setForm({
          store_name: response.data.application.store_name || "",
          description: response.data.application.description || "",
          contact_email: response.data.application.contact_email || "",
          phone: response.data.application.phone || "",
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load seller application."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await submitSellerApplication(form);
      setApplication(response.data.application);
      setSuccess("Application submitted. An admin can review it now.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit application."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MarketplaceDashboardShell
      title="Become a Seller"
      subtitle="Apply for an EcoTrack marketplace store."
      actions={<Link to="/marketplace" className="mp-btn-light">View marketplace</Link>}
    >
      {loading ? (
        <StateBlock title="Loading seller application..." icon={<FaUserTie />}>
          Checking your current seller status.
        </StateBlock>
      ) : error && !application ? (
        <StateBlock title="Application unavailable" tone="error">
          {error}
        </StateBlock>
      ) : activeStore ? (
        <StateBlock
          title="Your store is active"
          icon={<FaStore />}
          action={<Link to="/seller/dashboard" className="mp-btn">Go to seller dashboard</Link>}
        >
          {activeStore.name} is linked to your account.
        </StateBlock>
      ) : (
        <>
          {application && (
            <section className="mp-card">
              <div className="mp-row-between">
                <div>
                  <span className="mp-pill">{application.status}</span>
                  <h2>{application.store_name}</h2>
                  <p className="mp-muted">
                    {application.status === "pending"
                      ? "Your application is waiting for admin review."
                      : application.status === "rejected"
                        ? application.admin_notes || "You can update and resubmit the application."
                        : "Application approved."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {error && <div className="mp-alert error">{error}</div>}
          {success && <div className="mp-alert success">{success}</div>}

          {application?.status !== "pending" && (
            <form className="mp-form-card mp-form-grid" onSubmit={handleSubmit}>
              <input
                className="mp-input"
                type="text"
                placeholder="Store name"
                value={form.store_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, store_name: event.target.value }))
                }
                required
              />
              <input
                className="mp-input"
                type="email"
                placeholder="Contact email"
                value={form.contact_email}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    contact_email: event.target.value,
                  }))
                }
              />
              <input
                className="mp-input"
                type="text"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
              <textarea
                className="mp-textarea full"
                rows="5"
                placeholder="Describe your store and products"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                required
              />
              <button type="submit" className="mp-btn" disabled={saving}>
                {saving ? "Submitting..." : "Submit application"}
              </button>
            </form>
          )}
        </>
      )}
    </MarketplaceDashboardShell>
  );
}
