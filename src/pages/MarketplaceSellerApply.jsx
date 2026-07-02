import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaCamera,
  FaClipboardCheck,
  FaEnvelope,
  FaFileUpload,
  FaLeaf,
  FaMapMarkerAlt,
  FaPhone,
  FaRecycle,
  FaShieldAlt,
  FaStore,
  FaTruck,
  FaUsers,
} from "react-icons/fa";
import { FiAlertCircle, FiArrowRight, FiCheck, FiClock, FiSend, FiUploadCloud, FiXCircle } from "react-icons/fi";
import { getSellerApplication, submitSellerApplication } from "../api/marketplaceApi";
import { PublicShell } from "./public/PublicPages";
import "./MarketplaceSellerApply.css";

const CATEGORIES = [
  "Reusable Products",
  "Solar & Energy",
  "Eco Home",
  "Sustainable Fashion",
  "Food & Kitchen",
  "Stationery",
  "Carbon Offsets",
];

const INITIAL_FORM = {
  store_name: "",
  contact_email: "",
  phone: "",
  location: "",
  description: "",
  product_categories: [],
  sustainability_reason: "",
  materials_overview: "",
  packaging_practices: "",
  proof: null,
  agreement_sustainability: false,
  agreement_review: false,
};

function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0];
    if (firstError) return firstError;
  }
  return fallback;
}

function FieldError({ children }) {
  return children ? <p className="seller-field-error"><FiAlertCircle /> {children}</p> : null;
}

