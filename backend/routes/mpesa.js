const express    = require("express");
const router     = express.Router();
const mpesa      = require("../controllers/mpesaController");
const { protect } = require("../middleware/authMiddleware");

// STK Push — protected (must be logged in)
router.post("/stk-push", protect, mpesa.stkPush);

// Query payment status
router.post("/query", protect, mpesa.stkQuery);

// Callback — public (Safaricom calls this, no auth)
router.post("/callback", mpesa.mpesaCallback);

module.exports = router;