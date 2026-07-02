import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaEye,
  FaImage,
  FaLeaf,
  FaLock,
  FaMapMarkerAlt,
  FaPauseCircle,
  FaPhoneAlt,
  FaSave,
  FaStore,
  FaTags,
} from "react-icons/fa";
import { FiAlertTriangle, FiRefreshCcw, FiUploadCloud } from "react-icons/fi";
import {
  getSellerStoreSettings,
  updateSellerStoreAvailability,
  updateSellerStoreSettings,
} from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  StateBlock,
  getErrorMessage,
} from "./MarketplaceShared";

const emptyForm = {
  name: "",
  description: "",
  contact_email: "",
  phone: "",
  location: "",
  sustainability_mission: "",
  product_categories: "",
};

const statusMeta = {
  active: {
    label: "Active",
    icon: <FaCheckCircle />,
    className: "active",
    text: "Your store is visible in the marketplace and shoppers can buy your products.",
  },
  inactive: {
    label: "Temporarily Closed",
    icon: <FaPauseCircle />,
    className: "inactive",
    text: "You closed your store temporarily. It is hidden from marketplace shoppers until you reopen it.",
  },
  suspended: {
    label: "Admin Suspended",
    icon: <FaLock />,
    className: "suspended",
    text: "An admin suspended this store. You can edit information, but only an admin can reactivate it.",
  },
};

const splitCategories = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

function UploadBox({ label, helper, preview, icon, onChange }) {
  return (
    <label className="seller-store-upload-box">
      <span>{label}</span>
      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={onChange} />
      {preview ? (
        <img src={preview} alt={`${label} preview`} />
      ) : (
        <div>
          {icon || <FiUploadCloud />}
          <strong>Upload Image</strong>
          <small>{helper}</small>
        </div>
      )}
    </label>
  );
}

