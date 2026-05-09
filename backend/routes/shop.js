import express from "express";

const router = express.Router();

// GET ALL SHOPS
router.get("/", async (req, res) => {
  try {
    res.json({
      message: "All shops fetched successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;