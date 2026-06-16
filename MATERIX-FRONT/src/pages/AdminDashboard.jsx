import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, Users, Package, ShoppingCart, Settings, Bell,
  ChevronDown, Search, Plus, Eye, Pencil, Trash2, X, Globe,
  Shield, Mail, Clock, Lock, AlertTriangle, DollarSign,
  TrendingUp, TrendingDown, User, ExternalLink, Menu,
} from "lucide-react";
import "../styles/admin-dashboard.css";

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE = "http://127.0.0.1:8000";

const getProfileImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return path.startsWith("/") ? `${BASE}${path}` : `${BASE}/${path}`;
};

function authHeader() {
  // Login.jsx stores the token under the key "access"
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...opts.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

// ─── Status / role / cat helpers ─────────────────────────────────────────────

function orderStatusBadge(s) {
  const map = {
    "Delivered":   "adm-badge adm-badge-delivered",
    "In Progress": "adm-badge adm-badge-progress",
    "Pending":     "adm-badge adm-badge-pending",
    "Cancelled":   "adm-badge adm-badge-cancelled",
  };
  return map[s] ?? "adm-badge";
}

function productStatusBadge(s) {
  const map = {
    "In Stock":     "adm-badge adm-badge-instock",
    "Out of Stock": "adm-badge adm-badge-outstock",
    "Low Stock":    "adm-badge adm-badge-lowstock",
  };
  return map[s] ?? "adm-badge";
}

function roleBadge(r) {
  const map = {
    "Technician": "adm-badge adm-badge-tech",
    "Client":     "adm-badge adm-badge-client",
    "Staff":      "adm-badge adm-badge-staff",
    "Admin":      "adm-badge adm-badge-admin",
    "admin":      "adm-badge adm-badge-admin",
    "technician": "adm-badge adm-badge-tech",
    "client":     "adm-badge adm-badge-client",
    "staff":      "adm-badge adm-badge-staff",
  };
  return map[r] ?? "adm-badge adm-badge-client";
}

function catBadge(c) {
  const map = {
    "Tools":      "adm-badge adm-badge-tools",
    "Safety":     "adm-badge adm-badge-safety",
    "Materials":  "adm-badge adm-badge-materials",
    "Electrical": "adm-badge adm-badge-electrical",
  };
  return map[c] ?? "adm-badge";
}

function stockStatus(stock) {
  if (stock === 0) return "Out of Stock";
  if (stock < 10)  return "Low Stock";
  return "In Stock";
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`adm-toggle ${on ? "on" : "off"}`}
    >
      <span className="adm-toggle-thumb" />
    </button>
  );
}

function Modal({ open, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-box" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="adm-modal-header">
      <h2 className="adm-modal-title">{title}</h2>
      <button className="adm-modal-close" onClick={onClose}><X size={20} /></button>
    </div>
  );
}

function ModalFooter({ onCancel, submitLabel = "Save", loading = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
      <button type="button" className="adm-btn-secondary" onClick={onCancel}>Cancel</button>
      <button type="submit" className="adm-btn-primary" disabled={loading}>
        {loading ? <span className="adm-spinner" /> : submitLabel}
      </button>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="adm-field-label">{children}</label>;
}

function FieldInput({ label, ...props }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input {...props} className="adm-field-input" />
    </div>
  );
}

function FieldSelect({ label, children, ...props }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select {...props} className="adm-field-input" style={{ cursor: "pointer" }}>{children}</select>
    </div>
  );
}

function IconBtn({ onClick, icon, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`adm-icon-btn${danger ? " danger" : ""}`}
    >
      {icon}
    </button>
  );
}

function EmptyRow({ cols, msg = "No data found." }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: "2.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
        {msg}
      </td>
    </tr>
  );
}

