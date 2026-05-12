// seed.js — run with: node seed.js
// Place this file in your backend/ folder

require("dotenv").config();
const mongoose = require("mongoose");
const path     = require("path");
const fs       = require("fs");

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: String, required: true },
  price:       { type: Number, required: true },
  stock:       { type: Number, required: true, default: 0 },
  description: { type: String },
  image:       { type: String },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

// ── Copy images from frontend/public/images → backend/public/images ──
function copyImages() {
  const src  = path.join(__dirname, "../frontend/public/images");
  const dest = path.join(__dirname, "public/images");

  if (!fs.existsSync(src)) {
    console.log("⚠️  frontend/public/images not found — skipping image copy");
    return;
  }
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const files = fs.readdirSync(src);
  files.forEach(file => {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  });
  console.log(`📁 Copied ${files.length} images → backend/public/images`);
}

const products = [

  // ═══════════════════════════════════════════════
  // 🌱 SEEDS
  // ═══════════════════════════════════════════════
  {
    name: "Hybrid Maize Seeds",
    category: "Seeds",
    price: 5,
    stock: 200,
    description: "High-yield hybrid maize seeds suitable for all Kenyan highlands. Matures in 90 days.",
    image: "/images/hybrid maize seeds.jpeg"
  },
  {
    name: "Sukuma Wiki Seeds (Kale)",
    category: "Seeds",
    price: 2,
    stock: 500,
    description: "Indigenous kale seeds, fast-growing and highly nutritious. Ready to harvest in 30 days.",
    image: "/images/kale.jpeg"
  },
  {
    name: "Tomato Seeds (Cal-J)",
    category: "Seeds",
    price: 3,
    stock: 350,
    description: "California wonder tomato seeds. Disease resistant, high yield, ideal for greenhouses.",
    image: "/images/tomatoes.jpeg"
  },
  {
    name: "Watermelon Seeds",
    category: "Seeds",
    price: 4,
    stock: 180,
    description: "Sweet seedless watermelon variety. Thrives in warm lowland conditions.",
    image: "/images/watermelon.jpeg"
  },
  {
    name: "Onion Seeds (Red Creole)",
    category: "Seeds",
    price: 3,
    stock: 300,
    description: "Red creole onion seeds with high pungency and long shelf life.",
    image: "/images/Onions (1kg).jfif"
  },
  {
    name: "Spinach Seeds",
    category: "Seeds",
    price: 2,
    stock: 400,
    description: "Nutritious spinach seeds. High in iron, matures in 40 days.",
    image: "/images/spinach.jpeg"
  },
  {
    name: "Bean Seeds (Rosecoco)",
    category: "Seeds",
    price: 3,
    stock: 250,
    description: "Rosecoco climbing beans. High yield, ideal for mixed farming.",
    image: "/images/beans.jpeg"
  },
  {
    name: "Capsicum Seeds",
    category: "Seeds",
    price: 4,
    stock: 150,
    description: "Sweet bell pepper seeds. Excellent for greenhouse and open field production.",
    image: "/images/capsicum.jpeg"
  },

  // ═══════════════════════════════════════════════
  // 🧪 FERTILIZER
  // ═══════════════════════════════════════════════
  {
    name: "CAN Fertilizer (1kg)",
    category: "Fertilizer",
    price: 5,
    stock: 300,
    description: "Calcium Ammonium Nitrate — top dressing fertilizer for maize, vegetables and wheat.",
    image: "/images/CAN.jfif"
  },
  {
    name: "DAP Fertilizer (1kg)",
    category: "Fertilizer",
    price: 5,
    stock: 280,
    description: "Di-Ammonium Phosphate — basal application fertilizer ideal for planting season.",
    image: "/images/DAP.jfif"
  },
  {
    name: "NPK 17:17:17 (1kg)",
    category: "Fertilizer",
    price: 5,
    stock: 220,
    description: "Balanced NPK compound fertilizer suitable for all crops at all growth stages.",
    image: "/images/NPK.jfif"
  },
  {
    name: "Organic Compost (2kg)",
    category: "Fertilizer",
    price: 3,
    stock: 400,
    description: "100% organic compost manure. Improves soil structure and microbial activity.",
    image: "/images/Organic compost.jfif"
  },
  {
    name: "Foliar Fertilizer (500ml)",
    category: "Fertilizer",
    price: 4,
    stock: 200,
    description: "Liquid foliar feed rich in micronutrients. Spray on leaves for quick absorption.",
    image: "/images/Foliar.jfif"
  },
  {
    name: "Urea Fertilizer (1kg)",
    category: "Fertilizer",
    price: 4,
    stock: 260,
    description: "High-nitrogen urea fertilizer for top dressing. Boosts leafy growth rapidly.",
    image: "/images/Urea.jfif"
  },
  {
    name: "Humic Acid (250ml)",
    category: "Fertilizer",
    price: 3,
    stock: 150,
    description: "Soil conditioner that enhances nutrient uptake and root development.",
    image: "/images/humid acid.jfif"
  },
  {
    name: "Farmyard Manure (5kg)",
    category: "Fertilizer",
    price: 2,
    stock: 500,
    description: "Dried and processed farmyard manure. Safe, odourless, rich in organic matter.",
    image: "/images/Organic compost.jfif"
  },

  // ═══════════════════════════════════════════════
  // 🛡️ PESTICIDES
  // ═══════════════════════════════════════════════
  {
    name: "Dimethoate Insecticide (100ml)",
    category: "Pesticides",
    price: 4,
    stock: 180,
    description: "Broad-spectrum systemic insecticide for aphids, thrips and whiteflies.",
    image: "/images/Dimethoate Insecticide.jfif"
  },
  {
    name: "Mancozeb Fungicide (100g)",
    category: "Pesticides",
    price: 3,
    stock: 220,
    description: "Protective fungicide for blight, rust and downy mildew on vegetables.",
    image: "/images/Mancozeb Fungicide.jfif"
  },
  {
    name: "Cypermethrin (100ml)",
    category: "Pesticides",
    price: 4,
    stock: 200,
    description: "Contact and stomach insecticide. Effective against caterpillars and beetles.",
    image: "/images/Cypermethrin.jfif"
  },
  {
    name: "Roundup Herbicide (250ml)",
    category: "Pesticides",
    price: 5,
    stock: 160,
    description: "Non-selective systemic herbicide for clearing weeds before planting.",
    image: "/images/Roundup Herbicide.jfif"
  },
  {
    name: "Neem Oil Spray (500ml)",
    category: "Pesticides",
    price: 4,
    stock: 140,
    description: "Organic neem-based pesticide. Safe for bees, effective against mites and aphids.",
    image: "/images/Neem Oil Spray.jfif"
  },
  {
    name: "Copper Oxychloride (100g)",
    category: "Pesticides",
    price: 3,
    stock: 190,
    description: "Protective fungicide and bactericide. Ideal for tomatoes, potatoes and coffee.",
    image: "/images/Copper Oxychloride.jfif"
  },
  {
    name: "Snail & Slug Bait (200g)",
    category: "Pesticides",
    price: 2,
    stock: 120,
    description: "Effective molluscicide for controlling snails and slugs in vegetable gardens.",
    image: "/images/Snail & Slug Bait (200g).jfif"
  },
  {
    name: "Diazinon Soil Insecticide (100ml)",
    category: "Pesticides",
    price: 4,
    stock: 130,
    description: "Soil drench insecticide targeting cutworms, root maggots and soil pests.",
    image: "/images/Diazinon Soil Insecticide.jfif"
  },

  // ═══════════════════════════════════════════════
  // ⚙️ EQUIPMENT
  // ═══════════════════════════════════════════════
  {
    name: "Hand Sprayer (5L)",
    category: "Equipment",
    price: 5,
    stock: 80,
    description: "Durable 5-litre knapsack sprayer for pesticides and foliar fertilizers.",
    image: "/images/Hand Sprayer.jfif"
  },
  {
    name: "Garden Hoe (Jembe)",
    category: "Equipment",
    price: 4,
    stock: 100,
    description: "Heavy-duty forged steel jembe with hardwood handle. Essential for every farm.",
    image: "/images/Garden Hoe.jfif"
  },
  {
    name: "Pruning Shears",
    category: "Equipment",
    price: 3,
    stock: 120,
    description: "Sharp bypass pruning shears for trimming branches and harvesting fruit.",
    image: "/images/Pruning Shears.jfif"
  },
  {
    name: "Watering Can (10L)",
    category: "Equipment",
    price: 3,
    stock: 90,
    description: "10-litre plastic watering can with detachable rose head for gentle watering.",
    image: "/images/Watering Can.jfif"
  },
  {
    name: "Garden Fork",
    category: "Equipment",
    price: 4,
    stock: 70,
    description: "4-tine steel garden fork for breaking up compacted soil and aerating beds.",
    image: "/images/Garden Fork.jfif"
  },
  {
    name: "Seedling Trays (50-cell)",
    category: "Equipment",
    price: 2,
    stock: 300,
    description: "50-cell polystyrene seedling trays. Reusable, promotes uniform germination.",
    image: "/images/Seedling Trays.jfif"
  },
  {
    name: "Drip Irrigation Kit",
    category: "Equipment",
    price: 5,
    stock: 50,
    description: "Complete drip irrigation kit for 50 plants. Saves 60% water vs flood irrigation.",
    image: "/images/Hand Sprayer.jfif"
  },

  // ═══════════════════════════════════════════════
  // 🥬 PRODUCE
  // ═══════════════════════════════════════════════
  {
    name: "Fresh Tomatoes (1kg)",
    category: "Produce",
    price: 3,
    stock: 150,
    description: "Farm-fresh tomatoes harvested daily. Firm, red and full of flavour.",
    image: "/images/Fresh Tomatoes (1kg).jfif"
  },
  {
    name: "Sukuma Wiki / Kale (bunch)",
    category: "Produce",
    price: 1,
    stock: 300,
    description: "Fresh-cut kale, harvested this morning. Rich in vitamins A, C and K.",
    image: "/images/Sukuma Wiki.jfif"
  },
  {
    name: "Capsicum / Bell Pepper (500g)",
    category: "Produce",
    price: 4,
    stock: 100,
    description: "Mixed colour bell peppers. Crunchy, sweet and great for cooking or salads.",
    image: "/images/Capsicum.jfif"
  },
  {
    name: "Onions (1kg)",
    category: "Produce",
    price: 2,
    stock: 250,
    description: "Red onions with strong flavour and long shelf life. Essential kitchen staple.",
    image: "/images/Onions (1kg).jfif"
  },
  {
    name: "Spinach (bunch)",
    category: "Produce",
    price: 1,
    stock: 200,
    description: "Tender baby spinach. Perfect for salads, juicing and cooking.",
    image: "/images/Spinach (bunch).jfif"
  },
  {
    name: "Watermelon (whole)",
    category: "Produce",
    price: 5,
    stock: 60,
    description: "Sweet seedless watermelon. Refreshing and hydrating, perfect for the Kenyan heat.",
    image: "/images/Watermelon (whole).jfif"
  },

  // ═══════════════════════════════════════════════
  // 📦 FEEDS
  // ═══════════════════════════════════════════════
  {
    name: "Chick Mash (2kg)",
    category: "Feeds",
    price: 4,
    stock: 200,
    description: "Starter feed for chicks 0–8 weeks. High protein for rapid early growth.",
    image: "/images/chick mash.jfif"
  },
  {
    name: "Layers Mash (2kg)",
    category: "Feeds",
    price: 4,
    stock: 180,
    description: "Balanced layers mash for optimal egg production in hens 18+ weeks.",
    image: "/images/Layers Mash (2kg).jfif"
  },
  {
    name: "Broiler Finisher (2kg)",
    category: "Feeds",
    price: 5,
    stock: 160,
    description: "High-energy finisher feed for broilers 4–8 weeks. Maximises weight gain.",
    image: "/images/Broiler Finisher (2kg).jfif"
  },
  {
    name: "Dairy Meal (2kg)",
    category: "Feeds",
    price: 5,
    stock: 140,
    description: "Protein-rich dairy meal supplement for cows. Boosts milk production.",
    image: "/images/Dairy Meal (2kg).jfif"
  },
  {
    name: "Pig Grower Pellets (2kg)",
    category: "Feeds",
    price: 4,
    stock: 120,
    description: "Nutritionally complete grower pellets for pigs 10–60kg live weight.",
    image: "/images/Pig Grower Pellets (2kg).jfif"
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Copy images first
    copyImages();

    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    const inserted = await Product.insertMany(products);
    console.log(`🌱 Seeded ${inserted.length} products successfully!\n`);

    const categories = {};
    inserted.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    console.log("📊 Products by category:");
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });

    console.log("\n✨ Done! Restart backend and refresh the Products page.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();