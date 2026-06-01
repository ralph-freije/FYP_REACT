import React, { useState } from "react";
import "./about-us.css";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="9" stroke="#56A630" strokeWidth="1.5" />
    <path
      d="M6 10l3 3 5-5"
      stroke="#56A630"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TransparencyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8.5" stroke="#0ea5e9" strokeWidth="1.4" />
    <circle cx="10" cy="10" r="3" stroke="#0ea5e9" strokeWidth="1.4" />
    <path d="M1.5 10h4M14.5 10h4M10 1.5v4M10 14.5v4" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const InnovationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2a6 6 0 0 1 4.24 10.24C13.5 13 13 13.8 13 15H7c0-1.2-.5-2-1.24-2.76A6 6 0 0 1 10 2Z"
      stroke="#0ea5e9"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M7.5 17h5M8.5 19h3" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IntegrityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2L3 5v5c0 4.5 3.1 7.7 7 9 3.9-1.3 7-4.5 7-9V5L10 2Z"
      stroke="#0ea5e9"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M7 10l2 2 4-4" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CollaborationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="8" cy="6" r="3.5" stroke="#0ea5e9" strokeWidth="1.4" />
    <path d="M1 17c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M15.5 7c1.5.5 3 1.8 3 4" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="15.5" cy="4" r="2" stroke="#0ea5e9" strokeWidth="1.4" />
  </svg>
);

// ─── Hero SVG ────────────────────────────────────────────────────────────────

const HeroSvg = () => (
  <svg className="hero-svg" viewBox="0 0 568 380" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="568" height="380" fill="#dcefd4" />
    <ellipse cx="284" cy="340" rx="200" ry="26" fill="#b8dda0" opacity="0.5" />
    <rect x="238" y="285" width="92" height="55" rx="7" fill="#9abf6a" />
    <rect x="228" y="280" width="112" height="14" rx="5" fill="#85a85a" />
    <path d="M284 280 Q278 225 255 170" stroke="#4d7a25" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M284 280 Q292 235 315 185" stroke="#4d7a25" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M284 260 Q280 240 270 220" stroke="#4d7a25" strokeWidth="3" strokeLinecap="round" fill="none" />
    <ellipse cx="244" cy="163" rx="40" ry="19" fill="#6bbf3c" transform="rotate(-28 244 163)" />
    <ellipse cx="324" cy="178" rx="36" ry="17" fill="#56a630" transform="rotate(22 324 178)" />
    <ellipse cx="268" cy="128" rx="30" ry="14" fill="#7dd44a" transform="rotate(-12 268 128)" />
    <ellipse cx="298" cy="148" rx="22" ry="11" fill="#4fa028" transform="rotate(18 298 148)" />
    <circle cx="178" cy="288" r="48" stroke="#a8cca8" strokeWidth="1.5" fill="rgba(200,235,200,0.3)" />
    <circle cx="163" cy="272" r="9" fill="rgba(255,255,255,0.55)" />
    <circle cx="432" cy="72" r="7" fill="#a8d870" opacity="0.55" />
    <circle cx="462" cy="115" r="4.5" fill="#56a630" opacity="0.5" />
    <circle cx="400" cy="100" r="3" fill="#6bbf3c" opacity="0.65" />
    <circle cx="480" cy="60" r="3" fill="#7dd44a" opacity="0.4" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AboutUs() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSuccess(true);
    setEmail("");
  };

  const handleEmailChange = () => {
    setError("");
    setSuccess(false);
  };

  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1 className="h1">Our Mission</h1>
          <p className="body-lg">
            At CarbonTrack AI, we believe that the first step toward a sustainable future is understanding our current impact. Our AI-powered platform
            provides real-time, actionable insights into carbon footprints, empowering individuals and enterprises to make data-driven decisions that
            protect our planet.
          </p>
          <div className="badges">
            <div className="badge">
              <div className="badge-dot">
                <div className="badge-check"></div>
              </div>
              <span>Real-time Tracking</span>
            </div>
            <div className="badge">
              <div className="badge-dot">
                <div className="badge-check"></div>
              </div>
              <span>AI Optimization</span>
            </div>
          </div>
        </div>
        <div className="hero-img">
          <HeroSvg />
        </div>
      </section>

      {/* Values Section */}
      <section className="values">
        <div className="section-center">
          <h2 className="h2">The Values We Live By</h2>
          <p className="sub">Core principles that guide every algorithm we write and every partnership we build.</p>
        </div>
        <div className="cards-grid">
          <div className="vcard">
            <div className="vicon">
              <TransparencyIcon />
            </div>
            <div className="vcard-title">Transparency</div>
            <div className="vcard-desc">Total clarity in how we measure and report environmental impact data.</div>
          </div>
          <div className="vcard">
            <div className="vicon">
              <InnovationIcon />
            </div>
            <div className="vcard-title">Innovation</div>
            <div className="vcard-desc">Leveraging cutting-edge AI to solve the world's most complex climate challenges.</div>
          </div>
          <div className="vcard">
            <div className="vicon">
              <IntegrityIcon />
            </div>
            <div className="vcard-title">Integrity</div>
            <div className="vcard-desc">Commitment to the planet over profit, ensuring sustainable practices internally.</div>
          </div>
          <div className="vcard">
            <div className="vicon">
              <CollaborationIcon />
            </div>
            <div className="vcard-title">Collaboration</div>
            <div className="vcard-desc">Working with global partners to scale impact across industries.</div>
          </div>
        </div>
      </section>

      {/* Team Section */}
<section className="team">
  <div className="team-header">
    <h2 className="h2">Our Team</h2>
    <p className="sub" style={{ textAlign: "left", maxWidth: "520px" }}>
      We’re two final-year software engineering students working together to build this project and bring our ideas to life.
    </p>
  </div>

  <div className="team-grid">
    <div className="tcard">
      <div className="tcard-img">RS</div>
      <div className="tcard-name">Raouf</div>
      <div className="tcard-role">Full-Stack Developer</div>
      <div className="tcard-bio">
        Focused on building efficient and user-friendly applications, with an interest in solving real-world problems through code.
      </div>
    </div>

    <div className="tcard">
      <div
        className="tcard-img"
        style={{ background: "linear-gradient(135deg, #a8c8e8 0%, #6897c8 100%)" }}
      >
        RF
      </div>
      <div className="tcard-name">Ralph</div>
      <div className="tcard-role">Full-Stack Developer</div>
      <div className="tcard-bio">
        Passionate about developing scalable solutions and exploring new technologies to improve application performance.
      </div>
    </div>
  </div>
</section>

      {/* CTA Section */}
      <div className="cta-wrap">
        <div className="cta">
          <div className="cta-glow"></div>
          <h2 className="cta-h">Ready to start your journey?</h2>
          <p className="cta-p">
            Join thousands of others tracking their carbon footprint and taking real action against climate change.
          </p>
          {!success ? (
            <form onSubmit={handleSubmit} className="cta-form">
              <input
                className={`cta-input ${error ? "err" : ""}`}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleEmailChange();
                }}
                autoComplete="email"
                aria-label="Email address"
              />
              <button className="cta-btn" type="submit" aria-label="Get started for free">
                Get Started for Free
              </button>
              {error && (
                <span className={`err-msg ${error ? "show" : ""}`} role="alert" aria-live="assertive">
                  {error}
                </span>
              )}
            </form>
          ) : (
            <p className="success-msg" role="status">
              🎉 Thanks! We'll be in touch soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
