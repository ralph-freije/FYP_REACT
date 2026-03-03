import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import "./Login.css";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);

      // Save token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");

    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">

      {/* Logo */}
      <div className="auth-logo">
        <div className="logo-icon">🌱</div>
        <span>EcoTracker AI</span>
      </div>

      {/* Card */}
      <div className="auth-card">

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Continue your journey toward a zero-carbon future.</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Error Box */}
          {error && <div className="error-box">{error}</div>}

          {/* Email */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="password-header">
              <label>Password</label>
              <button
  type="button"
  className="forgot-btn"
  onClick={() => navigate("/forgot-password")}
>
                Forgot Password?
              </button>
            </div>

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me for 30 days</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>

        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <div className="social-row">

          <button className="social-btn">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 10.2v3.6h5.1c-.2 1.2-1.4 3.5-5.1 3.5-3.1 0-5.6-2.6-5.6-5.8s2.5-5.8 5.6-5.8c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.3 14.6 2.5 12 2.5 6.8 2.5 2.6 6.8 2.6 12s4.2 9.5 9.4 9.5c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1-.1-1.2H12z"
              />
            </svg>
            Google
          </button>

          <button className="social-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
              <path d="M16.365 1.43c0 1.14-.41 2.2-1.22 3.16-.83.98-1.84 1.55-3.03 1.45-.08-1.11.38-2.24 1.18-3.13.81-.93 2.05-1.63 3.07-1.48zM20.7 17.15c-.5 1.15-.75 1.66-1.39 2.64-.89 1.35-2.15 3.04-3.7 3.05-1.38.02-1.73-.89-3.61-.88-1.88.01-2.27.89-3.65.89-1.56 0-2.76-1.52-3.65-2.87-2.47-3.76-2.73-8.17-1.2-10.53 1.08-1.69 2.8-2.67 4.41-2.67 1.64 0 2.67.9 4.02.9 1.31 0 2.11-.9 4.01-.9 1.43 0 2.94.78 4.02 2.13-3.54 1.94-2.96 6.98.74 8.24z" />
            </svg>
            Apple
          </button>

        </div>

        <div className="auth-footer">
          Don’t have an account?
          <span 
  className="join-link"
  onClick={() => navigate("/register")}
>
  Join the movement
</span>
        </div>

      </div>

      <div className="bottom-text">
        <span>Secure AI Insights</span>
        <span>Carbon Neutral Platform</span>
      </div>

    </div>
  );
}