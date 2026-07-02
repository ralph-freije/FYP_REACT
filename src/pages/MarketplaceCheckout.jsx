import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaCreditCard, FaEnvelope, FaLeaf, FaLock, FaMapMarkerAlt, FaPhoneAlt, FaShieldAlt, FaShoppingCart, FaTruck, FaUser, FaBoxes, FaIdCard } from "react-icons/fa";
import { FiAlertCircle, FiCheck, FiChevronLeft } from "react-icons/fi";
import { PublicShell } from "./public/PublicPages";
import { createCardCheckout, getCart } from "../api/marketplaceApi";
import "./MarketplaceCheckout.css";
import { getProductImage, handleProductImageError } from "../utils/productImages";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const normalizeAppPath = (url) => {
  if (!url) return null;
  if (typeof url !== "string") return null;

  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};


function CheckoutInput({ label, name, icon, value, onChange, error, type = "text", required = true, textarea = false, placeholder: hint = "", inputMode, maxLength }) {
  const Field = textarea ? "textarea" : "input";
  return (
    <div className={`checkout-field ${textarea ? "full" : ""}`}>
      <label htmlFor={name}>{label}{required ? " *" : ""}</label>
      <div className="checkout-input-wrap">
        {icon}
        <Field id={name} name={name} type={textarea ? undefined : type} value={value} onChange={onChange} placeholder={hint} inputMode={inputMode} maxLength={maxLength} />
      </div>
      {error ? <span className="checkout-error">{error}</span> : null}
    </div>
  );
}

function MarketplaceCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "",
    delivery_notes: "",
    cardholder_name: "",
    card_number: "",
    expiry: "",
    cvc: "",
  });

  useEffect(() => {
    let active = true;
    getCart()
      .then((response) => {
        if (!active) return;
        setCart(response.data || null);
      })
      .catch(() => setError("Could not load your cart. Please refresh and try again."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const items = cart?.items || [];
  const hasItems = items.length > 0;
  const totalSaving = Number(cart?.carbon_saving_total || 0).toFixed(1);

  const insight = useMemo(() => {
    const count = Number(cart?.count || 0);
    if (!count) return "Your checkout summary will update after adding sustainable products.";
    return `By choosing ${count} sustainable item${count === 1 ? "" : "s"}, this cart may help save ${totalSaving} kg CO₂ per month.`;
  }, [cart, totalSaving]);

  const formatCardNumber = (value) => value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const onChange = (event) => {
    const { name } = event.target;
    let { value } = event.target;
    if (name === "card_number") value = formatCardNumber(value);
    if (name === "expiry") value = formatExpiry(value);
    if (name === "cvc") value = value.replace(/\D/g, "").slice(0, 4);
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setErrors({});

    try {
      const response = await createCardCheckout(form);
      const orderId = response.data?.order_id || response.data?.order?.id;

      if (orderId) {
        navigate(`/orders/${orderId}/success`, { replace: true });
        return;
      }

      const successUrl = normalizeAppPath(response.data?.success_url);
      navigate(successUrl || "/orders", { replace: true });
    } catch (checkoutError) {
      const payload = checkoutError.response?.data;
      const orderId = payload?.order_id || payload?.order?.id;

      if (orderId) {
        navigate(`/orders/${orderId}/failed`, { replace: true });
        return;
      }

      const failedUrl = normalizeAppPath(payload?.failed_url);
      if (failedUrl) {
        navigate(failedUrl, { replace: true });
        return;
      }

      setError(payload?.message || checkoutError.message || "Could not complete payment.");
      setErrors(payload?.errors || {});
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <section className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-topbar">
            <Link to="/cart" className="checkout-back-link"><FiChevronLeft /> Back to Cart</Link>
            <Link to="/cart" className="checkout-cart-link"><FaShoppingCart /> EcoCart <b>{cart?.count || 0}</b></Link>
          </div>

          {loading ? (
            <div className="checkout-empty"><FaBoxes /><h1>Loading checkout...</h1><p>Preparing your sustainable order summary.</p></div>
          ) : !hasItems ? (
            <div className="checkout-empty"><FaShoppingCart /><h1>Your cart is empty</h1><p>Add sustainable products before checkout.</p><Link to="/marketplace" className="checkout-pay-button">Explore Marketplace</Link></div>
          ) : (
            <>
              <div className="checkout-steps" aria-label="Checkout progress">
                <div className="checkout-step done"><span><FiCheck /></span><span>Cart</span></div>
                <div className="checkout-step active"><span>2</span><span>Shipping</span></div>
                <div className="checkout-step active"><span>3</span><span>Payment</span></div>
                <div className="checkout-step"><span>4</span><span>Confirmation</span></div>
              </div>

              {error ? <div className="checkout-alert error"><FiAlertCircle /> {error}</div> : null}

              <form className="checkout-grid" onSubmit={handleSubmit}>
                <div>
                  <section className="checkout-section-card">
                    <div className="checkout-card-head">
                      <span><FaTruck /></span>
                      <div><h2>Shipping Information</h2><p>Where should your sustainable products be delivered?</p></div>
                    </div>
                    <div className="checkout-form-grid">
                      <CheckoutInput label="Full Name" name="full_name" icon={<FaUser />} value={form.full_name} onChange={onChange} error={errors.full_name?.[0]} placeholder="Your full name" />
                      <CheckoutInput label="Phone Number" name="phone" icon={<FaPhoneAlt />} value={form.phone} onChange={onChange} error={errors.phone?.[0]} placeholder="Your phone number" />
                      <CheckoutInput label="Email Address" name="email" type="email" icon={<FaEnvelope />} value={form.email} onChange={onChange} error={errors.email?.[0]} placeholder="you@example.com" />
                      <CheckoutInput label="City" name="city" icon={<FaMapMarkerAlt />} value={form.city} onChange={onChange} error={errors.city?.[0]} placeholder="City" />
                      <CheckoutInput label="Street Address" name="address" icon={<FaMapMarkerAlt />} value={form.address} onChange={onChange} error={errors.address?.[0]} placeholder="Street, building, floor" />
                      <CheckoutInput label="Region" name="region" icon={<FaMapMarkerAlt />} value={form.region} onChange={onChange} error={errors.region?.[0]} required={false} placeholder="Region / area" />
                      <CheckoutInput label="Delivery Notes" name="delivery_notes" icon={<FaMapMarkerAlt />} value={form.delivery_notes} onChange={onChange} error={errors.delivery_notes?.[0]} required={false} textarea placeholder="Optional delivery instructions" />
                    </div>
                  </section>

                  <section className="checkout-section-card">
                    <div className="checkout-card-head">
                      <span><FaCreditCard /></span>
                      <div><h2>Card Payment</h2><p>Enter your card details to complete your secure payment.</p></div>
                    </div>
                    <div className="payment-options">
                      <div className="payment-option">
                        <div className="payment-icon"><FaCreditCard /></div>
                        <div><strong>Credit / Debit Card</strong><small>Protected payment authorization for your EcoTrack marketplace order.</small></div>
                      </div>
                    </div>
                    <div className="checkout-form-grid payment-form-grid">
                      <CheckoutInput label="Cardholder Name" name="cardholder_name" icon={<FaIdCard />} value={form.cardholder_name} onChange={onChange} error={errors.cardholder_name?.[0]} placeholder="Name on card" />
                      <CheckoutInput label="Card Number" name="card_number" icon={<FaCreditCard />} value={form.card_number} onChange={onChange} error={errors.card_number?.[0]} placeholder="Card number" inputMode="numeric" maxLength={23} />
                      <CheckoutInput label="Expiry" name="expiry" icon={<FaCreditCard />} value={form.expiry} onChange={onChange} error={errors.expiry?.[0]} placeholder="12/34" inputMode="numeric" maxLength={5} />
                      <CheckoutInput label="CVC" name="cvc" icon={<FaLock />} value={form.cvc} onChange={onChange} error={errors.cvc?.[0]} placeholder="123" inputMode="numeric" maxLength={4} />
                    </div>
                    <div className="payment-test-note payment-note">
                      <FaLock /> Your payment information is checked securely before the order is placed.
                    </div>
                  </section>
                </div>

                <aside className="checkout-summary">
                  <div className="checkout-summary-card">
                    <h2>Order Summary</h2>
                    <div className="checkout-summary-items">
                      {items.map((item) => {
                        const product = item.product || {};
                        return (
                          <div className="checkout-summary-item" key={item.id}>
                            <div className="checkout-summary-image"><img src={getProductImage(product)} alt={product.name || "Marketplace product"} onError={handleProductImageError} /></div>
                            <div><h4>{product.name}</h4><p>Qty: {item.quantity} • {Number(item.carbon_saving_total || 0).toFixed(1)}kg CO₂ saved</p></div>
                            <strong>{money(item.line_total)}</strong>
                          </div>
                        );
                      })}
                    </div>
                    <div className="checkout-prices">
                      <div className="checkout-price-row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
                      <div className="checkout-price-row"><span>Shipping</span><span className="free">FREE</span></div>
                      <div className="checkout-price-row"><span>Discount</span><span>{money(cart.discount)}</span></div>
                      <div className="checkout-price-row total"><span>Total</span><span>{money(cart.total)}</span></div>
                    </div>
                    <div className="checkout-impact-row"><span><FaLeaf /> Total CO₂ saving</span><strong>{totalSaving} kg</strong></div>
                    <button className="checkout-pay-button" type="submit" disabled={submitting}>{submitting ? "Processing..." : <>Complete Payment <FaArrowRight /></>}</button>
                    <div className="checkout-trust">
                      <span><FaShieldAlt /> Secure card payment</span>
                      <span><FaLeaf /> Eco impact tracked after successful payment</span>
                      <span><FaTruck /> Verified sellers and carbon-neutral delivery</span>
                    </div>
                  </div>
                  <div className="checkout-insight-card"><strong><FaLeaf /> Eco Impact Insight</strong><p>{insight}</p></div>
                </aside>
              </form>
            </>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

export default MarketplaceCheckout;
