import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaLeaf, FaShieldAlt, FaShoppingBag, FaTimesCircle } from "react-icons/fa";
import { PublicShell } from "./public/PublicPages";
import { getOrderFailure } from "../api/marketplaceApi";
import "./MarketplaceOrderSuccess.css";
import { getProductImage, handleProductImageError } from "../utils/productImages";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const failureMessages = {
  card_declined: "Your card was declined.",
  insufficient_funds: "This card has insufficient funds.",
  authentication_failed: "This card failed authentication.",
  unsupported_test_card: "This card could not be approved.",
};

const failureLabels = {
  card_declined: "Card declined",
  insufficient_funds: "Insufficient funds",
  authentication_failed: "Authentication failed",
  unsupported_test_card: "Card not approved",
};

function MarketplaceOrderFailed() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getOrderFailure(id)
      .then((response) => {
        if (active) setOrder(response.data?.order || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load the failed order.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  const reason = failureMessages[order?.simulated_payment_result] || "The payment could not be approved.";
  const reasonLabel = failureLabels[order?.simulated_payment_result] || "Declined";

  return (
    <PublicShell>
      <section className="order-result-page order-result-failed">
        <div className="order-result-confetti failed" aria-hidden="true">
          {Array.from({ length: 34 }).map((_, index) => (
            <span
              key={index}
              style={{
                left: `${(index * 31) % 100}%`,
                animationDelay: `${(index % 10) * 0.3}s`,
                animationDuration: `${7 + (index % 5)}s`,
              }}
            />
          ))}
        </div>

        <div className="order-result-wrap">
          {loading ? (
            <div className="order-result-title">
              <h1>Loading payment result...</h1>
              <p>Checking your payment attempt.</p>
            </div>
          ) : error ? (
            <>
              <div className="order-result-title">
                <h1>Order not found</h1>
                <p>{error}</p>
              </div>
              <div className="order-result-actions one">
                <Link to="/marketplace" className="primary failed">Continue Shopping</Link>
              </div>
            </>
          ) : (
            <>
              <div className="order-result-icon failed" aria-hidden="true">
                <div className="order-result-ping" />
                <span><FaTimesCircle /></span>
              </div>

              <div className="order-result-title">
                <h1>Payment failed</h1>
                <p>{reason} Your order was not completed.</p>
              </div>

              <div className="order-result-eco-card failed">
                <div className="order-result-eco-icon"><FaLeaf /></div>
                <div>
                  <h3>Eco order not completed yet</h3>
                  <p>
                    Your cart is still saved. Please check your payment details or try another card.
                  </p>
                </div>
              </div>

              <div className="order-result-detail-card failed">
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
                    <span>Card Last 4</span>
                    <strong>{order.simulated_card_last4 ? `•••• ${order.simulated_card_last4}` : "----"}</strong>
                  </div>
                </div>

                <div className="order-result-divider" />

                <div className="order-result-receipt failed">
                  <div className="order-result-receipt-head">
                    <span>Products in failed checkout</span>
                    <span>{order.items?.length || 0} item{Number(order.items?.length || 0) === 1 ? "" : "s"}</span>
                  </div>

                  {(order.items || []).map((item) => (
                    <div className="order-result-product-row receipt" key={item.id}>
                      <div className="order-result-product-image failed">
                        <img
                          src={getProductImage(item)}
                          alt={item.product_name || "Marketplace product"}
                          onError={handleProductImageError}
                        />
                      </div>
                      <div className="order-result-product-copy">
                        <p>{item.product_name}</p>
                        <small>
                          Qty: {item.quantity} • Potential {Number(item.carbon_saving_total || 0).toFixed(1)} kg CO₂/month
                        </small>
                      </div>
                      <strong>{money(item.line_total)}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-result-status failed">
                  Payment failed • {reasonLabel}
                </div>
              </div>

              <div className="order-result-actions">
                <Link className="primary failed" to="/checkout">Try Payment Again</Link>
                <Link to="/cart">Return to Cart</Link>
                <Link to="/marketplace">Continue Shopping</Link>
              </div>

              <div className="order-result-secure failed">
                <FaShieldAlt /> Your payment was not completed. You can try again or return to your cart.
              </div>
            </>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

export default MarketplaceOrderFailed;
