import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaLeaf, FaShoppingBag, FaUsers, FaChartLine, FaRecycle, FaAward, FaStore, FaBars, FaTimes, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaGlobe, FaShareAlt, FaShieldAlt, FaHandshake } from "react-icons/fa";
import { FaBottleWater } from "react-icons/fa6";
import { FiArrowRight, FiCheckCircle, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { LuBrainCircuit, LuSprout, LuTarget, LuTreePine } from "react-icons/lu";
import { TbRouteAltLeft } from "react-icons/tb";
import { MdOutlineDashboardCustomize, MdOutlineLocalActivity, MdOutlineInsights } from "react-icons/md";
import { getHomeCommunities, getHomePreview, getHomeProducts, getHomeSummary } from "../../api/publicApi";
import MarketplaceProductCard from "../../components/MarketplaceProductCard";
import "./PublicPages.css";
import "../MarketplaceHome.css";

const dataOf = (response, fallback) => response?.data?.data ?? fallback;
const formatNumber = (value, suffix = "") => `${Number(value || 0).toLocaleString()}${suffix}`;

function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const links = [
    { label: "Home", sectionId: null },
    { label: "Marketplace", path: "/marketplace" },
    { label: "Community", path: "/communities" },
    { label: "About", path: "/about" },
  ];

  const handleNavClick = (item) => {
    setOpen(false);

    if (item.path) {
      navigate(item.path);
      return;
    }

    const scroll = () => {
      if (!item.sectionId) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const section = document.getElementById(item.sectionId);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(scroll, 80);
    } else {
      scroll();
    }
  };

  return (
    <header className="public-navbar">
      <Link to="/" className="public-brand" onClick={() => setOpen(false)}>
        <span className="public-brand-mark"><img src="/ecotrack-logo.png" alt="EcoTrack logo" /></span>
        <span className="public-brand-text"><strong>EcoTrack</strong><small>Carbon Tracking</small></span>
      </Link>
      <button className="public-mobile-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
        {open ? <FaTimes /> : <FaBars />}
      </button>
      <nav className={`public-nav-links ${open ? "is-open" : ""}`} aria-label="Public navigation">
        {links.map((item) => (
          <button key={item.label} type="button" onClick={() => handleNavClick(item)}>{item.label}</button>
        ))}
      </nav>
      <div className="public-nav-actions">
        {isLoggedIn ? (
          <Link to="/dashboard" className="public-btn public-btn-primary">Dashboard</Link>
        ) : (
          <><Link to="/login" className="public-btn public-btn-outline">Login</Link><Link to="/register" className="public-btn public-btn-primary">Get Started</Link></>
        )}
      </div>
    </header>
  );
}

function PublicShell({ children }) {
  return <main className="public-site"><PublicNavbar />{children}<PublicFooter /></main>;
}

function DashboardPreview({ summary, preview, loading }) {
  const trend = preview?.trend?.length ? preview.trend : [];
  return (
    <div className="home-dashboard-preview glass-card">
      {loading ? <div className="home-skeleton large" /> : <>
        <div className="preview-top"><span><MdOutlineDashboardCustomize /> Live dashboard</span><strong>{formatNumber(preview?.eco_score)}%</strong></div>
        <div className="preview-grid">
          <div><small>Today CO₂</small><b>{formatNumber(preview?.today_co2, " kg")}</b></div>
          <div><small>Saved this week</small><b>{formatNumber(preview?.saved_this_week, " kg")}</b></div>
          <div><small>Products</small><b>{formatNumber(summary?.sustainable_products_count)}</b></div>
          <div><small>Communities</small><b>{formatNumber(summary?.active_communities_count)}</b></div>
        </div>
        <div className="mini-trend" aria-label="7-day trend">
          {(trend.length ? trend : Array.from({ length: 7 }, (_, i) => ({ label: i + 1, value: 0 }))).map((item, index) => <span key={`${item.label}-${index}`} style={{ height: `${Math.max(8, Math.min(86, Number(item.value || 0) * 8))}px` }} title={`${item.label}: ${item.value}`} />)}
        </div>
        <div className="goal-row"><span>Monthly goal</span><strong>{formatNumber(preview?.monthly_goal_percent)}%</strong></div>
        <div className="goal-track"><i style={{ width: `${Math.min(100, Number(preview?.monthly_goal_percent || 0))}%` }} /></div>
        <p className="ai-tip"><LuBrainCircuit /> {preview?.ai_tip || "Start by logging your daily activities to receive better eco recommendations."}</p>
        <div className="active-challenge"><FaAward /> {preview?.active_challenge || "No active challenge yet"}</div>
      </>}
    </div>
  );
}

