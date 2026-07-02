import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheck, FaClipboardList, FaTimes } from "react-icons/fa";
import {
  approveSellerApplication,
  getAdminSellerApplications,
  rejectSellerApplication,
} from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  StateBlock,
  getErrorMessage,
} from "./MarketplaceShared";

export default function AdminSellerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminSellerApplications();
      setApplications(response.data.applications || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load seller applications."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const reviewApplication = async (application, decision) => {
    try {
      setSavingId(application.id);
      setError("");
      setSuccess("");

      if (decision === "approve") {
        await approveSellerApplication(application.id);
        setSuccess("Application approved. The linked store is now active.");
      } else {
        const note = window.prompt("Write an admin note for the rejected seller application:", "Please provide clearer sustainability proof and packaging documentation.");
        if (!note) {
          setSavingId(null);
          return;
        }
        await rejectSellerApplication(application.id, {
          admin_notes: note,
        });
        setSuccess("Application rejected. The user will see the rejected status page.");
      }

      await loadApplications();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to review application."));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <MarketplaceDashboardShell
      title="Seller Applications"
      subtitle="Review pending seller requests. Approved or rejected requests disappear from this queue."
      actions={<Link to="/admin/stores" className="mp-btn-light">Stores</Link>}
    >
      {loading ? (
        <StateBlock title="Loading applications..." icon={<FaClipboardList />}>
          Checking pending seller applications.
        </StateBlock>
      ) : error && applications.length === 0 ? (
        <StateBlock title="Applications unavailable" tone="error">
          {error}
        </StateBlock>
      ) : applications.length === 0 ? (
        <StateBlock title="No seller applications" icon={<FaClipboardList />}>
          Pending seller applications will appear here for admin review.
        </StateBlock>
      ) : (
        <>
          {error && <div className="mp-alert error">{error}</div>}
          {success && <div className="mp-alert success">{success}</div>}
          <section className="mp-table-card">
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>User</th>
                    <th>Location</th>
                    <th>Categories</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>{application.store_name}</td>
                      <td>{application.user?.email || "-"}</td>
                      <td>{application.location || "-"}</td>
                      <td>{Array.isArray(application.product_categories) ? application.product_categories.join(", ") : "-"}</td>
                      <td>
                        {application.created_at
                          ? new Date(application.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <div className="mp-inline-actions">
                          <button
                            type="button"
                            className="mp-btn"
                            disabled={savingId === application.id}
                            onClick={() => reviewApplication(application, "approve")}
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            type="button"
                            className="mp-btn-danger"
                            disabled={savingId === application.id}
                            onClick={() => reviewApplication(application, "reject")}
                          >
                            <FaTimes /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </MarketplaceDashboardShell>
  );
}
