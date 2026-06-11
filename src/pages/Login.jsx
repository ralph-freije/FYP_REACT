import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email.trim(), password);

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem(
        "ecotrack_sidebar_user",
        JSON.stringify(data.data.user)
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
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
          <span className="auth-kicker">Sustainability dashboard</span>
          <h1>Track your impact. Build better habits.</h1>
          <p>
            Monitor your carbon footprint, complete goals, join communities,
            and turn everyday choices into measurable progress.
          </p>

          <div className="auth-feature-grid">
            <div>
              <strong>Live</strong>
              <span>Carbon insights</span>
            </div>
            <div>
              <strong>Goals</strong>
              <span>Personal progress</span>
            </div>
            <div>
              <strong>Social</strong>
              <span>Eco communities</span>
            </div>
          </div>
        </aside>

        <section className="auth-card auth-card-login">
          <div className="auth-card-logo">
            <img src="/ecotrack-logo.png" alt="EcoTrack logo" />
          </div>

          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Continue your sustainability journey.</p>
          </div>

          {error && <div className="auth-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-form-group">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="auth-text-btn"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <div className="auth-password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="auth-check-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember this browser</span>
            </label>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.6h5.1c-.2 1.2-1.4 3.5-5.1 3.5-3.1 0-5.6-2.6-5.6-5.8s2.5-5.8 5.6-5.8c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.3 14.6 2.5 12 2.5 6.8 2.5 2.6 6.8 2.6 12s4.2 9.5 9.4 9.5c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1-.1-1.2H12z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="auth-switch-text">
            Don’t have an account?
            <button type="button" onClick={() => navigate("/register")}>
              Create one
            </button>
          </p>
        </section>
      </section>
    </main>
  );
}