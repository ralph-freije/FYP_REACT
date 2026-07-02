import { Link } from "react-router-dom";
import { FaCreditCard, FaLeaf } from "react-icons/fa";
import { PublicShell } from "./public/PublicPages";

function CheckoutPlaceholder() {
  return (
    <PublicShell>
      <main style={{ width: "min(900px, calc(100% - 32px))", margin: "0 auto", padding: "64px 0 96px" }}>
        <section style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 28, padding: 36, boxShadow: "0 20px 45px rgba(15,23,42,.08)", textAlign: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: 24, display: "grid", placeItems: "center", margin: "0 auto 18px", background: "#d1fae5", color: "#073b2c", fontSize: 30 }}><FaCreditCard /></div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#059669", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 12 }}><FaLeaf /> Next marketplace step</span>
          <h1 style={{ margin: "12px 0", color: "#0f172a", fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: "-.05em" }}>Checkout page is next</h1>
          <p style={{ color: "#64748b", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 24px" }}>The cart is functional now. This placeholder keeps the checkout route from breaking until we rebuild the checkout page with your next HTML design.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link to="/cart" className="public-btn public-btn-outline">Back to Cart</Link>
            <Link to="/marketplace" className="public-btn public-btn-primary">Continue Shopping</Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

export default CheckoutPlaceholder;
