import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "../styles/auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    token: searchParams.get("token") || "",
    password: "",
    password_confirmation: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await resetPassword(form);
      setMessage("Password updated successfully.");
      setTimeout(() => navigate("/login"), 2000);
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
          <h2>Reset Password</h2>
          <p>Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={form.password_confirmation}
              onChange={(e) =>
                setForm({
                  ...form,
                  password_confirmation: e.target.value,
                })
              }
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}
          {message && <div className="success-msg">{message}</div>}

          <button type="submit" className="submit-btn">
            Update Password →
          </button>
        </form>
      </div>
    </div>
  );
}