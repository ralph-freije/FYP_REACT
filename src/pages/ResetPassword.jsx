import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./Login.css";

const getErrorMessage = (error) => {
  const responseData = error.response?.data;

  if (!responseData) {
    return "Unable to reset your password. Please try again.";
  }

  if (typeof responseData.message === "string") {
    return responseData.message;
  }

  const validationErrors =
    responseData.errors ||
    responseData.data ||
    responseData.message;

  if (
    validationErrors &&
    typeof validationErrors === "object"
  ) {
    return Object.values(validationErrors)
      .flat()
      .filter(Boolean)
      .join(" ");
  }

  return "Unable to reset your password. Please try again.";
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email")?.trim() || "";
  const token = searchParams.get("token")?.trim() || "";

  const [form, setForm] = useState({
    email,
    token,
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const hasValidLink = Boolean(email && token);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [message, navigate]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.email || !form.token) {
      setError(
        "This password reset link is invalid or incomplete. Please request a new link."
      );
      return;
    }

    if (form.password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword(form);

      setMessage(
        response?.message ||
          "Your password has been updated successfully."
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-background-glow auth-glow-one" />
      <div className="auth-background-glow auth-glow-two" />

      <header className="auth-brand">
        <img src="/ecotrack-logo.png" alt="EcoTrack logo" />

        <div>
          <strong>EcoTrack</strong>
          <span>Carbon Tracking</span>
        </div>
      </header>

      <section className="auth-shell">
        <aside className="auth-hero-panel">
          <span className="auth-kicker">Account security</span>

          <h1>Create a secure new password.</h1>

          <p>
            Choose a new password for your EcoTrack account and continue
            tracking your environmental impact.
          </p>

          <div className="auth-feature-grid">
            <div>
              <strong>Secure</strong>
              <span>One-time link</span>
            </div>

            <div>
              <strong>Private</strong>
              <span>Protected reset</span>
            </div>

            <div>
              <strong>Ready</strong>
              <span>Return to EcoTrack</span>
            </div>
          </div>
        </aside>

        <section className="auth-card auth-card-login">
          <div className="auth-card-logo">
            <img src="/ecotrack-logo.png" alt="EcoTrack logo" />
          </div>

          {!hasValidLink ? (
            <>
              <div className="auth-header">
                <h2>Invalid reset link</h2>

                <p>
                  This password reset link is missing information, has
                  expired, or was opened incorrectly.
                </p>
              </div>

              <div className="auth-alert error">
                Request a new password reset link and open the exact link
                sent to your email.
              </div>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate("/forgot-password")}
              >
                Request a new link
              </button>

              <p className="auth-switch-text">
                Return to your account?
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Back to sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-header">
                <h2>Reset password</h2>

                <p>
                  Enter and confirm your new password below.
                </p>
              </div>

              {error && (
                <div className="auth-alert error">{error}</div>
              )}

              {message && (
                <div className="auth-alert success">{message}</div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-form-group">
                  <label htmlFor="new-password">
                    New password
                  </label>

                  <div className="auth-password-field">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value
                        )
                      }
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      disabled={loading || Boolean(message)}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      disabled={loading || Boolean(message)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label htmlFor="confirm-password">
                    Confirm password
                  </label>

                  <div className="auth-password-field">
                    <input
                      id="confirm-password"
                      type={showConfirmation ? "text" : "password"}
                      value={form.password_confirmation}
                      onChange={(event) =>
                        updateField(
                          "password_confirmation",
                          event.target.value
                        )
                      }
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      disabled={loading || Boolean(message)}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmation((current) => !current)
                      }
                      disabled={loading || Boolean(message)}
                    >
                      {showConfirmation ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || Boolean(message)}
                >
                  {loading
                    ? "Updating password..."
                    : message
                      ? "Redirecting to sign in..."
                      : "Update password"}
                </button>
              </form>

              <p className="auth-switch-text">
                Need another reset link?
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                >
                  Request a new one
                </button>
              </p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}