function HeroStaticVisual() {
  return (
    <div className="home-hero-static-card glass-card" aria-label="EcoTrack platform preview">
      <div className="hero-static-top">
        <span><LuSprout /> Sustainability workspace</span>
        <strong>EcoTrack</strong>
      </div>
      <div className="hero-orbit">
        <div className="hero-orbit-center"><img src="/ecotrack-logo.png" alt="EcoTrack" /></div>
        <span className="orbit-card orbit-track"><MdOutlineLocalActivity /> Track</span>
        <span className="orbit-card orbit-ai"><LuBrainCircuit /> AI Tips</span>
        <span className="orbit-card orbit-shop"><FaStore /> Shop</span>
        <span className="orbit-card orbit-community"><FaUsers /> Community</span>
      </div>
      <div className="hero-static-footer">
        <div><b>Carbon</b><small>daily insights</small></div>
        <div><b>Rewards</b><small>badges & streaks</small></div>
        <div><b>Sellers</b><small>approved stores</small></div>
      </div>
    </div>
  );
}

function HomePage() {
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    let active = true;
    Promise.allSettled([getHomeSummary(), getHomePreview(), getHomeProducts(), getHomeCommunities()]).then((results) => {
      if (!active) return;
      if (results[0].status === "fulfilled") setSummary(dataOf(results[0].value, {}));
      if (results[1].status === "fulfilled") setPreview(dataOf(results[1].value, {}));
      if (results[2].status === "fulfilled") setProducts(dataOf(results[2].value, []));
      if (results[3].status === "fulfilled") setCommunities(dataOf(results[3].value, []));
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => [
    ["CO₂ tracked", formatNumber(summary?.total_co2_tracked, " kg"), <LuTreePine />],
    ["Eco actions logged", formatNumber(summary?.eco_actions_logged), <MdOutlineLocalActivity />],
    ["Sustainable products", formatNumber(summary?.sustainable_products_count), <FaShoppingBag />],
    ["Active communities", formatNumber(summary?.active_communities_count), <FaUsers />],
  ], [summary]);

  const features = [
    ["Carbon Dashboard", "Daily, weekly, and monthly footprint insights with clean visual trends.", <FaChartLine />],
    ["Activity Tracking", "Log transport, diet, energy, and shopping decisions in seconds.", <MdOutlineLocalActivity />],
    ["AI Eco Coach", "Get practical recommendations based on your lifestyle patterns.", <LuBrainCircuit />],
    ["Communities", "Join local groups and move together toward shared goals.", <FaUsers />],
    ["Challenges & Rewards", "Earn points, badges, and streak progress for better habits.", <FaAward />],
    ["Eco Marketplace", "Discover sustainable products from approved sellers.", <FaStore />],
  ];
  const steps = [
    ["Create Account", "Sign up in seconds.", <FaLeaf />],
    ["Log Activities", "Track daily habits.", <MdOutlineLocalActivity />],
    ["Impact Stats", "See the numbers.", <FaChartLine />],
    ["Get AI Tips", "Smart suggestions.", <LuBrainCircuit />],
    ["Take Action", "Improve habits.", <FiCheckCircle />],
    ["Track Growth", "Watch progress.", <LuTarget />],
  ];

  return <PublicShell>
    <section className="home-hero home-hero-gradient">
      <div className="home-blob one" /><div className="home-blob two" /><LuSprout className="floating-leaf leaf-a" /><FaLeaf className="floating-leaf leaf-b" />
      <div className="home-hero-copy">
        <span className="public-kicker">AI-powered sustainability platform</span>
        <h1>Track your carbon footprint. Improve your lifestyle.</h1>
        <p>EcoTrack combines carbon tracking, AI tips, community challenges, and an eco marketplace where sellers offer products that support lower-waste habits.</p>
        <div className="public-hero-actions">
          <Link to={isLoggedIn ? "/dashboard" : "/register"} className="public-btn public-btn-primary">Start Tracking <FiArrowRight /></Link>
          <Link to="/marketplace" className="public-btn public-btn-glass">Marketplace</Link>
        </div>
      </div>
      <HeroStaticVisual />
    </section>

    <section className="impact-stats-section">
      <div className="impact-stats-grid">
        {stats.map(([label, value, icon]) => (
          <article className="impact-stat-card" key={label}>
            <span>{icon}</span>
            <strong>{loading ? "…" : value}</strong>
            <small>{label}</small>
          </article>
        ))}
      </div>
    </section>

    <section className="home-section features-showcase" id="features">
      <div className="home-section-head">
        <h2>Powerful Sustainability Tools</h2>
        <p>Everything you need to master your environmental impact through data and intelligent recommendations.</p>
      </div>
      <div className="feature-showcase-grid">
        <article className="feature-showcase-card feature-carbon">
          <span className="home-icon-badge"><MdOutlineDashboardCustomize /></span>
          <h3>Carbon Dashboard</h3>
          <p>Real-time visualization of your emissions across travel, food, energy, and shopping.</p>
          <div className="feature-bars" aria-hidden="true"><span /><span /><span /><span /></div>
        </article>
        <article className="feature-showcase-card feature-activity">
          <span className="home-icon-badge"><MdOutlineLocalActivity /></span>
          <h3>Activity Tracking</h3>
          <p>Automatic and manual logging for transportation, consumption, and everyday decisions.</p>
          <div className="feature-activity-lines" aria-hidden="true">
            <div><TbRouteAltLeft /> Driving Session: 12km</div>
            <div><FiCheckCircle /> Impact Optimized</div>
          </div>
        </article>
        <article className="feature-showcase-card feature-ai">
          <span className="home-icon-badge"><LuBrainCircuit /></span>
          <h3>AI Eco Coach</h3>
          <p>Personalized advice powered by your patterns to lower your footprint without changing your whole routine.</p>
          <div className="feature-chip-row"><span>Low-Waste Diet</span><span>Transit Plan</span><span>Energy ROI</span></div>
        </article>
        <article className="feature-showcase-card simple"><FaUsers /><h3>Communities</h3><p>Join local and global groups committed to specific environmental goals.</p></article>
        <article className="feature-showcase-card simple"><FaAward /><h3>Challenges</h3><p>Participate in weekly sustainability quests and earn exclusive rewards.</p></article>
        <article className="feature-showcase-card simple"><FaShoppingBag /><h3>Marketplace</h3><p>Access curated sustainable products from approved EcoTrack sellers.</p></article>
      </div>
    </section>

    <section className="home-section dashboard-visual full-bleed-green"><div><span className="public-kicker">Verified metrics</span><h2>Your lifestyle impact, clearly visualized</h2><p>Understand category breakdowns, eco-cost savings, predictive trends, and goal progress without digging through raw entries.</p><div className="check-list"><span><FiCheckCircle /> Real activity data</span><span><FiCheckCircle /> Marketplace and community aggregates</span><span><FiCheckCircle /> AI-ready sustainability insights</span></div></div><DashboardPreview summary={summary} preview={preview} loading={loading} /></section>

    <section className="home-section journey-section" id="how-it-works">
      <div className="home-section-head journey-head">
        <h2>Your Journey to Net Zero</h2>
        <p>Follow our proven 6-step path to sustainable living.</p>
      </div>
      <div className="journey-path-wrap">
        <svg className="journey-dotted-path" viewBox="0 0 1200 100" aria-hidden="true" preserveAspectRatio="none">
          <path d="M0,50 Q150,0 300,50 T600,50 T900,50 T1200,50" fill="none" />
        </svg>
        <div className="journey-steps-grid">
          {steps.map(([title, text, icon], index) => (
            <article className="journey-step-card" key={title}>
              <span className="journey-step-number">{index + 1}</span>
              <span className="journey-step-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="home-section ai-coach full-bleed-green"><div><span className="public-kicker">AI Coach</span><h2>Better choices, explained like a conversation.</h2><p>Ask about daily routines and receive practical alternatives for your location, schedule, and goals.</p></div><div className="chat-mockup"><p className="chat-user">I drive to university most days. What can I improve?</p><p className="chat-ai">{preview?.ai_tip || "Try replacing one trip with bus, carpooling, or walking and compare the saved CO₂ in your dashboard."}</p></div></section>

    <section className="home-section marketplace-showcase" id="marketplace">
      <div className="marketplace-heading-row">
        <div>
          <h2>Eco Marketplace</h2>
          <p>Products that give back to the planet, loaded directly from your marketplace database.</p>
        </div>
        <Link to="/marketplace" className="marketplace-view-all">Open Marketplace</Link>
      </div>
      <div className="home-market-grid market-design-grid">
        {loading ? Array.from({ length: 4 }, (_, i) => <div className="home-skeleton card" key={i} />) : products.length ? products.map((product) => <MarketplaceProductCard key={product.id} product={product} compact />) : <p className="empty-state">No products available yet.</p>}
      </div>
      <div className="center-actions home-market-actions"><Link to="/marketplace" className="public-btn public-btn-primary">Browse Marketplace <FiArrowRight /></Link></div>
    </section>

    <section className="home-section seller-cta full-bleed-green"><div><span className="public-kicker">Seller program</span><h2>Become an Eco Seller</h2><p>Approved sellers can create stores, list sustainable products, and receive marketplace orders.</p></div><div className="seller-mock"><strong>{formatNumber(summary?.verified_sellers_count)}</strong><span>verified sellers</span><Link to="/seller/apply" className="public-btn public-btn-glass">Apply as Seller</Link></div></section>

    <section className="home-section communities-section" id="communities">
      <div className="home-section-head"><span className="public-kicker">Communities</span><h2>Join people working toward the same goals</h2><p>Discover local groups, shared missions, and practical challenges that turn climate action into a team habit.</p></div>
      <div className="home-community-grid enhanced-communities">
        {loading ? Array.from({ length: 4 }, (_, i) => <div className="home-skeleton card" key={i} />) : communities.length ? communities.map((community, index) => (
          <article className="home-card community-card community-card-rich" key={community.id}>
            <div className="community-card-top">
              <span className="home-icon-badge"><FaUsers /></span>
              <small>{formatNumber(community.members_count)} members</small>
            </div>
            <h3>{community.name}</h3>
            <p>{community.description || "A focused EcoTrack community for building better daily habits with other people."}</p>
            <div className="community-meta-row">
              <span><LuTarget /> Shared goal</span>
              <strong>{community.progress_percent ? `${community.progress_percent}%` : `${Math.min(95, 48 + index * 9)}%`}</strong>
            </div>
            <div className="goal-track community-progress"><i style={{ width: `${community.progress_percent || Math.min(95, 48 + index * 9)}%` }} /></div>
            <div className="community-goal-title">{community.goal_title || "Build a lower-carbon routine together"}</div>
            <Link to="/communities" className="public-btn public-btn-outline community-card-action">Open Community</Link>
          </article>
        )) : <p className="empty-state">No communities available yet.</p>}
      </div>
      <div className="center-actions communities-cta"><Link to="/communities" className="public-btn public-btn-primary">Explore Communities <FiArrowRight /></Link></div>
    </section>

    <section className="home-section gamification"><div className="home-section-head"><span className="public-kicker">Gamification</span><h2>Challenges, badges, points, and streaks</h2></div><div className="home-card-grid-three"><article><FaAward /><b>{formatNumber(summary?.active_challenges_count)}</b><span>active challenges</span></article><article><LuTarget /><b>{formatNumber(summary?.eco_actions_logged)}</b><span>actions logged</span></article><article><FaRecycle /><b>{formatNumber(summary?.total_orders_count)}</b><span>eco orders</span></article></div></section>

    <section className="home-section contact-section contact-rich" id="contact">
      <div className="contact-info-panel">
        <h2>Get in Touch</h2>
        <p className="contact-intro">Have a question about carbon tracking, marketplace stores, communities, or support? Reach the EcoTrack team anytime.</p>
        <div className="contact-list">
          <div className="contact-item"><span><FiMail /></span><div><strong>Email Us</strong><p>hello@ecotrack.com</p><p>support@ecotrack.com</p></div></div>
          <div className="contact-item"><span><FiPhone /></span><div><strong>Call Us</strong><p>+961 81 234 567</p><p>+961 76 987 654</p></div></div>
          <div className="contact-item"><span><FiMapPin /></span><div><strong>Visit Us</strong><p>Baabda Campus, Lebanon</p></div></div>
          <div className="contact-item"><span><FaStore /></span><div><strong>Marketplace Support</strong><p>sellers@ecotrack.com</p></div></div>
        </div>
      </div>
      <form className="contact-form contact-form-premium">
        <div className="field-group"><label>Full Name</label><input placeholder="John Doe" type="text" /></div>
        <div className="field-group"><label>Email Address</label><input placeholder="john@example.com" type="email" /></div>
        <div className="field-group full"><label>Subject</label><select defaultValue="General Inquiry"><option>General Inquiry</option><option>Marketplace Support</option><option>Seller Application</option><option>Community Support</option><option>Technical Support</option></select></div>
        <div className="field-group full"><label>Message</label><textarea placeholder="Your message here..." rows="4" /></div>
        <button className="public-btn public-btn-primary contact-submit" type="button">Send Message</button>
      </form>
    </section>

    <section className="home-section final-cta"><div className="cta-glow cta-one" /><div className="cta-glow cta-two" /><h2>Start reducing your carbon footprint today.</h2><p>Join 20,000+ users worldwide and lead the change for a sustainable future.</p>{isLoggedIn ? <div><Link to="/dashboard" className="public-btn public-btn-primary">Dashboard</Link><button type="button" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="public-btn public-btn-glass">Contact Sales</button></div> : <div><Link to="/register" className="public-btn public-btn-primary">Create Free Account</Link><button type="button" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="public-btn public-btn-glass">Contact Sales</button></div>}</section>
  </PublicShell>;
}

function AboutPage() {
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  return (
    <PublicShell>
      <section className="about-page-hero">
        <div className="about-page-copy">
          <span className="public-kicker">Our vision for tomorrow</span>
          <h1>Making sustainable living measurable, practical, and social.</h1>
          <p>EcoTrack is built as a real sustainability platform for individuals, communities, and responsible sellers. It connects carbon tracking, AI guidance, marketplace choices, and community action in one clean experience.</p>
          <div className="about-page-actions">
            <Link to={isLoggedIn ? "/dashboard" : "/register"} className="public-btn public-btn-primary">Start Tracking <FiArrowRight /></Link>
            <Link to="/marketplace" className="public-btn public-btn-outline">Marketplace</Link>
          </div>
        </div>
        <div className="about-page-visual">
          <div className="about-eco-orb"><LuTreePine /></div>
          <span className="about-chip chip-one"><FaChartLine /> Carbon insights</span>
          <span className="about-chip chip-two"><LuBrainCircuit /> AI recommendations</span>
          <span className="about-chip chip-three"><FaUsers /> Community goals</span>
        </div>
      </section>

      <section className="about-page-section">
        <div className="about-page-section-head">
          <h2>Built for real behavior change</h2>
          <p>EcoTrack turns climate awareness into a daily workflow: track, understand, improve, collaborate, and choose better products.</p>
        </div>
        <div className="about-page-grid">
          <article><span><LuTarget /></span><h3>The Problem</h3><p>People want to reduce their environmental impact, but carbon data is usually invisible, scattered, and hard to translate into daily decisions.</p></article>
          <article><span><LuBrainCircuit /></span><h3>The Solution</h3><p>EcoTrack converts everyday activities into clear footprint insights, then recommends practical steps based on habits, progress, and goals.</p></article>
          <article><span><FaStore /></span><h3>The Marketplace</h3><p>Approved sellers can list sustainable products so users can align purchases with their lower-carbon lifestyle goals.</p></article>
          <article><span><FaHandshake /></span><h3>The Community Layer</h3><p>Communities create shared accountability through goals, challenges, discussions, and measurable collective progress.</p></article>
        </div>
      </section>

      <section className="about-page-band full-bleed-green">
        <div>
          <h2>A complete ecosystem, not just a tracker.</h2>
          <p>From personal dashboards to seller stores and community goals, EcoTrack is designed to make sustainability feel actionable every day.</p>
        </div>
        <div className="about-band-metrics">
          <span><strong>01</strong> Track lifestyle impact</span>
          <span><strong>02</strong> Get AI-guided tips</span>
          <span><strong>03</strong> Join community goals</span>
          <span><strong>04</strong> Shop verified eco products</span>
        </div>
      </section>
    </PublicShell>
  );
}

function ContactPage() { return <HomePage />; }

function PublicFooter() {
  const navigate = useNavigate();
  const goToSection = (sectionId) => {
    const scroll = () => {
      const section = document.getElementById(sectionId);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (window.location.pathname !== "/") {
      navigate("/");
      window.setTimeout(scroll, 80);
    } else {
      scroll();
    }
  };

  return (
    <footer className="home-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand">
            <span><img src="/ecotrack-logo.png" alt="EcoTrack" /></span>
            <strong>EcoTrack</strong>
          </Link>
          <p>Premium AI-powered sustainability platform for conscious individuals, communities, and responsible businesses.</p>
          <div className="footer-socials"><button type="button" aria-label="Website"><FaGlobe /></button><button type="button" aria-label="Share"><FaShareAlt /></button></div>
        </div>
        <div className="footer-link-col">
          <h5>Platform</h5>
          <button type="button" onClick={() => goToSection("features")}>Features</button>
          <Link to="/marketplace">Marketplace</Link>
          <button type="button" onClick={() => goToSection("communities")}>Communities</button>
          <button type="button" onClick={() => goToSection("how-it-works")}>How It Works</button>
        </div>
        <div className="footer-link-col">
          <h5>Company</h5>
          <Link to="/about">About Us</Link>
          <button type="button" onClick={() => goToSection("contact")}>Contact Us</button>
          <Link to="/marketplace">Eco Marketplace</Link>
          <Link to="/login">Security</Link>
        </div>
        <div className="footer-info-col">
          <h5>Project Info</h5>
          <p>Built as a real-world sustainability platform for carbon tracking, eco commerce, and community-driven behavior change.</p>
          <strong>EcoTrack Platform</strong>
          <small>© 2024 EcoTrack. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}

export { HomePage, AboutPage, ContactPage, PublicShell };
