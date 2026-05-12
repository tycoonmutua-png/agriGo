const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function buildReceiptHTML(order, forAdmin = false) {
  const isPickup     = order.deliveryMethod === "pickup";
  const isPayOnPickup = order.payment?.method === "pay_on_pickup";
  const orderId      = String(order._id).slice(-8).toUpperCase();
  const total        = Number(order.total || order.totalAmount || 0).toLocaleString();
  const customerName = order.delivery?.name || "Customer";
  const customerPhone= order.delivery?.phone || "—";
  const customerEmail= order.delivery?.email || "—";
  const date         = new Date(order.createdAt || Date.now()).toLocaleString("en-KE");

  const itemsHTML = (order.items || [])
    .map(item => {
      const name  = item.name || item.product?.name || "Product";
      const qty   = item.quantity || item.qty || 1;
      const price = Number(item.price || 0);
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #1e3a2a;color:#c8f0d0;">${name}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1e3a2a;text-align:center;color:#c8f0d0;">${qty}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1e3a2a;text-align:right;color:#4ade80;font-weight:600;">
            KES ${(price * qty).toLocaleString()}
          </td>
        </tr>`;
    })
    .join("");

  const deliverySection = isPickup
    ? `<p style="margin:6px 0;">🏪 <strong>Self Pickup</strong> — AgriGo Store, Nairobi CBD</p>
       <p style="margin:6px 0;">🕒 Pickup Hours: Mon–Sat, 8:00 AM – 6:00 PM</p>
       <p style="margin:6px 0;color:#ffb020;">📞 We will call <strong>${customerPhone}</strong> when your order is ready.</p>`
    : `<p style="margin:6px 0;">📍 ${order.delivery?.address || ""}, ${order.delivery?.county || ""}</p>
       <p style="margin:6px 0;">🕒 Expected delivery: 2–5 business days</p>`;

  const paymentSection = isPayOnPickup
    ? `<p style="margin:6px 0;">💵 <strong>Pay on Pickup</strong> — Cash or Card at store</p>
       <p style="margin:6px 0;color:#ffb020;">⚠️ Please have KES ${total} ready when collecting.</p>`
    : `<p style="margin:6px 0;">📱 <strong>${order.payment?.method === "stk" ? "M-Pesa STK Push" : "Manual M-Pesa"}</strong></p>
       <p style="margin:6px 0;">📞 Phone: ${order.payment?.phone || "—"}</p>
       ${order.payment?.mpesaCode
         ? `<p style="margin:6px 0;">🧾 M-Pesa Code: <strong style="color:#4ade80;letter-spacing:2px;">${order.payment.mpesaCode}</strong></p>`
         : ""}
       <p style="margin:6px 0;">✅ Payment Status: <strong style="color:#4ade80;">${order.payment?.status || "pending"}</strong></p>`;

  // Admin gets extra info the customer doesn't need to see
  const adminOnlySection = forAdmin ? `
    <div style="background:#0a1f14;border:1px solid #ff6b35;border-radius:10px;padding:18px;margin:20px 0;">
      <h3 style="margin:0 0 12px;color:#ff6b35;font-size:14px;">🔐 ADMIN COPY — INTERNAL RECORD</h3>
      <p style="margin:4px 0;font-size:13px;">Customer Email: <strong>${customerEmail}</strong></p>
      <p style="margin:4px 0;font-size:13px;">Customer Phone: <strong>${customerPhone}</strong></p>
      <p style="margin:4px 0;font-size:13px;">Delivery Method: <strong>${isPickup ? "Self Pickup" : "Home Delivery"}</strong></p>
      <p style="margin:4px 0;font-size:13px;">Payment Method: <strong>${isPayOnPickup ? "Pay on Pickup" : order.payment?.method === "stk" ? "STK Push" : "Manual M-Pesa"}</strong></p>
      <p style="margin:4px 0;font-size:13px;">Order Placed: <strong>${date}</strong></p>
      <p style="margin:4px 0;font-size:13px;">Order ID (full): <strong>${order._id}</strong></p>
    </div>` : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#071510;font-family:Arial,sans-serif;color:#e0ffe0;">
  <div style="max-width:600px;margin:32px auto;background:#0d2b1a;border-radius:16px;overflow:hidden;border:1px solid #1e3a2a;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d4a2a,#1a6e3c);padding:36px;text-align:center;">
      <h1 style="margin:0;font-size:28px;color:#4ade80;">🌾 AgriGo</h1>
      <p style="margin:8px 0 0;color:#a7f3c0;font-size:15px;">
        ${forAdmin ? "📋 New Order — Admin Copy" : "✅ Order Confirmed!"}
      </p>
    </div>

    <!-- Order ID Banner -->
    <div style="background:#0a1f14;padding:16px;text-align:center;border-bottom:1px solid #1e3a2a;">
      <p style="margin:0;font-size:13px;color:#6b9e7a;">ORDER ID</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#4ade80;letter-spacing:3px;">#${orderId}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b9e7a;">${date}</p>
    </div>

    <div style="padding:24px;">

      ${forAdmin ? adminOnlySection : `
      <!-- Greeting for customer -->
      <p style="font-size:16px;color:#c8f0d0;">Hi <strong>${customerName}</strong>,</p>
      <p style="color:#8ab89a;font-size:14px;">
        Thank you for shopping with AgriGo! Here's your order summary below.
      </p>`}

      ${forAdmin ? "" : adminOnlySection /* empty for customer */}

      <!-- Items Table -->
      <h3 style="color:#4ade80;font-size:14px;margin:20px 0 10px;">🛒 Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;background:#0a1f14;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#1a3d28;">
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#6b9e7a;text-transform:uppercase;">Item</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;color:#6b9e7a;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 14px;text-align:right;font-size:12px;color:#6b9e7a;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
        <tfoot>
          <tr style="background:#1a3d28;">
            <td colspan="2" style="padding:12px 14px;font-weight:700;color:#c8f0d0;">TOTAL</td>
            <td style="padding:12px 14px;text-align:right;font-weight:700;font-size:18px;color:#4ade80;">KES ${total}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Delivery Section -->
      <div style="background:#0a1f14;border-radius:10px;padding:18px;margin:20px 0;">
        <h3 style="margin:0 0 12px;color:#4ade80;font-size:14px;">${isPickup ? "🏪 Pickup Details" : "📍 Delivery Details"}</h3>
        ${deliverySection}
      </div>

      <!-- Payment Section -->
      <div style="background:#0a1f14;border-radius:10px;padding:18px;margin:20px 0;">
        <h3 style="margin:0 0 12px;color:#4ade80;font-size:14px;">💳 Payment Details</h3>
        ${paymentSection}
      </div>

      <!-- Footer message -->
      <div style="text-align:center;padding:20px 0 8px;">
        ${isPayOnPickup
          ? `<p style="color:#8ab89a;font-size:13px;">Please bring your Order ID <strong>#${orderId}</strong> when you come to collect.</p>`
          : `<p style="color:#8ab89a;font-size:13px;">Keep this email as your receipt. For support, reply to this email.</p>`
        }
        <p style="color:#4a7a5a;font-size:12px;margin-top:16px;">AgriGo — Your Trusted Agrovet Partner 🌱</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

/**
 * Send receipt to BOTH customer and admin
 * @param {Object} order - the full order object from MongoDB
 */
async function sendReceipt(order) {
  const customerEmail = order.delivery?.email;
  const adminEmail    = process.env.ADMIN_EMAIL;
  const orderId       = String(order._id).slice(-8).toUpperCase();
  const isPayOnPickup = order.payment?.method === "pay_on_pickup";

  const subject = isPayOnPickup
    ? `AgriGo Order #${orderId} — Ready for Pickup (Pay at Store)`
    : `AgriGo Order #${orderId} — Confirmed ✅`;

  const errors = [];

  // 1. Send to customer (only if they gave an email)
  if (customerEmail) {
    try {
      await transporter.sendMail({
        from: `"AgriGo 🌾" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject,
        html: buildReceiptHTML(order, false),
      });
      console.log(`✅ Receipt sent to customer: ${customerEmail}`);
    } catch (err) {
      console.error("❌ Failed to send customer receipt:", err.message);
      errors.push("customer");
    }
  } else {
    console.log("ℹ️  No customer email — skipping customer receipt");
  }

  // 2. Always send admin copy
  if (adminEmail) {
    try {
      await transporter.sendMail({
        from: `"AgriGo System 🌾" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `[ADMIN COPY] ${subject}`,
        html: buildReceiptHTML(order, true),
      });
      console.log(`✅ Admin copy sent to: ${adminEmail}`);
    } catch (err) {
      console.error("❌ Failed to send admin receipt:", err.message);
      errors.push("admin");
    }
  } else {
    console.warn("⚠️  ADMIN_EMAIL not set in .env — skipping admin copy");
  }

  return { sent: errors.length === 0, errors };
}

module.exports = { sendReceipt };