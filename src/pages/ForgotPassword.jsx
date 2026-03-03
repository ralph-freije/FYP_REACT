import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import "../styles/auth.css";
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
      const res = await forgotPassword(email);
      setMessage("Check your email for reset instructions.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong."
      );
    }
  };

  return (
    <div className="auth-wrapper">

      <button className="back-btn" onClick={() => navigate("/login")}>
        ←
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit}>

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

          {error && <div className="error-msg">{error}</div>}
          {message && <div className="success-msg">{message}</div>}

          <button type="submit" className="submit-btn">
            Send Reset Link →
          </button>
        </form>
      </div>
    </div>
  );
}