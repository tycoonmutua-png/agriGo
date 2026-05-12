const axios  = require("axios");
const Order  = require("../models/Order");
const { sendReceipt } = require("../services/mailer");

// ── Get OAuth Token ──
const getAccessToken = async () => {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  return res.data.access_token;
};

// ── Generate Password ──
const generatePassword = () => {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey   = process.env.MPESA_PASSKEY;
  const timestamp = getTimestamp();
  const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  return { password, timestamp };
};

const getTimestamp = () => {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
};

// ── Format phone to 254XXXXXXXXX ──
const formatPhone = (phone) => {
  phone = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (phone.startsWith("+254")) return phone.slice(1);
  if (phone.startsWith("0"))    return "254" + phone.slice(1);
  if (phone.startsWith("254"))  return phone;
  return "254" + phone;
};

// ── STK Push ──
exports.stkPush = async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount are required." });
    }

    const accessToken             = await getAccessToken();
    const { password, timestamp } = generatePassword();
    const formattedPhone          = formatPhone(phone);

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   "CustomerPayBillOnline",
      Amount:            Math.ceil(amount),
      PartyA:            formattedPhone,
      PartyB:            process.env.MPESA_SHORTCODE,
      PhoneNumber:       formattedPhone,
      CallBackURL:       `${process.env.CALLBACK_URL}/api/payments/callback`,
      AccountReference:  orderId || "AgriGo",
      TransactionDesc:   "AgriGo Purchase",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const checkoutRequestID = response.data.CheckoutRequestID;

    // ── Save checkoutRequestID on the order so callback can find it ──
    if (orderId && orderId !== "AgriGo") {
      await Order.findByIdAndUpdate(orderId, {
        "payment.checkoutRequestID": checkoutRequestID,
        "payment.phone": formatPhone(phone),
      }).catch(err => console.error("Failed to save checkoutRequestID:", err.message));
    }

    return res.status(200).json({
      message:           "STK push sent successfully",
      checkoutRequestID,
      merchantRequestID: response.data.MerchantRequestID,
      responseCode:      response.data.ResponseCode,
    });

  } catch (err) {
    console.error("STK Push Error:", err.response?.data || err.message);
    return res.status(500).json({
      message: "Failed to initiate M-Pesa payment",
      error:   err.response?.data || err.message,
    });
  }
};

// ── STK Push Callback (Safaricom calls this after customer pays) ──
exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const callback  = Body?.stkCallback;

    if (!callback) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const resultCode    = callback.ResultCode;
    const resultDesc    = callback.ResultDesc;
    const checkoutID    = callback.CheckoutRequestID;

    if (resultCode === 0) {
      // ── Payment confirmed by Safaricom ──
      const items     = callback.CallbackMetadata?.Item || [];
      const amount    = items.find(i => i.Name === "Amount")?.Value;
      const mpesaCode = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
      const phone     = items.find(i => i.Name === "PhoneNumber")?.Value;

      console.log("✅ M-Pesa Payment Confirmed:", { amount, mpesaCode, phone, checkoutID });

      // Find order by checkoutRequestID and mark as paid
      const order = await Order.findOneAndUpdate(
        { "payment.checkoutRequestID": checkoutID },
        {
          $set: {
            "payment.status":    "paid",
            "payment.mpesaCode": mpesaCode,
            "payment.phone":     String(phone),
            "payment.amount":    amount,
            status:              "processing", // auto-advance order status
          },
        },
        { new: true }
      );

      if (order) {
        console.log(`✅ Order ${order._id} marked as paid`);
        // Send receipt NOW — payment is confirmed
        sendReceipt(order).catch(err =>
          console.error("Receipt email error after STK callback:", err.message)
        );
      } else {
        console.warn("⚠️  No order found for checkoutRequestID:", checkoutID);
      }

    } else {
      // Payment failed or cancelled by user
      console.log("❌ M-Pesa Payment Failed:", resultCode, resultDesc);

      // Mark order payment as failed
      await Order.findOneAndUpdate(
        { "payment.checkoutRequestID": checkoutID },
        { $set: { "payment.status": "failed" } }
      ).catch(() => {});
    }

    // Always return success to Safaricom (required)
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (err) {
    console.error("Callback Error:", err.message);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
};

// ── Query STK Push Status ──
exports.stkQuery = async (req, res) => {
  try {
    const { checkoutRequestID } = req.body;

    const accessToken             = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password:          password,
        Timestamp:         timestamp,
        CheckoutRequestID: checkoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);

  } catch (err) {
    console.error("STK Query Error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to query payment status" });
  }
};