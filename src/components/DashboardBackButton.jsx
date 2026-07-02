import { useLocation, useNavigate } from "react-router-dom";

export default function DashboardBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const routerHistoryIndex = window.history.state?.idx ?? 0;

    if (routerHistoryIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(location.pathname === "/dashboard" ? "/" : "/dashboard");
  };

  return (
    <div className="dashboard-back-row">
      <button type="button" className="dashboard-back-button" onClick={handleBack}>
        <span aria-hidden="true">‹</span>
        Back
      </button>
    </div>
  );
}
