import express from "express";
import Vendor from "../models/Vendor.js";

const router = express.Router();


// 🏪 Create Shop (Vendor registers shop)
router.post("/create", async (req, res) => {
  try {
    const { userId, shopName, location } = req.body;

    const vendor = new Vendor({
      user: userId,
      shopName,
      location,
    });

    await vendor.save();

    res.json({ msg: "Shop created, waiting for approval", vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🛠 Admin approves vendor
router.put("/approve/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    vendor.approved = true;
    await vendor.save();

    res.json({ msg: "Vendor approved", vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📄 Get all vendors (for admin)
router.get("/", async (req, res) => {
  const vendors = await Vendor.find().populate("user");
  res.json(vendors);
});

export default router;