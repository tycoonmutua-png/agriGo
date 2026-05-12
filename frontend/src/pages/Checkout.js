import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Checkout.css";

const STEPS = ["Cart Review", "Delivery", "Confirm", "Payment"];

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestID, setCheckoutRequestID] = useState(null);
  const [stkSent, setStkSent] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const [delivery, setDelivery] = useState({
    name: "", phone: "", email: "", county: "", address: "", notes: ""
  });
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("cart");
    if (!saved || JSON.parse(saved).length === 0) { navigate("/products"); return; }
    setCart(JSON.parse(saved));
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setDelivery(d => ({ ...d, name: payload.name || "", email: payload.email || "", phone: payload.phone || "" }));
        setMpesaPhone(payload.phone || "");
      }
    } catch {}
  }, [navigate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (deliveryMethod === "delivery" && paymentMethod === "pay_on_pickup") setPaymentMethod("stk");
  }, [deliveryMethod]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const getCategoryEmoji = (cat) => ({
    Seeds: "🌱", Fertilizer: "🧪", Pesticides: "🛡️",
    Equipment: "⚙️", Produce: "🥬", Feeds: "📦"
  }[cat] || "📦");

  const nextStep = () => { setError(""); setStep(s => Math.min(s + 1, 4)); };
  const prevStep = () => { setError(""); setStep(s => Math.max(s - 1, 0)); };

  // ── STEP 1: Delivery validation ──
  const handleDeliveryNext = (e) => {
    e.preventDefault();
    if (!deliveryMethod) { setError("Please choose delivery or pickup."); return; }
    if (deliveryMethod === "delivery") {
      if (!delivery.name || !delivery.phone || !delivery.county || !delivery.address) {
        setError("Please fill in all required fields."); return;
      }
    } else {
      if (!delivery.name || !delivery.phone) {
        setError("Please provide your name and phone number."); return;
      }
    }
    setError("");
    nextStep();
  };

  // ── STEP 2: Place Order → saved to DB ──
  const handlePlaceOrder = async () => {
    setError("");
    setLoading(true);
    try {
      const orderData = {
        items: cart.map(i => ({ product: i._id, quantity: i.qty, price: i.price })),
        deliveryMethod,
        delivery: deliveryMethod === "delivery" ? delivery : {
          name: delivery.name, phone: delivery.phone, email: delivery.email,
        },
        payment: {
          method: paymentMethod,
          phone: paymentMethod === "pay_on_pickup" ? delivery.phone : mpesaPhone,
          amount: cartTotal,
          status: "pending",
        },
        total: cartTotal,
      };
      const res = await API.post("/orders", orderData);
      setOrderId(res.data._id);
      sessionStorage.removeItem("cart");
      nextStep();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STK Push ──
  const handleStkPush = async () => {
    if (!mpesaPhone) { setError("Enter your M-Pesa phone number."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/payments/stk-push", {
        phone: mpesaPhone,
        amount: cartTotal,
        orderId,
      });
      setCheckoutRequestID(res.data.checkoutRequestID);
      setStkSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "STK push failed. Try manual M-Pesa instead.");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm STK Payment with Safaricom ──
  const handleConfirmStkPayment = async () => {
    if (!checkoutRequestID) {
      setError("Payment reference not found. Please resend the prompt.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/payments/query", { checkoutRequestID, orderId });
      setPaymentDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Payment not confirmed. Please enter your PIN and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit Manual M-Pesa code ──
  const handleManualPayment = async () => {
    if (!mpesaCode) { setError("Please enter the M-Pesa transaction code."); return; }
    setError("");
    setLoading(true);
    try {
      await API.put(`/orders/${orderId}`, {
        "payment.mpesaCode": mpesaCode,
        "payment.phone":     mpesaPhone,
      });
      setPaymentDone(true);
    } catch (err) {
      setError("Failed to save payment code. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const COUNTIES = [
    "Nairobi","Nakuru","Uasin Gishu","Meru","Kisumu","Machakos",
    "Murang'a","Nyeri","Kiambu","Trans Nzoia","Bungoma","Kakamega",
    "Nandi","Laikipia","Embu",
  ];

  const showSuccess = step === 3 && orderId && (paymentDone || paymentMethod === "pay_on_pickup");

  return (
    <div className="checkout-page">

      {/* PROGRESS BAR */}
      <div className="checkout-progress">
        {STEPS.map((s, i) => (
          <div key={s} className={`progress-step ${i <= step ? "progress-step--active" : ""} ${i < step ? "progress-step--done" : ""}`}>
            <div className="progress-dot">{i < step ? "✓" : i + 1}</div>
            <span className="progress-label">{s}</span>
            {i < STEPS.length - 1 && <div className="progress-line" />}
          </div>
        ))}
      </div>

      <div className="checkout-body">
        <div className="checkout-main">

          {/* ── STEP 0: Cart Review ── */}
          {step === 0 && (
            <div className="checkout-card">
              <h2 className="checkout-card-title">🛒 Review Your Order</h2>
              <div className="checkout-items">
                {cart.map(item => (
                  <div key={item._id} className="checkout-item">
                    <div className="checkout-item-icon">{getCategoryEmoji(item.category)}</div>
                    <div className="checkout-item-info">
                      <p className="checkout-item-name">{item.name}</p>
                      <p className="checkout-item-sub">{item.qty} × KES {Number(item.price).toLocaleString()}</p>
                    </div>
                    <div className="checkout-item-total">KES {(item.qty * item.price).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {error && <div className="checkout-error">{error}</div>}
              <div className="checkout-card-actions">
                <button className="btn-back" onClick={() => navigate("/products")}>← Back to Shop</button>
                <button className="btn-next" onClick={nextStep}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Delivery + Payment Method ── */}
          {step === 1 && (
            <div className="checkout-card">
              <h2 className="checkout-card-title">📦 Delivery & Payment Method</h2>

              <div className="delivery-method-row">
                <button type="button"
                  className={`delivery-method-btn ${deliveryMethod === "delivery" ? "delivery-method-btn--active" : ""}`}
                  onClick={() => { setDeliveryMethod("delivery"); setError(""); }}
                >
                  <span className="delivery-method-icon">🚚</span>
                  <div>
                    <div className="delivery-method-title">Home Delivery</div>
                    <div className="delivery-method-sub">We bring it to your door</div>
                  </div>
                </button>
                <button type="button"
                  className={`delivery-method-btn ${deliveryMethod === "pickup" ? "delivery-method-btn--active" : ""}`}
                  onClick={() => { setDeliveryMethod("pickup"); setError(""); }}
                >
                  <span className="delivery-method-icon">🏪</span>
                  <div>
                    <div className="delivery-method-title">Self Pickup</div>
                    <div className="delivery-method-sub">Collect from our store</div>
                  </div>
                </button>
              </div>

              <form onSubmit={handleDeliveryNext} className="checkout-form" style={{ marginTop: "20px" }}>
                {deliveryMethod === "pickup" && (
                  <div className="pickup-info-box">
                    <p>🏪 <strong>Store Location:</strong> AgriGo Store, Nairobi CBD</p>
                    <p>🕒 <strong>Pickup Hours:</strong> Mon–Sat, 8:00 AM – 6:00 PM</p>
                    <p>📞 We'll call you when your order is ready.</p>
                  </div>
                )}

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input type="text" placeholder="John Mwangi" value={delivery.name}
                      onChange={e => setDelivery({ ...delivery, name: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>Phone Number *</label>
                    <input type="tel" placeholder="+254 700 000 000" value={delivery.phone}
                      onChange={e => setDelivery({ ...delivery, phone: e.target.value })} required />
                  </div>
                </div>

                <div className="form-field">
                  <label>Email Address <span style={{ opacity: 0.5 }}>(receipt will be sent here)</span></label>
                  <input type="email" placeholder="john@example.com" value={delivery.email}
                    onChange={e => setDelivery({ ...delivery, email: e.target.value })} />
                </div>

                {deliveryMethod === "delivery" && (
                  <>
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>County *</label>
                        <select value={delivery.county}
                          onChange={e => setDelivery({ ...delivery, county: e.target.value })} required>
                          <option value="">Select county</option>
                          {COUNTIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-field">
                        <label>Town / Area *</label>
                        <input type="text" placeholder="e.g. Westlands" value={delivery.address}
                          onChange={e => setDelivery({ ...delivery, address: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Delivery Notes (optional)</label>
                      <textarea rows={2} placeholder="e.g. Near the market, blue gate..."
                        value={delivery.notes} onChange={e => setDelivery({ ...delivery, notes: e.target.value })} />
                    </div>
                  </>
                )}

                {deliveryMethod && (
                  <div style={{ marginTop: "24px" }}>
                    <label style={{ fontSize: "0.85rem", opacity: 0.7, display: "block", marginBottom: "10px" }}>
                      💳 How would you like to pay?
                    </label>
                    <div className="payment-method-row">
                      <button type="button"
                        className={`payment-method-btn ${paymentMethod === "stk" ? "payment-method-btn--active" : ""}`}
                        onClick={() => setPaymentMethod("stk")}
                      >
                        <span className="payment-method-icon">📱</span>
                        <div>
                          <div className="payment-method-title">M-Pesa STK</div>
                          <div className="payment-method-sub">Prompt on your phone</div>
                        </div>
                      </button>
                      <button type="button"
                        className={`payment-method-btn ${paymentMethod === "manual" ? "payment-method-btn--active" : ""}`}
                        onClick={() => setPaymentMethod("manual")}
                      >
                        <span className="payment-method-icon">🧾</span>
                        <div>
                          <div className="payment-method-title">Manual M-Pesa</div>
                          <div className="payment-method-sub">Enter transaction code</div>
                        </div>
                      </button>
                      {deliveryMethod === "pickup" && (
                        <button type="button"
                          className={`payment-method-btn ${paymentMethod === "pay_on_pickup" ? "payment-method-btn--active" : ""}`}
                          onClick={() => setPaymentMethod("pay_on_pickup")}
                        >
                          <span className="payment-method-icon">💵</span>
                          <div>
                            <div className="payment-method-title">Pay on Pickup</div>
                            <div className="payment-method-sub">Cash or card at store</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {error && <div className="checkout-error">{error}</div>}
                <div className="checkout-card-actions">
                  <button type="button" className="btn-back" onClick={prevStep}>← Back</button>
                  <button type="submit" className="btn-next">Review Order →</button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 2: Confirm & Place Order ── */}
          {step === 2 && (
            <div className="checkout-card">
              <h2 className="checkout-card-title">✅ Confirm & Place Order</h2>

              <div className="confirm-section">
                {deliveryMethod === "delivery" ? (
                  <>
                    <h3>📍 Delivery To</h3>
                    <p>{delivery.name} — {delivery.phone}</p>
                    <p>{delivery.address}, {delivery.county}</p>
                    {delivery.notes && <p className="confirm-notes">{delivery.notes}</p>}
                  </>
                ) : (
                  <>
                    <h3>🏪 Self Pickup</h3>
                    <p>{delivery.name} — {delivery.phone}</p>
                    <p className="confirm-notes">AgriGo Store, Nairobi CBD — we'll call when ready.</p>
                  </>
                )}
                {delivery.email && (
                  <p style={{ fontSize: "0.82rem", opacity: 0.6, marginTop: "6px" }}>
                    📧 Receipt → {delivery.email}
                  </p>
                )}
              </div>

              <div className="confirm-section">
                <h3>💳 Payment</h3>
                {paymentMethod === "pay_on_pickup"
                  ? <p>💵 Pay on Pickup — Cash / Card / M-Pesa at store</p>
                  : <p>{paymentMethod === "stk" ? "📱 M-Pesa STK Push" : "🧾 Manual M-Pesa"}</p>
                }
              </div>

              <div className="confirm-section">
                <h3>🛒 Items ({cartCount})</h3>
                {cart.map(item => (
                  <div key={item._id} className="confirm-item">
                    <span>{getCategoryEmoji(item.category)} {item.name} × {item.qty}</span>
                    <span>KES {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="confirm-total">
                <span>Total</span>
                <span>KES {cartTotal.toLocaleString()}</span>
              </div>

              {error && <div className="checkout-error">{error}</div>}
              <div className="checkout-card-actions">
                <button className="btn-back" onClick={prevStep}>← Back</button>
                <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? <span className="checkout-spinner" /> : "🌾 Place Order →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === 3 && orderId && !showSuccess && (
            <div className="checkout-card">
              <h2 className="checkout-card-title">💳 Complete Payment</h2>

              <div className="pickup-info-box" style={{ marginBottom: "20px" }}>
                <p style={{ margin: 0 }}>
                  ✅ Order <strong>#{String(orderId).slice(-8).toUpperCase()}</strong> placed!
                  Complete your payment below.
                </p>
              </div>

              <div className="amount-display">
                <span>Amount to pay</span>
                <span className="amount-value">KES {cartTotal.toLocaleString()}</span>
              </div>

              {/* ── STK Push ── */}
              {paymentMethod === "stk" && (
                <div className="payment-section">
                  <div className="form-field">
                    <label>M-Pesa Phone Number</label>
                    <input type="tel" placeholder="e.g. 0712 345 678" value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)} />
                  </div>

                  {!stkSent ? (
                    <button className="btn-stk" onClick={handleStkPush} disabled={loading}>
                      {loading ? <span className="checkout-spinner" /> : "📱 Send M-Pesa Prompt"}
                    </button>
                  ) : (
                    <div className="stk-sent-box">
                      <div className="stk-sent-icon">📱</div>
                      <h3>Check your phone!</h3>
                      <p>A prompt of <strong>KES {cartTotal.toLocaleString()}</strong> was sent to <strong>{mpesaPhone}</strong>.</p>
                      <p>Enter your M-Pesa PIN, then click the button below.</p>

                      {error && <div className="checkout-error" style={{ marginTop: "12px" }}>{error}</div>}

                      <button
                        className="btn-next"
                        style={{ marginTop: "16px" }}
                        onClick={handleConfirmStkPayment}
                        disabled={loading}
                      >
                        {loading
                          ? <><span className="checkout-spinner" /> Verifying with Safaricom…</>
                          : "✅ I've completed payment"}
                      </button>

                      <button className="btn-back" style={{ marginTop: "8px" }}
                        onClick={() => { setStkSent(false); setCheckoutRequestID(null); setError(""); }}>
                        ↩ Resend prompt
                      </button>
                    </div>
                  )}

                  {!stkSent && error && <div className="checkout-error">{error}</div>}
                </div>
              )}

              {/* ── Manual M-Pesa ── */}
              {paymentMethod === "manual" && (
                <div className="payment-section">
                  <div className="manual-instructions">
                    <h3>How to pay</h3>
                    <ol>
                      <li>Open <strong>M-Pesa</strong> on your phone</li>
                      <li>Select <strong>Lipa na M-Pesa → Buy Goods</strong></li>
                      <li>Till Number: <strong className="till-number">522522</strong></li>
                      <li>Amount: <strong>KES {cartTotal.toLocaleString()}</strong></li>
                      <li>Enter PIN → confirm</li>
                      <li>Copy the <strong>transaction code</strong> from the SMS</li>
                    </ol>
                  </div>
                  <div className="form-field">
                    <label>M-Pesa Transaction Code *</label>
                    <input type="text" placeholder="e.g. QHX7Y8Z1A2" value={mpesaCode}
                      onChange={e => setMpesaCode(e.target.value.toUpperCase())}
                      style={{ letterSpacing: "2px", fontWeight: "600" }} />
                  </div>
                  <div className="form-field">
                    <label>M-Pesa Phone Number</label>
                    <input type="tel" placeholder="e.g. 0712 345 678" value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)} />
                  </div>

                  <div className="pickup-info-box" style={{ marginTop: "12px" }}>
                    <p style={{ margin: 0 }}>
                      ℹ️ Your code will be verified by our team. Once confirmed, you'll receive a receipt.
                    </p>
                  </div>

                  {error && <div className="checkout-error">{error}</div>}
                  <div className="checkout-card-actions">
                    <button className="btn-place-order" onClick={handleManualPayment}
                      disabled={loading || !mpesaCode}>
                      {loading ? <span className="checkout-spinner" /> : "✅ Submit Payment Code"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SUCCESS ── */}
          {showSuccess && (
            <div className="checkout-card checkout-success">
              <div className="success-icon">🎉</div>
              <h2>
                {paymentMethod === "manual"
                  ? "Order Placed — Awaiting Verification"
                  : "Order & Payment Confirmed!"}
              </h2>
              <p className="success-sub">Thank you for shopping with AgriGo</p>

              <div className="success-order-id">
                Order ID: <strong>#{String(orderId).slice(-8).toUpperCase()}</strong>
              </div>

              <div className="success-details">
                <div className="success-detail-row">
                  <span>📦 Items</span><span>{cartCount} items</span>
                </div>
                <div className="success-detail-row">
                  <span>💰 Total</span><span>KES {cartTotal.toLocaleString()}</span>
                </div>
                <div className="success-detail-row">
                  <span>{deliveryMethod === "delivery" ? "📍 Delivery to" : "🏪 Pickup from"}</span>
                  <span>{deliveryMethod === "delivery" ? delivery.county : "AgriGo Store, Nairobi"}</span>
                </div>
                <div className="success-detail-row">
                  <span>💳 Payment</span>
                  <span>{paymentMethod === "pay_on_pickup" ? "Pay at store" : paymentMethod === "stk" ? "M-Pesa STK ✅" : "Manual — Pending verification"}</span>
                </div>
              </div>

              {delivery.email && paymentMethod !== "manual" && (
                <p style={{ fontSize: "0.85rem", color: "#4ade80", marginTop: "12px" }}>
                  📧 Receipt sent to <strong>{delivery.email}</strong>
                </p>
              )}
              {delivery.email && paymentMethod === "manual" && (
                <p style={{ fontSize: "0.85rem", color: "#ffb020", marginTop: "12px" }}>
                  📧 Receipt will be sent to <strong>{delivery.email}</strong> once payment is verified.
                </p>
              )}

              <p className="success-msg">
                {paymentMethod === "manual"
                  ? "Our team will verify your M-Pesa code and confirm your order shortly."
                  : paymentMethod === "pay_on_pickup"
                    ? "Your order is being prepared. Collect within 24 hours and bring your Order ID."
                    : deliveryMethod === "delivery"
                      ? "Payment confirmed! Your order will be delivered within 2–5 business days."
                      : "Payment confirmed! We'll call you when your order is ready to collect."}
              </p>

              <div className="success-actions">
                <button className="btn-next" onClick={() => navigate("/products")}>🌿 Continue Shopping</button>
                <button className="btn-back" onClick={() => navigate("/dashboard")}>📊 View Dashboard</button>
              </div>
            </div>
          )}

        </div>

        {/* ORDER SUMMARY SIDEBAR */}
        {step < 3 && (
          <div className="checkout-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item._id} className="summary-item">
                  <span className="summary-item-icon">{getCategoryEmoji(item.category)}</span>
                  <div className="summary-item-info">
                    <p>{item.name}</p>
                    <p className="summary-item-qty">Qty: {item.qty}</p>
                  </div>
                  <span className="summary-item-price">KES {(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
            <div className="summary-row">
              <span>Subtotal</span><span>KES {cartTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>{deliveryMethod === "pickup" ? "Pickup" : "Delivery"}</span>
              <span className="summary-free">{deliveryMethod === "pickup" ? "Self Collect" : "FREE"}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-total">
              <span>Total</span><span>KES {cartTotal.toLocaleString()}</span>
            </div>
            {paymentMethod === "pay_on_pickup" ? (
              <div className="summary-badge" style={{ background: "rgba(255,176,32,0.1)", color: "#ffb020", borderColor: "rgba(255,176,32,0.3)" }}>
                💵 Pay KES {cartTotal.toLocaleString()} at store
              </div>
            ) : (
              <div className="summary-badge">🔒 Secured by M-Pesa</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}