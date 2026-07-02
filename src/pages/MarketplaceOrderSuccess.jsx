import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaLeaf, FaShieldAlt, FaShoppingBag } from "react-icons/fa";
import { PublicShell } from "./public/PublicPages";
import { getOrderSuccess } from "../api/marketplaceApi";
import "./MarketplaceOrderSuccess.css";
import { getProductImage, handleProductImageError } from "../utils/productImages";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function MarketplaceOrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getOrderSuccess(id)
      .then((response) => {
        if (active) setOrder(response.data?.order || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load your order.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <PublicShell>
      <section className="order-result-page order-result-success">
        <div className="order-result-confetti" aria-hidden="true">
          {Array.from({ length: 42 }).map((_, index) => (
            <span
              key={index}
              style={{
                left: `${(index * 29) % 100}%`,
                animationDelay: `${(index % 12) * 0.26}s`,
                animationDuration: `${7 + (index % 4)}s`,
              }}
            />
          ))}
        </div>

        <div className="order-result-wrap">
          {loading ? (
            <div className="order-result-title">
              <h1>Loading order...</h1>
              <p>Preparing your checkout confirmation.</p>
            </div>
          ) : error ? (
            <>
              <div className="order-result-title">
                <h1>Order not found</h1>
                <p>{error}</p>
              </div>
              <div className="order-result-actions one">
                <Link to="/marketplace" className="primary">Continue Shopping</Link>
              </div>
            </>
          ) : (
            <>
              <div className="order-result-icon success" aria-hidden="true">
                <div className="order-result-ping" />
                <span><FaCheckCircle /></span>
              </div>

              <div className="order-result-title">
                <h1>Order placed successfully!</h1>
                <p>Your sustainable products are on the way.</p>
              </div>

              <div className="order-result-eco-card success">
                <div className="order-result-eco-icon"><FaLeaf /></div>
                <div>
                  <h3>Eco Celebration</h3>
                  <p className="order-result-eco-copy">
                    You helped support sustainable shopping and saved an estimated
                    <span className="order-result-carbon-total">{Number(order.carbon_saving_total || 0).toFixed(1)} kg CO₂/month</span>
                  </p>
                </div>
              </div>

              <div className="order-result-detail-card">
                <div className="order-result-meta-grid">
                  <div>
                    <span>Order Number</span>
                    <strong>{order.order_number}</strong>
                  </div>
                  <div>
                    <span>Total Amount</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                  <div>
                    <span>Estimated Delivery</span>
                    <strong>{order.estimated_delivery?.from} - {order.estimated_delivery?.to}</strong>
                  </div>
                </div>

                <div className="order-result-divider" />

                <div className="order-result-receipt">
                  <div className="order-result-receipt-head">
                    <span>Products bought</span>
                    <span>{order.items?.length || 0} item{Number(order.items?.length || 0) === 1 ? "" : "s"}</span>
                  </div>

                  {(order.items || []).map((item) => (
                    <div className="order-result-product-row receipt" key={item.id}>
                      <div className="order-result-product-image">
                        <img
                          src={getProductImage(item)}
                          alt={item.product_name || "Marketplace product"}
                          onError={handleProductImageError}
                        />
                      </div>
                      <div className="order-result-product-copy">
                        <p>{item.product_name}</p>
                        <small>
                          Qty: {item.quantity} • {Number(item.carbon_saving_total || 0).toFixed(1)} kg CO₂/month
                        </small>
                      </div>
                      <strong>{money(item.line_total)}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-result-status success">
                  Paid with card {order.simulated_card_last4 ? `•••• ${order.simulated_card_last4}` : ""}
                </div>
              </div>

              <div className="order-result-actions">
                <Link className="primary" to="/orders">View My Orders</Link>
                <Link to="/marketplace">Continue Shopping</Link>
                <Link to="/dashboard">Go to Dashboard</Link>
              </div>

              <div className="order-result-secure">
                <FaShieldAlt /> Safe & secure transaction guaranteed by EcoTrack Hub.
              </div>
            </>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

export default MarketplaceOrderSuccess;
