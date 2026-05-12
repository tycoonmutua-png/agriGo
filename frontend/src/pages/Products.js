import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import "./Products.css";

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

// Build full image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image; // external URL
  return `http://localhost:5000${image}`;      // local upload
};

export default function Products() {
  const role               = getUserRole();
  const isAdmin            = role === "admin";
  const isStockSupervisor  = role === "stock_supervisor";
  const canManage          = isAdmin || isStockSupervisor;

  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart]                     = useState([]);
  const [showCart, setShowCart]             = useState(false);

  const [showModal, setShowModal]           = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState("");
  const [deleteConfirm, setDeleteConfirm]   = useState(null);

  // Image upload
  const [imageFile, setImageFile]           = useState(null);
  const [imagePreview, setImagePreview]     = useState("");
  const [uploading, setUploading]           = useState(false);
  const fileInputRef                        = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch {
      setError("Failed to load products. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  // ── Cart ──
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

  // ── Image selection ──
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Admin modal ──
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (product) => {
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
    setImageFile(null);
    setImagePreview(product.image ? getImageUrl(product.image) : "");
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      let imageUrl = form.image;

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await API.post("/products/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data.imageUrl;
        setUploading(false);
      }

      const productData = { ...form, image: imageUrl };

      if (editingId) {
        await API.put(`/products/${editingId}`, productData);
      } else {
        await API.post("/products", productData);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save product.");
      setUploading(false);
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

  return (
    <div className="products-page">

      {/* HEADER */}
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

      {/* SEARCH + FILTER */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button key={cat}
              className={`cat-tab ${activeCategory === cat ? "cat-tab--active" : ""}`}
              onClick={() => setActiveCategory(cat)}>
              {getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>
      </div>

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
              <div className="product-card" key={product._id}
                style={{ animationDelay: `${i * 0.05}s` }}>

                <div className="product-cat-badge">
                  {getCategoryEmoji(product.category)} {product.category || "General"}
                </div>

                {/* IMAGE */}
                <div className="product-icon-area">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="product-real-img"
                      onError={e => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
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

                {/* ACTIONS */}
                <div className="product-actions">
                  {canManage ? (
                    <>
                      <button className="btn-edit" onClick={() => openEdit(product)}>✏️ Edit</button>
                      <button className="btn-delete" onClick={() => setDeleteConfirm(product._id)}>🗑️ Delete</button>
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
                        <button className="btn-add-cart"
                          disabled={product.stock === 0}
                          onClick={() => addToCart(product)}>
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

      {/* CART SIDEBAR */}
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "✏️ Edit Product" : "➕ Add Product"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSave} className="modal-form">

              {/* IMAGE UPLOAD */}
              <div className="modal-field">
                <label>Product Image</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview"
                      style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px", opacity: 0.5 }}>
                      <div style={{ fontSize: "32px" }}>📸</div>
                      <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>Click to upload image</p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.75rem" }}>JPG, PNG, WEBP up to 5MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleImageSelect} />
                </div>
                {imagePreview && (
                  <button type="button" style={{ marginTop: "6px", fontSize: "0.8rem", opacity: 0.6, background: "none", border: "none", color: "#ff4d4d", cursor: "pointer" }}
                    onClick={() => { setImageFile(null); setImagePreview(""); setForm({ ...form, image: "" }); }}>
                    ✕ Remove image
                  </button>
                )}
              </div>

              <div className="modal-row-2">
                <div className="modal-field">
                  <label>Product Name *</label>
                  <input type="text" placeholder="e.g. Maize Seeds" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

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

              <div className="modal-field">
                <label>Unit</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {["kg","g","litre","piece","bag","box","crate","unit"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>

              <div className="modal-field">
                <label>Description</label>
                <textarea placeholder="Brief product description..." rows={3}
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving || uploading}>
                  {uploading ? "Uploading image..." : saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#f0fdf4", marginBottom: "12px" }}>Delete Product?</h2>
            <p style={{ color: "#6b9470", marginBottom: "24px" }}>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}