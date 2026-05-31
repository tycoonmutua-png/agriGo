import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import "./Products.css";

// ── Cloudinary credentials ─────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME    = "dd1p7kcvz";
const CLOUDINARY_UPLOAD_PRESET = "agrigo_products";

function getUserRole() {
  const token = sessionStorage.getItem("token");
  if (!token) return "user";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "user";
  } catch { return "user"; }
}

const CATEGORIES = ["All", "Seeds", "Fertilizer", "Pesticides", "Equipment", "Produce", "Feeds"];
const EMPTY_FORM  = { name: "", price: "", stock: "", category: "Seeds", description: "", unit: "kg", image: "" };

const getCategoryEmoji = (cat) => ({
  Seeds: "🌱", Fertilizer: "🧪", Pesticides: "🛡️",
  Equipment: "⚙️", Produce: "🥬", Feeds: "📦", All: "🌾"
}[cat] || "📦");

const getStockStatus = (stock) => {
  if (stock === 0)  return { label: "Out of Stock", cls: "stock-out" };
  if (stock <= 10)  return { label: "Low Stock",    cls: "stock-low" };
  return { label: "In Stock", cls: "stock-ok" };
};

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `https://agrigo-backend-ibus.onrender.com${image}`;
};

export default function Products() {
  const role              = getUserRole();
  const isAdmin           = role === "admin";
  const isStockSupervisor = role === "stock_supervisor";
  const canManage         = isAdmin || isStockSupervisor;

  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart]                   = useState([]);
  const [showCart, setShowCart]           = useState(false);

  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [imagePreview, setImagePreview]   = useState("");
  const [uploading, setUploading]         = useState(false);
  const fileInputRef                      = useRef(null);

  // ── Smart modal positioning ───────────────────────────────────────
  // modalAnchorY: absolute page Y where the modal top should appear
  // newProductId: _id of newly added product so we scroll to it after save
  const [modalAnchorY, setModalAnchorY]   = useState(null);
  const [newProductId, setNewProductId]   = useState(null);
  const cardRefs                          = useRef({});   // { [_id]: DOM el }

  // ─────────────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/products");
      setProducts(res.data);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // After adding a product, scroll its card into view & flash it
  useEffect(() => {
    if (!newProductId) return;
    const el = cardRefs.current[newProductId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("product-card--highlight");
      setTimeout(() => el.classList.remove("product-card--highlight"), 1800);
    }
    setNewProductId(null);
  }, [products, newProductId]);

  // ─────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  // ── Cart ──────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i));
  };
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // ── Image upload ──────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setFormError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      fd.append("folder", "agrigo/products");
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (data.secure_url) {
        setForm(f => ({ ...f, image: data.secure_url }));
        setImagePreview(data.secure_url);
      } else {
        setFormError("Image upload failed. Try again.");
      }
    } catch {
      setFormError("Image upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setForm(f => ({ ...f, image: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Open ADD — modal appears at top of content area ───────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setFormError("");
    // Snap page to top first, then anchor modal just below the fixed bars
    window.scrollTo({ top: 0, behavior: "smooth" });
    setModalAnchorY(180);   // below header(68) + toolbar(~107) + small gap
    setShowModal(true);
  };

  // ── Open EDIT — modal anchored near the clicked card ─────────────
  const openEdit = (product, cardEl) => {
    setEditingId(product._id);
    setForm({
      name:        product.name,
      price:       product.price,
      stock:       product.stock,
      category:    product.category || "Seeds",
      description: product.description || "",
      unit:        product.unit || "kg",
      image:       product.image || "",
    });
    setImagePreview(product.image ? getImageUrl(product.image) : "");
    setFormError("");

    if (cardEl) {
      const rect  = cardEl.getBoundingClientRect();
      // absolute Y on the page (accounts for current scroll)
      const pageY = rect.top + window.scrollY;
      // Place modal 20px above the card; clamp so it never hides behind the fixed bars
      const anchorY = Math.max(180, pageY - 20);
      setModalAnchorY(anchorY);
    } else {
      setModalAnchorY(window.scrollY + 100);
    }

    setShowModal(true);
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (uploading) return setFormError("Please wait for image to finish uploading.");
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, form);
        setShowModal(false);
        fetchProducts();
      } else {
        const res     = await API.post("/api/products", form);
        const created = res.data;           // expects { _id, ... }
        setShowModal(false);
        await fetchProducts();              // re-fetch full list
        if (created?._id) setNewProductId(created._id);   // triggers scroll+flash
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      alert("Failed to delete product.");
    }
  };

  // ── Build inline style for anchored modal ─────────────────────────
  // The overlay is position:fixed, but the modal inside it is
  // position:absolute so we can place it anywhere on the page.
  const modalStyle = modalAnchorY !== null
    ? { position: "absolute", top: `${modalAnchorY}px`, left: "50%", transform: "translateX(-50%)" }
    : {};

  return (
    <div className="products-page">

      {/* ── HEADER (fixed) ── */}
      <div className="products-header">
        <div>
          <h1 className="products-title">
            {canManage ? "⚙️ Manage Products" : "AgriGo Marketplace"}
          </h1>
          <p className="products-subtitle">
            {canManage
              ? "Add, edit and manage your agro-product inventory"
              : "Quality farm inputs and fresh produce — delivered to your door"}
          </p>
        </div>
        <div className="products-header-actions">
          {canManage && (
            <button className="btn-add-product" onClick={openAdd}>+ Add Product</button>
          )}
          {!canManage && (
            <button className="btn-cart" onClick={() => setShowCart(true)}>
              🛒 Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH + FILTER (fixed below header) ── */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${activeCategory === cat ? "cat-tab--active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      {loading && (
        <div className="products-state">
          <div className="state-spinner" />
          <p>Loading products...</p>
        </div>
      )}

      {error && <div className="products-error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="products-state">
          <p style={{ fontSize: "48px" }}>🌾</p>
          <p>No products found.</p>
          {canManage && (
            <button className="btn-add-product" onClick={openAdd}>Add your first product</button>
          )}
        </div>
      )}

      {/* PRODUCT GRID */}
      {!loading && !error && filtered.length > 0 && (
        <div className="products-grid">
          {filtered.map((product, i) => {
            const stock    = getStockStatus(product.stock);
            const cartItem = cart.find(c => c._id === product._id);
            const imgUrl   = getImageUrl(product.image);

            return (
              <div
                className="product-card"
                key={product._id}
                style={{ animationDelay: `${i * 0.05}s` }}
                ref={el => { cardRefs.current[product._id] = el; }}
              >
                <div className="product-cat-badge">
                  {getCategoryEmoji(product.category)} {product.category || "General"}
                </div>

                <div className="product-icon-area">
                  {imgUrl ? (
                    <img src={imgUrl} alt={product.name} className="product-real-img"
                      onError={e => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }} />
                  ) : null}
                  <span className="product-big-icon"
                    style={{ display: imgUrl ? "none" : "flex" }}>
                    {getCategoryEmoji(product.category)}
                  </span>
                </div>

                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  {product.description && (
                    <p className="product-desc">{product.description}</p>
                  )}
                  <div className="product-meta">
                    <span className="product-price">
                      KES {Number(product.price).toLocaleString()}
                      <span className="product-unit"> / {product.unit || "unit"}</span>
                    </span>
                    <span className={`stock-badge ${stock.cls}`}>{stock.label}</span>
                  </div>
                  <div className="product-stock-bar-wrap">
                    <div className="product-stock-bar"
                      style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }} />
                  </div>
                  <p className="product-stock-text">{product.stock} units remaining</p>
                </div>

                <div className="product-actions">
                  {canManage ? (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => openEdit(product, cardRefs.current[product._id])}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteConfirm(product._id)}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : (
                    <>
                      {cartItem ? (
                        <div className="qty-control">
                          <button onClick={() => updateQty(product._id, cartItem.qty - 1)}>−</button>
                          <span>{cartItem.qty}</span>
                          <button onClick={() => updateQty(product._id, cartItem.qty + 1)}>+</button>
                        </div>
                      ) : (
                        <button
                          className="btn-add-cart"
                          disabled={product.stock === 0}
                          onClick={() => addToCart(product)}
                        >
                          {product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CART SIDEBAR ── */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>🛒 Your Cart</h2>
              <button className="cart-close" onClick={() => setShowCart(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <p style={{ fontSize: "48px" }}>🧺</p>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-icon">
                        {getImageUrl(item.image) ? (
                          <img src={getImageUrl(item.image)} alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                            onError={e => { e.target.style.display = "none"; }} />
                        ) : getCategoryEmoji(item.category)}
                      </div>
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">KES {Number(item.price).toLocaleString()} × {item.qty}</p>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item._id)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span>KES {cartTotal.toLocaleString()}</span>
                  </div>
                  <button className="btn-checkout" onClick={() => {
                    setShowCart(false);
                    sessionStorage.setItem("cart", JSON.stringify(cart));
                    window.location.href = "/checkout";
                  }}>
                    Proceed to Checkout →
                  </button>
                  <button className="btn-clear-cart" onClick={() => setCart([])}>Clear cart</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL — anchored near the triggering card ── */}
      {showModal && (
        <div className="modal-overlay modal-overlay--anchored" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            style={modalStyle}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingId ? "✏️ Edit Product" : "➕ Add Product"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="auth-error">{formError}</div>}

            <form onSubmit={handleSave} className="modal-form">

              {/* IMAGE */}
              <div className="modal-field">
                <label>Product Image</label>
                <input ref={fileInputRef} type="file" accept="image/*"
                  style={{ display: "none" }} onChange={handleImageUpload} />
                {imagePreview ? (
                  <div className="img-preview-wrap">
                    <img src={imagePreview} alt="preview" className="img-preview"
                      onError={e => { e.target.style.display = "none"; }} />
                    {uploading && (
                      <div className="img-uploading-overlay">
                        <div className="state-spinner" />
                        <span>Uploading…</span>
                      </div>
                    )}
                    <div className="img-preview-actions">
                      <button type="button" className="btn-change-img"
                        onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        🔄 Change
                      </button>
                      <button type="button" className="btn-remove-img"
                        onClick={clearImage} disabled={uploading}>
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="img-upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <span style={{ fontSize: 36 }}>📷</span>
                    <p>Click to upload image</p>
                    <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>JPG, PNG, WEBP — uploads to Cloudinary</p>
                  </div>
                )}
              </div>

              {/* NAME + CATEGORY */}
              <div className="modal-row-2">
                <div className="modal-field">
                  <label>Product Name *</label>
                  <input type="text" placeholder="e.g. Maize Seeds" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label>Category *</label>
                  <select value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* PRICE + STOCK */}
              <div className="modal-row-2">
                <div className="modal-field">
                  <label>Price (KES) *</label>
                  <input type="number" placeholder="0" min="0" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label>Stock (units) *</label>
                  <input type="number" placeholder="0" min="0" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} required />
                </div>
              </div>

              {/* UNIT */}
              <div className="modal-field">
                <label>Unit</label>
                <select value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {["kg","g","litre","piece","bag","box","crate","unit"].map(u =>
                    <option key={u}>{u}</option>
                  )}
                </select>
              </div>

              {/* DESCRIPTION */}
              <div className="modal-field">
                <label>Description</label>
                <textarea placeholder="Brief product description..." rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving || uploading}>
                  {uploading ? "Uploading image…" : saving ? "Saving…" : editingId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#f0fdf4", marginBottom: "12px" }}>Delete Product?</h2>
            <p style={{ color: "#6b9470", marginBottom: "24px" }}>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-confirm"
                onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}