import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await forgotPassword(email);
      setMessage("Check your email for reset instructions.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong."
      );
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <header className="auth-brand">
        <img src="/ecotrack-logo.png" alt="EcoTrack logo" />
        <div>
          <strong>EcoTrack</strong>
          <span>Carbon Tracking</span>
        </div>
      </header>

      <section className="auth-shell">
        <aside className="auth-hero-panel">
          <span className="auth-kicker">Account recovery</span>
          <h1>Get back to tracking your impact.</h1>
          <p>
            Enter the email linked to your EcoTrack account and we will send
            you instructions to reset your password securely.
          </p>

          <div className="auth-feature-grid">
            <div>
              <strong>Secure</strong>
              <span>Email recovery</span>
            </div>
            <div>
              <strong>Quick</strong>
              <span>Simple reset</span>
            </div>
            <div>
              <strong>Back</strong>
              <span>To your goals</span>
            </div>
          </div>
        </aside>

        <section className="auth-card auth-card-login">
          <div className="auth-card-logo">
            <img src="/ecotrack-logo.png" alt="EcoTrack logo" />
          </div>

          <div className="auth-header">
            <h2>Forgot password?</h2>
            <p>Enter your email to receive a password reset link.</p>
          </div>

          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert success">{message}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn">
              Send reset link
            </button>
          </form>

          <p className="auth-switch-text">
            Remembered your password?
            <button type="button" onClick={() => navigate("/login")}>
              Back to sign in
            </button>
          </p>
        </section>
      </section>
    </main>
  );
}
