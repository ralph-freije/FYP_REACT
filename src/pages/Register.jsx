import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import "./Login.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/google";
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await registerUser({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem(
        "ecotrack_sidebar_user",
        JSON.stringify(data.data.user)
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
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
          <span className="auth-kicker">Join the movement</span>
          <h1>Create greener habits with real tracking.</h1>
          <p>
            Start logging your activities, set personal goals, and connect with
            communities working toward a lower-carbon lifestyle.
          </p>

          <div className="auth-feature-grid">
            <div>
              <strong>Track</strong>
              <span>Daily activities</span>
            </div>
            <div>
              <strong>Reduce</strong>
              <span>Carbon impact</span>
            </div>
            <div>
              <strong>Share</strong>
              <span>Eco progress</span>
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card-logo">
            <img src="/ecotrack-logo.png" alt="EcoTrack logo" />
          </div>

          <div className="auth-header">
            <h2>Create account</h2>
            <p>Start your sustainability journey today.</p>
          </div>

          {error && <div className="auth-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="register-password">Password</label>
              <div className="auth-password-field">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            <div className="auth-form-group">
              <label htmlFor="password-confirmation">Confirm password</label>
              <div className="auth-password-field">
                <input
                  id="password-confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  placeholder="Repeat your password"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or sign up with</span>
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
            Already have an account?
            <button type="button" onClick={() => navigate("/login")}>
              Sign in
            </button>
          </p>
        </section>
      </section>
    </main>
  );
}