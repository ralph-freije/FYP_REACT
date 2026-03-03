import "../styles/auth.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-bg">
      <div className="logo">🌱 EcoTracker AI</div>
      <div className="auth-card">
        {children}
      </div>
      <div className="auth-footer">
        <span>🔒 Secure AI Insights</span>
        <span>🌍 Carbon Neutral Platform</span>
      </div>
    </div>
  );
}