export default function SellerStoreSettings() {
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const applyStore = (payload) => {
    const nextStore = payload?.store || payload;
    const nextStats = payload?.stats || stats || {};
    setStore(nextStore);
    setStats(nextStats);
    setForm({
      name: nextStore?.name || "",
      description: nextStore?.description || "",
      contact_email: nextStore?.contact_email || "",
      phone: nextStore?.phone || "",
      location: nextStore?.location || "",
      sustainability_mission: nextStore?.sustainability_mission || "",
      product_categories: (nextStore?.product_categories || []).join(", "),
    });
    setLogoPreview(nextStore?.logo_url || "");
    setBannerPreview(nextStore?.banner_url || "");
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getSellerStoreSettings();
      applyStore(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load store settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const categoryList = useMemo(() => splitCategories(form.product_categories), [form.product_categories]);
  const status = statusMeta[store?.status] || statusMeta.active;
  const isSuspended = store?.status === "suspended";
  const isInactive = store?.status === "inactive";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFile = (setter, previewSetter) => (event) => {
    const file = event.target.files?.[0] || null;
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : "");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "product_categories") return;
      formData.append(key, value || "");
    });
    formData.append("product_categories", JSON.stringify(categoryList));
    if (logoFile) formData.append("logo", logoFile);
    if (bannerFile) formData.append("banner", bannerFile);

    try {
      const response = await updateSellerStoreSettings(formData);
      applyStore({ store: response.data.store, stats });
      setLogoFile(null);
      setBannerFile(null);
      setSuccess(response.data.message || "Store settings saved.");
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save store settings."));
    } finally {
      setSaving(false);
    }
  };

  const handleAvailability = async () => {
    if (!store || isSuspended) return;
    setStatusLoading(true);
    setError("");
    setSuccess("");

    try {
      const nextStatus = isInactive ? "active" : "inactive";
      const response = await updateSellerStoreAvailability(nextStatus);
      setStore(response.data.store);
      setSuccess(response.data.message || "Store status updated.");
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update store status."));
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <MarketplaceDashboardShell
      title="Store Settings"
      subtitle="Edit your seller profile, storefront branding, and public availability."
      actions={
        <>
          <button type="button" className="seller-store-light-action" onClick={loadSettings} disabled={loading}>
            <FiRefreshCcw /> Refresh
          </button>
          {store?.slug && (
            <Link to={`/stores/${store.slug}`} className={`seller-store-light-action ${store.status !== "active" ? "disabled" : ""}`}>
              <FaEye /> Preview Storefront
            </Link>
          )}
          <button type="submit" form="seller-store-settings-form" className="mp-btn seller-store-save-btn" disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
    >
      {loading ? (
        <StateBlock title="Loading store settings..." icon={<FaStore />}>
          Preparing your store branding, contact details, and availability controls.
        </StateBlock>
      ) : error && !store ? (
        <StateBlock
          title="Store settings unavailable"
          tone="error"
          icon={<FiAlertTriangle />}
          action={<Link to="/seller/apply" className="mp-btn-light">Check seller application</Link>}
        >
          {error}
        </StateBlock>
      ) : (
        <form id="seller-store-settings-form" className="seller-store-settings-page" onSubmit={handleSave}>
          {error && <div className="seller-store-alert error">{error}</div>}
          {success && <div className="seller-store-alert success">{success}</div>}

          <section className="seller-store-settings-hero">
            <div>
              <span className="seller-store-kicker"><FaStore /> Seller workspace</span>
              <h2>{store?.name || "Your Eco Store"}</h2>
              <p>Update your storefront branding, contact details, and sustainability profile from one clean workspace.</p>
            </div>
          </section>

          <div className="seller-store-settings-grid">
            <div className="seller-store-settings-main">
              <section className="seller-store-panel">
                <div className="seller-store-panel-heading">
                  <span><FaImage /></span>
                  <div>
                    <h3>Store Branding</h3>
                    <p>Control what shoppers see on your public store page.</p>
                  </div>
                </div>

                <div className="seller-store-field-grid one">
                  <label>
                    <span>Store Name</span>
                    <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="EcoLife Essentials" required />
                  </label>
                  <label>
                    <span>Store Description</span>
                    <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe your store, products, and eco values..." rows="5" />
                  </label>
                </div>

                <div className="seller-store-upload-grid">
                  <UploadBox
                    label="Store Logo"
                    helper="Square logo, PNG/JPG/WebP"
                    preview={logoPreview}
                    icon={<FiUploadCloud />}
                    onChange={handleFile(setLogoFile, setLogoPreview)}
                  />
                  <UploadBox
                    label="Store Banner"
                    helper="Wide banner for the public page"
                    preview={bannerPreview}
                    icon={<FaImage />}
                    onChange={handleFile(setBannerFile, setBannerPreview)}
                  />
                </div>
              </section>

              <section className="seller-store-panel">
                <div className="seller-store-panel-heading">
                  <span><FaPhoneAlt /></span>
                  <div>
                    <h3>Contact Information</h3>
                    <p>Use the site messaging system for buyers, but keep business info complete.</p>
                  </div>
                </div>

                <div className="seller-store-field-grid">
                  <label>
                    <span>Contact Email</span>
                    <input type="email" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} placeholder="support@yourstore.com" />
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+961 00 000 000" />
                  </label>
                  <label className="wide">
                    <span>Store Location</span>
                    <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Baalbeck, Lebanon" />
                  </label>
                </div>
              </section>

              <section className="seller-store-panel">
                <div className="seller-store-panel-heading">
                  <span><FaLeaf /></span>
                  <div>
                    <h3>Sustainability Profile</h3>
                    <p>Explain why buyers should trust your ecological mission.</p>
                  </div>
                </div>

                <div className="seller-store-field-grid one">
                  <label>
                    <span>Sustainability Mission</span>
                    <textarea value={form.sustainability_mission} onChange={(event) => updateField("sustainability_mission", event.target.value)} placeholder="Explain your commitment to lower-impact products, packaging, and sourcing..." rows="4" />
                  </label>
                  <label>
                    <span>Product Categories</span>
                    <input value={form.product_categories} onChange={(event) => updateField("product_categories", event.target.value)} placeholder="Zero Waste, Reusable, Upcycled" />
                  </label>
                  {categoryList.length > 0 && (
                    <div className="seller-store-category-preview">
                      {categoryList.map((category) => <span key={category}>{category}</span>)}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="seller-store-settings-side">
              <section className={`seller-store-status-card ${status.className}`}>
                <div>
                  <small>Store Status</small>
                  <strong>{status.icon} {status.label}</strong>
                </div>
                <p>{status.text}</p>
                {!isSuspended && (
                  <button type="button" onClick={handleAvailability} disabled={statusLoading}>
                    {isInactive ? "Reopen Store" : "Close Store Temporarily"}
                  </button>
                )}
              </section>

              <section className="seller-store-live-preview">
                <div className="seller-store-preview-banner">
                  {bannerPreview ? <img src={bannerPreview} alt="Store banner preview" /> : <FaImage />}
                  <div className="seller-store-preview-logo">
                    {logoPreview ? <img src={logoPreview} alt="Store logo preview" /> : <FaLeaf />}
                  </div>
                </div>
                <div className="seller-store-preview-body">
                  <div>
                    <h3>{form.name || "Your Store"}</h3>
                    <span><FaCheckCircle /> Verified Seller</span>
                  </div>
                  <p>{form.description || "Your store description will appear here for EcoTrack shoppers."}</p>
                  <div className="seller-store-preview-metrics">
                    <article><small>Products</small><strong>{stats.products || 0}</strong></article>
                    <article><small>CO₂ Saved</small><strong>{Number(stats.carbon_saved || 0).toFixed(1)}kg</strong></article>
                  </div>
                  <div className="seller-store-preview-tags">
                    {categoryList.length ? categoryList.slice(0, 4).map((category) => <span key={category}><FaTags /> {category}</span>) : <span><FaTags /> Eco Products</span>}
                  </div>
                </div>
              </section>


              <section className="seller-store-mini-list">
                <h4>Public Store Info</h4>
                <p><FaMapMarkerAlt /> {form.location || "Location not set"}</p>
                <p><FaPhoneAlt /> {form.phone || "Phone not set"}</p>
                <p><FaLeaf /> {categoryList.length || 0} categories listed</p>
              </section>
            </aside>
          </div>
        </form>
      )}
    </MarketplaceDashboardShell>
  );
}