function formatDate(date) {
  if (!date) return "Not available";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MarketplaceSellerApply() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [application, setApplication] = useState(null);
  const [store, setStore] = useState(null);
  const [activeStore, setActiveStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showRejectedForm, setShowRejectedForm] = useState(false);

  const pendingApplication = application?.status === "pending";
  const approvedApplication = application?.status === "approved" || Boolean(activeStore);
  const rejectedApplication = application?.status === "rejected";
  const canShowForm = !pendingApplication && !approvedApplication && (!rejectedApplication || showRejectedForm);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getSellerApplication();
        if (!active) return;
        const currentApplication = response?.data?.application || null;
        const linkedStore = response?.data?.store || null;
        const currentStore = response?.data?.active_store || null;
        setApplication(currentApplication);
        setStore(linkedStore);
        setActiveStore(currentStore);

        if (currentApplication) {
          setForm((previous) => ({
            ...previous,
            store_name: currentApplication.store_name || linkedStore?.name || "",
            contact_email: currentApplication.contact_email || linkedStore?.contact_email || "",
            phone: currentApplication.phone || linkedStore?.phone || "",
            location: currentApplication.location || "",
            description: currentApplication.description || linkedStore?.description || "",
            product_categories: Array.isArray(currentApplication.product_categories)
              ? currentApplication.product_categories
              : [],
            sustainability_reason: currentApplication.sustainability_reason || "",
            materials_overview: currentApplication.materials_overview || "",
            packaging_practices: currentApplication.packaging_practices || "",
            agreement_sustainability: Boolean(currentApplication.agreement_sustainability),
            agreement_review: Boolean(currentApplication.agreement_review),
          }));
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Could not load your seller application."));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const selectedFileName = useMemo(() => {
    if (form.proof) return form.proof.name;
    if (application?.proof_original_name) return application.proof_original_name;
    return "Browse files or drag & drop";
  }, [form.proof, application]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
  };

  const toggleCategory = (category) => {
    setForm((current) => {
      const selected = current.product_categories.includes(category);
      return {
        ...current,
        product_categories: selected
          ? current.product_categories.filter((item) => item !== category)
          : [...current.product_categories, category],
      };
    });
    setFieldErrors((current) => ({ ...current, product_categories: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    try {
      const response = await submitSellerApplication({
        ...form,
        agreement_sustainability: form.agreement_sustainability ? "1" : "",
        agreement_review: form.agreement_review ? "1" : "",
      });
      setApplication(response?.data?.application || null);
      setStore(response?.data?.store || null);
      setActiveStore(response?.data?.active_store || null);
      setShowRejectedForm(false);
      setSuccess("Application submitted successfully. Admin review is now pending.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const errors = err?.response?.data?.errors || {};
      setFieldErrors(Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
      setError(getErrorMessage(err, "Could not submit your seller application."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicShell>
      <section className="seller-apply-page">
        {loading ? (
          <div className="seller-loading-card">
            <FiClock />
            <h2>Loading seller application...</h2>
            <p>Checking your latest application status.</p>
          </div>
        ) : pendingApplication ? (
          <PendingStatus application={application} />
        ) : approvedApplication ? (
          <ApprovedStatus application={application} store={activeStore || store} onGoDashboard={() => navigate("/seller/dashboard")} />
        ) : rejectedApplication && !showRejectedForm ? (
          <RejectedStatus application={application} onApplyAgain={() => setShowRejectedForm(true)} />
        ) : (
          <div className="seller-apply-shell">
            <div className="seller-apply-grid">
              <div className="seller-form-column">
                <header className="seller-apply-header">
                  <span className="seller-kicker"><FaLeaf /> Verified Eco Seller Program</span>
                  <h1>{rejectedApplication ? "Update your seller application" : "Become an Eco Seller"}</h1>
                  <p>
                    Apply to open your sustainable store and offer eco-friendly products to the EcoTrack community.
                    A store record will be created and linked to your account while the admin reviews your request.
                  </p>
                </header>

                {error && <div className="seller-alert error"><FiAlertCircle /> {error}</div>}
                {success && <div className="seller-alert success"><FiCheck /> {success}</div>}

                <SellerApplicationForm
                  form={form}
                  updateForm={updateForm}
                  toggleCategory={toggleCategory}
                  fieldErrors={fieldErrors}
                  saving={saving}
                  fileInputRef={fileInputRef}
                  selectedFileName={selectedFileName}
                  onSubmit={handleSubmit}
                />
              </div>

              <SellerBenefits />
            </div>
          </div>
        )}
      </section>
    </PublicShell>
  );
}

function SellerApplicationForm({ form, updateForm, toggleCategory, fieldErrors, saving, fileInputRef, selectedFileName, onSubmit }) {
  return (
    <form className="seller-apply-form" onSubmit={onSubmit}>
      <section className="seller-form-card">
        <div className="seller-card-title"><span><FaStore /></span><h2>Store Information</h2></div>
        <div className="seller-form-grid two">
          <label>
            <span>Store Name</span>
            <input value={form.store_name} onChange={(event) => updateForm("store_name", event.target.value)} placeholder="Green Leaf Solutions" />
            <FieldError>{fieldErrors.store_name}</FieldError>
          </label>
          <label>
            <span>Contact Email</span>
            <input type="email" value={form.contact_email} onChange={(event) => updateForm("contact_email", event.target.value)} placeholder="hello@greenleaf.com" />
            <FieldError>{fieldErrors.contact_email}</FieldError>
          </label>
          <label>
            <span>Phone Number</span>
            <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="+961 70 000 000" />
            <FieldError>{fieldErrors.phone}</FieldError>
          </label>
          <label>
            <span>Location</span>
            <input value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="Beirut, Lebanon" />
            <FieldError>{fieldErrors.location}</FieldError>
          </label>
        </div>
        <label className="seller-full-field">
          <span>Store Description</span>
          <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Tell us about your brand mission..." rows="4" />
          <FieldError>{fieldErrors.description}</FieldError>
        </label>
      </section>

      <section className="seller-form-card">
        <div className="seller-card-title"><span><FaRecycle /></span><h2>Sustainability Details</h2></div>
        <div className="seller-category-group">
          <span>Product Categories</span>
          <div>
            {CATEGORIES.map((category) => (
              <button type="button" key={category} className={form.product_categories.includes(category) ? "selected" : ""} onClick={() => toggleCategory(category)}>{category}</button>
            ))}
          </div>
          <FieldError>{fieldErrors.product_categories}</FieldError>
        </div>
        <label className="seller-full-field">
          <span>Sustainability Reason</span>
          <textarea value={form.sustainability_reason} onChange={(event) => updateForm("sustainability_reason", event.target.value)} placeholder="Explain why your store/products are eco-friendly." rows="3" />
          <FieldError>{fieldErrors.sustainability_reason}</FieldError>
        </label>
        <label className="seller-full-field">
          <span>Materials / Products Overview</span>
          <textarea value={form.materials_overview} onChange={(event) => updateForm("materials_overview", event.target.value)} placeholder="List key materials, sourcing, and products offered." rows="3" />
          <FieldError>{fieldErrors.materials_overview}</FieldError>
        </label>
        <label className="seller-full-field">
          <span>Packaging Practices</span>
          <textarea value={form.packaging_practices} onChange={(event) => updateForm("packaging_practices", event.target.value)} placeholder="Describe packaging and shipping materials." rows="3" />
          <FieldError>{fieldErrors.packaging_practices}</FieldError>
        </label>
      </section>

      <section className="seller-form-card">
        <div className="seller-card-title"><span><FaClipboardCheck /></span><h2>Proof of Sustainability</h2></div>
        <button className="seller-upload-box" type="button" onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(event) => updateForm("proof", event.target.files?.[0] || null)} />
          <div className="seller-upload-icons"><FiUploadCloud /><FaFileUpload /><FaCamera /></div>
          <p>Upload certificates, product photos, or any proof of sustainable practices.</p>
          <strong>{selectedFileName}</strong>
        </button>
        <FieldError>{fieldErrors.proof}</FieldError>
        <small className="seller-helper-text">Accepted: JPG, PNG, WEBP, or PDF up to 5MB.</small>
      </section>

      <section className="seller-agreement-card">
        <label>
          <input type="checkbox" checked={form.agreement_sustainability} onChange={(event) => updateForm("agreement_sustainability", event.target.checked)} />
          <span>I confirm that my products follow EcoTrack marketplace sustainability guidelines.</span>
        </label>
        <FieldError>{fieldErrors.agreement_sustainability}</FieldError>
        <label>
          <input type="checkbox" checked={form.agreement_review} onChange={(event) => updateForm("agreement_review", event.target.checked)} />
          <span>I understand that my application must be reviewed by an admin.</span>
        </label>
        <FieldError>{fieldErrors.agreement_review}</FieldError>
      </section>

      <button className="seller-submit-button" type="submit" disabled={saving}>
        {saving ? <><FiClock /> Submitting Application...</> : <><FiSend /> Submit Application</>}
      </button>
    </form>
  );
}

function PendingStatus({ application }) {
  return (
    <div className="seller-status-page pending-status">
      <div className="seller-status-bg one" />
      <div className="seller-status-bg two" />
      <section className="seller-status-card">
        <div className="seller-status-header amber">
          <div className="seller-status-icon amber"><FiClock /></div>
          <h1>Application under review</h1>
          <p>Your seller application is waiting for admin approval. We are currently verifying your store details and sustainability profile.</p>
        </div>
        <div className="seller-status-body">
          <h2>Review Timeline</h2>
          <StatusTimeline status="pending" application={application} />
        </div>
        <div className="seller-status-footer">
          <p>Usually reviews are completed within <strong>2–3 business days</strong>. Check this page again for the latest decision.</p>
          <Link to="/marketplace" className="seller-primary-link">Back to Marketplace</Link>
        </div>
      </section>
      <aside className="seller-side-notes">
        <MiniNote icon={<FaLeaf />} title="Eco Impact" text="Approved sellers can show carbon saving and sustainability proof directly on their products." />
        <MiniNote icon={<FaUsers />} title="Seller Support" text="Need help? Update your documents if an admin asks for more information." />
      </aside>
    </div>
  );
}

function ApprovedStatus({ application, store, onGoDashboard }) {
  return (
    <div className="seller-status-page compact-approved">
      <section className="seller-status-card approved-card">
        <div className="seller-status-header green">
          <div className="seller-status-icon green"><FiCheck /></div>
          <h1>Application approved</h1>
          <p>Your store is now active. You can start posting sustainable products.</p>
          {store?.name && <span className="seller-store-pill"><FaStore /> {store.name}</span>}
        </div>
        <div className="seller-status-body">
          <h2>Application Journey</h2>
          <StatusTimeline status="approved" application={application} />
          <div className="seller-approved-action">
            <button type="button" onClick={onGoDashboard} className="seller-submit-button compact">
              Go to Seller Dashboard <FiArrowRight />
            </button>
            <p>Need help getting started? Create your first product from the seller dashboard.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function RejectedStatus({ application, onApplyAgain }) {
  return (
    <div className="seller-status-page compact-rejected">
      <section className="seller-status-card rejected-card">
        <div className="seller-status-header red">
          <div className="seller-status-icon red"><FiXCircle /></div>
          <h1>Application rejected</h1>
          <p>Thank you for your interest. Your application needs updates before it can be approved.</p>
        </div>
        <div className="seller-status-body">
          <div className="seller-admin-note">
            <FiAlertCircle />
            <div>
              <strong>Admin Note</strong>
              <p>{application?.admin_notes || "Please review your sustainability proof and submit a stronger application."}</p>
            </div>
          </div>
          <h2>Application Journey</h2>
          <StatusTimeline status="rejected" application={application} />
          <div className="seller-approved-action">
            <button type="button" onClick={onApplyAgain} className="seller-submit-button compact">
              Apply Again <FiArrowRight />
            </button>
          </div>
        </div>
      </section>
      <div className="seller-help-strip">
        <p>Need help with documentation?</p>
        <span>Use clearer proof for packaging, materials, and product sustainability claims.</span>
      </div>
    </div>
  );
}

function StatusTimeline({ status, application }) {
  const submittedDate = formatDate(application?.created_at);
  const reviewedDate = formatDate(application?.reviewed_at);
  const decisionText = status === "approved" ? "Final approval granted by admin" : status === "rejected" ? "Application was rejected by admin" : "Outcome of the application process";

  return (
    <div className={`seller-big-timeline ${status}`}>
      <div className="timeline-step done">
        <span><FiCheck /></span>
        <div>
          <strong>Submitted</strong>
          <p>Application received on {submittedDate}</p>
        </div>
      </div>
      <div className={`timeline-step ${status === "pending" ? "active" : "done"}`}>
        <span>{status === "pending" ? <FiClock /> : <FiCheck />}</span>
        <div>
          <strong>Admin Review</strong>
          <p>{status === "pending" ? "Our team is currently evaluating your profile" : `Completed on ${reviewedDate}`}</p>
        </div>
        {status === "pending" && <em>Active</em>}
      </div>
      <div className={`timeline-step ${status === "pending" ? "muted" : status}`}>
        <span>{status === "approved" ? <FiCheck /> : status === "rejected" ? <FiXCircle /> : <FiClock />}</span>
        <div>
          <strong>Decision</strong>
          <p>{decisionText}</p>
        </div>
      </div>
    </div>
  );
}

function MiniNote({ icon, title, text }) {
  return (
    <div className="seller-mini-note">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function SellerBenefits() {
  return (
    <aside className="seller-benefits-column">
      <div className="seller-benefits-card">
        <h3>Why sell on EcoTrack?</h3>
        <Benefit icon={<FaShieldAlt />} title="Verified seller badge" text="Gain credibility with marketplace eco-verification." />
        <Benefit icon={<FaUsers />} title="Reach eco-conscious users" text="Connect with buyers who care about sustainable shopping." />
        <Benefit icon={<FaBoxOpen />} title="Post sustainable products" text="Create listings with eco score, materials, and CO₂ impact." />
        <Benefit icon={<FaTruck />} title="Manage orders easily" text="Use a dedicated seller dashboard for logistics and order updates." />
        <Benefit icon={<FaLeaf />} title="Show your product impact" text="Make carbon savings visible before buyers checkout." />
        <Benefit icon={<FaClipboardCheck />} title="Build trust with proof" text="Upload certificates, product photos, and sustainability evidence." />
      </div>

      <div className="seller-process-card">
        <h3>Approval Process</h3>
        <div className="seller-review-timeline">
          <span className="done"><FiCheck /> Submit Application</span>
          <span><FiClock /> Admin Review</span>
          <span><FaStore /> Store Approved</span>
          <span><FaLeaf /> Start Selling</span>
        </div>
      </div>

      <div className="seller-visual-card">
        <div className="seller-visual-orbit">
          <span><FaStore /></span>
          <i className="one"><FaLeaf /></i>
          <i className="two"><FaTruck /></i>
          <i className="three"><FaEnvelope /></i>
          <i className="four"><FaMapMarkerAlt /></i>
          <i className="five"><FaPhone /></i>
        </div>
        <p>Join eco-pioneers transforming sustainable shopping with verified stores and trusted products.</p>
      </div>
    </aside>
  );
}

function Benefit({ icon, title, text }) {
  return (
    <div className="seller-benefit-row">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}
