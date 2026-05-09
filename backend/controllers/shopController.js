import Shop from "../models/Shop.js";

// Create shop
export const createShop = async (req, res) => {
  try {
    const existingShop = await Shop.findOne({ owner: req.user.id });

    if (existingShop) {
      return res.status(400).json({ message: "You already have a shop" });
    }

    const { name, location, contact } = req.body;

    const shop = await Shop.create({
      name,
      location,
      contact,
      owner: req.user.id,
    });

    res.status(201).json({
      message: "Shop created, waiting approval",
      shop,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my shop
export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve shop
export const approveShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    shop.status = "approved";
    await shop.save();

    res.json({ message: "Shop approved", shop });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};