function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: "2.5rem", textAlign: "center" }}>
        <span className="adm-spinner" />
      </td>
    </tr>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ setTab }) {
  const [stats, setStats]   = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/shop/admin/stats/")
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError("Could not load stats."); setLoading(false); });
  }, []);

  const statCards = stats ? [
    {
      label: "TOTAL REVENUE",
      value: `${Number(stats.total_revenue || 0).toLocaleString("fr-CM")} FCFA`,
      change: "+12.5%", up: true, Icon: DollarSign,
    },
    {
      label: "ACTIVE USERS",
      value: String(stats.active_users ?? "—"),
      change: "+3.2%", up: true, Icon: Users,
    },
    {
      label: "PENDING ORDERS",
      value: String(stats.pending_orders ?? "—"),
      change: "Critical", up: false, Icon: ShoppingCart,
    },
    {
      label: "PRODUCTS IN STOCK",
      value: String(stats.products_in_stock ?? "—"),
      change: "+8 new", up: true, Icon: Package,
    },
  ] : [];

  const recentOrders = stats?.recent_orders ?? [];

  return (
    <div className="adm-space-6">
      {/* Header */}
      <div>
        <h1 className="adm-section-title">Dashboard Overview</h1>
        <p className="adm-section-sub">Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="adm-stats-grid">
        {loading
          ? [0,1,2,3].map(i => (
              <div key={i} className="adm-stat-card" style={{ minHeight: 120 }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
                  <span className="adm-spinner" />
                </div>
              </div>
            ))
          : error
          ? <p style={{ color: "#ef4444", fontSize: "0.875rem", gridColumn: "span 2" }}>{error}</p>
          : statCards.map(({ label, value, change, up, Icon }) => (
              <div key={label} className="adm-stat-card">
                <div className="adm-stat-header">
                  <span className="adm-stat-label">{label}</span>
                  <div className="adm-stat-icon"><Icon size={18} /></div>
                </div>
                <div className="adm-stat-value">{value}</div>
                <div className={`adm-stat-change ${up ? "up" : "down"}`}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {change}
                </div>
              </div>
            ))
        }
      </div>

      {/* Recent orders */}
      <div className="adm-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Recent Orders</h2>
          <button className="adm-view-all" onClick={() => setTab("orders")}>
            View all <ExternalLink size={12} />
          </button>
        </div>
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 500 }}>
            <thead>
              <tr>
                {["Order ID", "Customer", "Total", "Status", "Date"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <LoadingRow cols={5} />
                : recentOrders.length === 0
                ? <EmptyRow cols={5} msg="No recent orders." />
                : recentOrders.map(o => (
                    <tr key={o.id}>
                      <td className="adm-td-mono">{o.id ?? o._id}</td>
                      <td style={{ color: "#1f2937" }}>{o.customer_username ?? o.customer_name ?? o.customer ?? "—"}</td>
                      <td style={{ color: "#1f2937" }}>{Number(o.total_price ?? o.total ?? 0).toFixed(2)} FCFA</td>
                      <td><span className={orderStatusBadge(o.status)}>{o.status}</span></td>
                      <td style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UserAvatar({ u, getInitials }) {
  const [imgErr, setImgErr] = useState(false);
  const src = getProfileImgUrl(u.profile_picture);
  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={u.username ?? u.name ?? ""}
        className="adm-user-avatar"
        style={{ objectFit: "cover" }}
        onError={() => setImgErr(true)}
      />
    );
  }
  return <div className="adm-user-avatar">{getInitials(u)}</div>;
}

function UsersTab() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "client", spec: "", address: "", cni: "", pw: "" });

  const fetchUsers = useCallback(() => {
    setLoading(true);
    apiFetch("/api/auth/admin/users/")
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => { setError("Failed to load users."); setLoading(false); });
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const nameMatch  = (u.username ?? u.name ?? "").toLowerCase().includes(q);
    const emailMatch = (u.email ?? "").toLowerCase().includes(q);
    const roleMatch  = roleFilter === "All Roles" || (u.role ?? "").toLowerCase() === roleFilter.toLowerCase();
    return (nameMatch || emailMatch) && roleMatch;
  });

  function getInitials(u) {
    const name = u.username ?? u.name ?? "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        username: form.name,
        email:    form.email,
        role:     form.role,
        password: form.pw,
        specialty:form.spec || "",
        address:  form.address || "",
        cni_number: form.cni || "",
      };
      await apiFetch("/api/auth/admin/users/", { method: "POST", body: JSON.stringify(body) });
      await fetchUsers();
      setOpen(false);
      setForm({ name: "", email: "", role: "client", spec: "", address: "", cni: "", pw: "" });
    } catch {
      alert("Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="adm-space-5">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-section-title">User Management</h1>
          <p className="adm-section-sub">Manage staff, technicians, and client accounts.</p>
        </div>
        <div className="adm-page-controls">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><Search size={14} /></span>
            <input
              className="adm-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
            />
          </div>
          <select
            className="adm-filter-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            {["All Roles", "admin", "staff", "technician", "client"].map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button className="adm-btn-primary" onClick={() => setOpen(true)}>
            <Plus size={14} /> New User
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}

      {/* Table */}
      <div className="adm-table-wrap">
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                {["ID", "User", "Role", "Specialty", "Status", "2FA", "Joined", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <LoadingRow cols={8} />
                : filtered.length === 0
                ? <EmptyRow cols={8} msg="No users found." />
                : filtered.map(u => {
                    const id = u.id ?? u._id ?? "—";
                    const name = u.username ?? u.name ?? "—";
                    const email = u.email ?? "—";
                    const role = u.role ?? "client";
                    const spec = u.specialty ?? "—";
                    const status = u.is_active ? "Active" : "Suspended";
                    const joined = u.date_joined
                      ? new Date(u.date_joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";
                    return (
                      <tr key={id}>
                        <td className="adm-td-mono">#{id}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <UserAvatar u={u} getInitials={getInitials} />
                            <div>
                              <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem", lineHeight: 1.3 }}>{name}</div>
                              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={roleBadge(role)}>{role}</span></td>
                        <td style={{ color: "#4b5563", fontSize: "0.875rem" }}>{spec}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", color: "#374151" }}>
                            <span className={`adm-status-dot ${status === "Active" ? "active" : "suspended"}`} />
                            {status}
                          </div>
                        </td>
                        <td>
                          <Toggle on={!!u.two_fa_enabled} onChange={() => {}} />
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{joined}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <IconBtn icon={<Eye size={13} />} />
                            <IconBtn icon={<Pencil size={13} />} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="Create New User" onClose={() => setOpen(false)} />
          <form onSubmit={submit} className="adm-space-4">
            <div className="adm-grid-2">
              <FieldInput label="Username"   required value={form.name}    onChange={set("name")}    />
              <FieldInput label="Email"      required type="email" value={form.email} onChange={set("email")} />
              <FieldSelect label="Role" value={form.role} onChange={set("role")}>
                {["client", "staff", "technician", "admin"].map(r => <option key={r}>{r}</option>)}
              </FieldSelect>
              <FieldInput label="Specialty"  value={form.spec}    onChange={set("spec")}    />
              <FieldInput label="Address"    value={form.address} onChange={set("address")} />
              <FieldInput label="CNI Number" value={form.cni}     onChange={set("cni")}     />
            </div>
            <FieldInput label="Password" required type="password" value={form.pw} onChange={set("pw")} />
            <ModalFooter onCancel={() => setOpen(false)} submitLabel="Create User" loading={saving} />
          </form>
        </div>
      </Modal>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({ name: "", category: "Tools", price: "", stock: "" });

  const fetchProducts = useCallback(() => {
    setLoading(true);
    apiFetch("/api/shop/products/")
      .then(data => { setProducts(Array.isArray(data) ? data : data.results ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const cats = ["All Categories", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = products.filter(p =>
    (p.name ?? "").toLowerCase().includes(search.toLowerCase()) &&
    (catFilter === "All Categories" || p.category === catFilter)
  );

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const stock = parseInt(form.stock) || 0;
      await apiFetch("/api/shop/admin/products/", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: parseFloat(form.price) || 0,
          stock,
          in_stock: stock > 0,
          rating: 0,
          likes: 0,
        }),
      });
      await fetchProducts();
      setOpen(false);
      setForm({ name: "", category: "Tools", price: "", stock: "" });
    } catch {
      alert("Failed to create product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await apiFetch(`/api/shop/admin/products/${id}/`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => (p.id ?? p._id) !== id));
    } catch {
      alert("Failed to delete.");
    }
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="adm-space-5">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-section-title">Product Inventory</h1>
          <p className="adm-section-sub">Manage hardware, tools, and materials.</p>
        </div>
        <div className="adm-page-controls">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><Search size={14} /></span>
            <input
              className="adm-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
            />
          </div>
          <select className="adm-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="adm-btn-primary" onClick={() => setOpen(true)}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 680 }}>
            <thead>
              <tr>
                {["ID", "Product", "Category", "Price", "Stock", "Status", "Actions"].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <LoadingRow cols={7} />
                : filtered.length === 0
                ? <EmptyRow cols={7} msg="No products found." />
                : filtered.map(p => {
                    const id  = p.id ?? p._id;
                    const st  = stockStatus(p.stock ?? (p.in_stock ? 10 : 0));
                    // Serializer returns "image" (SerializerMethodField), not "image_url"
                    const img = p.image ?? p.image_url;
                    return (
                      <tr key={id}>
                        <td className="adm-td-mono">{String(id).slice(0, 8)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {img
                              ? <img src={img} alt={p.name} className="adm-product-img" />
                              : <div className="adm-product-img-placeholder">IMG</div>
                            }
                            <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{p.name}</span>
                          </div>
                        </td>
                        <td><span className={catBadge(p.category)}>{p.category ?? "—"}</span></td>
                        <td style={{ color: "#1f2937", fontSize: "0.875rem" }}>{Number(p.price ?? 0).toFixed(0)} FCFA</td>
                        <td style={{ color: "#374151", fontSize: "0.875rem" }}>{p.stock ?? (p.in_stock ? "✓" : "0")}</td>
                        <td><span className={productStatusBadge(st)}>{st}</span></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <IconBtn icon={<Eye size={13} />} />
                            <IconBtn icon={<Pencil size={13} />} />
                            <IconBtn icon={<Trash2 size={13} />} danger onClick={() => deleteProduct(id)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="Add New Product" onClose={() => setOpen(false)} />
          <form onSubmit={submit} className="adm-space-4">
            <FieldInput label="Product Name" required value={form.name} onChange={set("name")} />
            <div className="adm-grid-2">
              <FieldSelect label="Category" value={form.category} onChange={set("category")}>
                {["Tools", "Safety", "Materials", "Electrical"].map(c => <option key={c}>{c}</option>)}
              </FieldSelect>
              <FieldInput label="Price (FCFA)" required type="number" min="0" step="0.01" value={form.price} onChange={set("price")} />
            </div>
            <FieldInput label="Stock Quantity" required type="number" min="0" value={form.stock} onChange={set("stock")} />
            <ModalFooter onCancel={() => setOpen(false)} submitLabel="Add Product" loading={saving} />
          </form>
        </div>
      </Modal>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [detail, setDetail]           = useState(null);
  const [openCreate, setOpenCreate]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm] = useState({ customer: "", email: "", agent: "", total: "", status: "Pending", pickup: "" });

  const fetchOrders = useCallback(() => {
    setLoading(true);
    apiFetch("/api/shop/admin/orders/")
      .then(data => { setOrders(Array.isArray(data) ? data : data.results ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const customer = String(o.customer_username ?? o.customer_name ?? o.customer ?? "").toLowerCase();
    const id = (o.id ?? o._id ?? "").toString().toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = customer.includes(q) || id.includes(q);
    const matchStatus = statusFilter === "All Statuses" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;
    try {
      await apiFetch(`/api/shop/admin/orders/${id}/`, { method: "DELETE" });
      setOrders(prev => prev.filter(o => (o.id ?? o._id) !== id));
    } catch {
      alert("Failed to delete order.");
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // POST new order — minimal fields
      await apiFetch("/api/shop/admin/orders/", {
        method: "POST",
        body: JSON.stringify({
          customer_name: form.customer,
          customer_email: form.email,
          assigned_agent_username: form.agent || null,
          total_price: parseFloat(form.total) || 0,
          status: form.status,
          pickup: form.pickup || "Warehouse A",
        }),
      });
      await fetchOrders();
      setOpenCreate(false);
      setForm({ customer: "", email: "", agent: "", total: "", status: "Pending", pickup: "" });
    } catch {
      // Even if API doesn't support direct order creation, degrade gracefully
      alert("Order creation not supported via API yet.");
    } finally {
      setSaving(false);
    }
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="adm-space-5">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-section-title">Order Management</h1>
          <p className="adm-section-sub">Track and manage customer orders.</p>
        </div>
        <div className="adm-page-controls">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><Search size={14} /></span>
            <input
              className="adm-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..."
            />
          </div>
          <select className="adm-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {["All Statuses", "Delivered", "In Progress", "Pending", "Cancelled"].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="adm-btn-primary" onClick={() => setOpenCreate(true)}>
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 740 }}>
            <thead>
              <tr>
                {["Order ID", "Customer", "Agent", "Total", "Status", "Date", "Actions"].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <LoadingRow cols={7} />
                : filtered.length === 0
                ? <EmptyRow cols={7} msg="No orders found." />
                : filtered.map(o => {
                    const id = o.id ?? o._id;
                    // OrderSerializer returns "customer_username" for the customer name
                    const customer = o.customer_username ?? o.customer_name ?? o.customer ?? "—";
                    const email = o.customer_email ?? o.email ?? "";
                    const agent = o.assigned_agent ?? o.assigned_agent_username ?? o.agent ?? "—";
                    const total = Number(o.total_price ?? o.total ?? 0).toFixed(2);
                    return (
                      <tr key={id}>
                        <td className="adm-td-mono">{String(id).slice(0, 10)}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{customer}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{email}</div>
                        </td>
                        <td style={{ fontSize: "0.875rem", color: "#4b5563" }}>{agent}</td>
                        <td style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{total} FCFA</td>
                        <td><span className={orderStatusBadge(o.status)}>{o.status}</span></td>
                        <td style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{formatDate(o.created_at)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <IconBtn icon={<Eye size={13} />} onClick={() => setDetail(o)} />
                            <IconBtn icon={<Pencil size={13} />} />
                            <IconBtn icon={<Trash2 size={13} />} danger onClick={() => deleteOrder(id)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div className="adm-modal-body">
            <ModalHeader title={`Order ${String(detail.id ?? detail._id).slice(0, 10)}`} onClose={() => setDetail(null)} />
            <div>
              {[
                ["Customer",    detail.customer_username ?? detail.customer_name ?? detail.customer ?? "—"],
                ["Email",       detail.customer_email ?? detail.email ?? "—"],
                ["Agent",       detail.assigned_agent_username ?? detail.agent ?? "—"],
                ["Status",      detail.status ?? "—"],
                ["Pickup",      detail.pickup ?? "—"],
                ["Transaction", detail.transaction_id ?? detail.txn ?? "—"],
                ["Total",       `${Number(detail.total_price ?? detail.total ?? 0).toFixed(2)} FCFA`],
              ].map(([k, v]) => (
                <div key={k} className="adm-detail-row">
                  <span className="adm-detail-key">{k}</span>
                  <span className="adm-detail-val">{v}</span>
                </div>
              ))}
            </div>
            {(detail.items ?? []).length > 0 && (
              <div style={{ marginTop: "1.25rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.075em", marginBottom: "0.75rem" }}>Items</p>
                <div className="adm-space-2">
                  {detail.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "#374151" }}>{item.name ?? item.product_name} × {item.qty ?? item.quantity ?? 1}</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{Number(item.price ?? item.subtotal ?? 0).toFixed(2)} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="New Order" onClose={() => setOpenCreate(false)} />
          <form onSubmit={submit} className="adm-space-4">
            <div className="adm-grid-2">
              <FieldInput label="Customer Name"  required value={form.customer} onChange={set("customer")} />
              <FieldInput label="Customer Email" type="email" value={form.email} onChange={set("email")} />
              <FieldInput label="Agent"          value={form.agent}   onChange={set("agent")} />
              <FieldInput label="Total (FCFA)"   required type="number" min="0" step="0.01" value={form.total} onChange={set("total")} />
              <FieldSelect label="Status" value={form.status} onChange={set("status")}>
                {["Pending", "In Progress", "Delivered", "Cancelled"].map(s => <option key={s}>{s}</option>)}
              </FieldSelect>
              <FieldInput label="Pickup Location" placeholder="Warehouse A" value={form.pickup} onChange={set("pickup")} />
            </div>
            <ModalFooter onCancel={() => setOpenCreate(false)} submitLabel="Create Order" loading={saving} />
          </form>
        </div>
      </Modal>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [site,    setSite]    = useState("MATERIX");
  const [email,   setEmail]   = useState("admin@materix.com");
  const [tz,      setTz]      = useState("UTC+0 (London)");
  const [twoFA,   setTwoFA]   = useState(false);
  const [host,    setHost]    = useState("smtp.gmail.com");
  const [port,    setPort]    = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [pass,    setPass]    = useState("");
  const [from,    setFrom]    = useState("");
  const [logAtts, setLogAtts] = useState(true);
  const [maxAtts, setMaxAtts] = useState("5");
  const [lockDur, setLockDur] = useState("15");
  const [saved,   setSaved]   = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  const si = "adm-field-input";

  return (
    <div className="adm-space-5" style={{ maxWidth: 768 }}>
      <div>
        <h1 className="adm-section-title">Settings</h1>
        <p className="adm-section-sub">Configure your admin dashboard preferences.</p>
      </div>

      {/* General */}
      <div className="adm-card" style={{ padding: "1.5rem" }}>
        <div className="adm-settings-icon-row">
          <Globe size={17} style={{ color: "#f59e0b" }} />
          <h2 className="adm-settings-card-title">General</h2>
        </div>
        <div className="adm-space-4">
          <div>
            <label className="adm-field-label">Site Name</label>
            <input value={site} onChange={e => setSite(e.target.value)} className={si} />
          </div>
          <div>
            <label className="adm-field-label">Admin Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={si} />
          </div>
          <div>
            <label className="adm-field-label">Timezone</label>
            <select value={tz} onChange={e => setTz(e.target.value)} className={si} style={{ cursor: "pointer" }}>
              {["UTC-8 (Los Angeles)", "UTC-5 (New York)", "UTC+0 (London)", "UTC+1 (Paris)", "UTC+3 (Moscow)", "UTC+8 (Singapore)", "UTC+9 (Tokyo)"].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Security & 2FA */}
      <div className="adm-card" style={{ padding: "1.5rem" }}>
        <div className="adm-settings-icon-row">
          <Shield size={17} style={{ color: "#f59e0b" }} />
          <h2 className="adm-settings-card-title">Security &amp; Two-Factor Authentication</h2>
        </div>

        {/* Global 2FA */}
        <div className="adm-2fa-banner" style={{ marginBottom: "1.5rem" }}>
          <div>
            <p className="adm-settings-card-sub">Enable 2FA for All Users</p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2, maxWidth: 360 }}>
              Require two-factor authentication system-wide. Every user receives a one-time code via email before gaining access.
            </p>
          </div>
          <Toggle on={twoFA} onChange={() => setTwoFA(v => !v)} />
        </div>

        {/* SMTP */}
        <div className="adm-space-4">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={14} style={{ color: "#9ca3af" }} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>SMTP Configuration (Gmail)</h3>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: -8 }}>
            Used to deliver OTP codes during 2FA login. Use a Gmail App Password — never your account password.
          </p>
          <div className="adm-grid-2-sm">
            <div>
              <label className="adm-field-label">SMTP Host</label>
              <input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com" className={si} />
            </div>
            <div>
              <label className="adm-field-label">SMTP Port</label>
              <input value={port} onChange={e => setPort(e.target.value)} placeholder="587" className={si} />
            </div>
            <div>
              <label className="adm-field-label">Gmail Address</label>
              <input type="email" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="yourapp@gmail.com" className={si} />
            </div>
            <div>
              <label className="adm-field-label">App Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••••••••••" className={si} />
            </div>
            <div className="adm-col-span-2">
              <label className="adm-field-label">From Address</label>
              <input value={from} onChange={e => setFrom(e.target.value)} placeholder="MATERIX Security <yourapp@gmail.com>" className={si} />
            </div>
          </div>
        </div>

        {/* Login Attempts */}
        <div className="adm-space-4" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={14} style={{ color: "#9ca3af" }} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Login Attempts &amp; Account Lockout</h3>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1f2937" }}>Log Failed Login Attempts</p>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>Record IP address, timestamp and user agent for every failed login.</p>
            </div>
            <Toggle on={logAtts} onChange={() => setLogAtts(v => !v)} />
          </div>
          <div className="adm-grid-2-sm">
            <div>
              <label className="adm-field-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={11} style={{ color: "#f59e0b" }} /> Max Failed Attempts Before Lock
              </label>
              <div style={{ position: "relative" }}>
                <input type="number" min="1" max="20" value={maxAtts} onChange={e => setMaxAtts(e.target.value)}
                  className={si} style={{ paddingRight: "5rem" }} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#9ca3af", pointerEvents: "none" }}>attempts</span>
              </div>
            </div>
            <div>
              <label className="adm-field-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} style={{ color: "#f59e0b" }} /> Lock Duration
              </label>
              <div style={{ position: "relative" }}>
                <input type="number" min="1" max="1440" value={lockDur} onChange={e => setLockDur(e.target.value)}
                  className={si} style={{ paddingRight: "5rem" }} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#9ca3af", pointerEvents: "none" }}>minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button onClick={save} className="adm-btn-save">Save Settings</button>
        {saved && <span className="adm-saved-toast">Settings saved successfully.</span>}
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview",  Icon: BarChart2    },
  { key: "users",    label: "Users",     Icon: Users        },
  { key: "products", label: "Products",  Icon: Package      },
  { key: "orders",   label: "Orders",    Icon: ShoppingCart },
  { key: "settings", label: "Settings",  Icon: Settings     },
];

export default function AdminDashboard() {
  const [tab, setTab]               = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get admin name from localStorage — Login.jsx stores as "username" key
  const adminName = localStorage.getItem("username") ?? "Admin";

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("profile_picture");
    window.location.href = "/login";
  }

  return (
    <div className="adm-scope">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="adm-navbar">
        <div className="adm-navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <span className="adm-logo">MATERIX</span>
            <nav>
              <ul className="adm-nav-links">
                {["Home", "Our Products", "Our Services", "About"].map(n => (
                  <li key={n}><a href="/">{n}</a></li>
                ))}
                <li><span className="adm-active">Dashboard</span></li>
              </ul>
            </nav>
          </div>

          <div className="adm-nav-right">
            <button className="adm-bell-btn">
              <Bell size={16} />
              <span className="adm-notif-dot">2</span>
            </button>
            <div className="adm-user-chip">
              <span>{adminName}</span>
              <div className="adm-avatar"><User size={13} /></div>
              <ChevronDown size={13} />
              <button className="adm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
            <button className="adm-mobile-menu-btn" onClick={() => setMobileOpen(v => !v)}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="adm-mobile-menu">
            {["Home", "Our Products", "Our Services", "About", "Dashboard"].map(n => (
              <a key={n} href="#">{n}</a>
            ))}
          </div>
        )}
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="adm-tabbar">
        <div className="adm-tabbar-inner">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`adm-tab-btn${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="adm-main">
        {tab === "overview"  && <OverviewTab setTab={setTab} />}
        {tab === "users"     && <UsersTab />}
        {tab === "products"  && <ProductsTab />}
        {tab === "orders"    && <OrdersTab />}
        {tab === "settings"  && <SettingsTab />}
      </main>
    </div>
  );
}
