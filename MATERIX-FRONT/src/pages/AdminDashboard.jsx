import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, Users, Package, ShoppingCart, Settings, Bell,
  ChevronDown, Search, Plus, Eye, EyeOff, Pencil, Trash2, X, Globe,
  Shield, Mail, Clock, Lock, AlertTriangle, DollarSign,
  TrendingUp, TrendingDown, User, ExternalLink, Menu,
  CheckCircle, XCircle, FileText, MapPin, Phone, Briefcase,
  Calendar, Star, ChevronRight, Filter, Download, Reply, Archive,
} from "lucide-react";
import "../styles/admin-dashboard.css";
import { useNavigate } from "react-router-dom";

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
  const headers = { ...authHeader(), ...opts.headers };
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    headers,
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

function FieldInput({ label, type, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={inputType}
          {...props}
          className="adm-field-input"
          style={{ paddingRight: isPassword ? "2.5rem" : undefined }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute",
              right: "0.75rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              color: "#6b7280",
            }}
            title={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function FieldFileInput({ label, accept, onChange, selectedFile, onClear, ...props }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      {selectedFile ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.45rem 0.75rem",
          backgroundColor: "#f3f4f6",
          border: "1px dashed #d1d5db",
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
          color: "#374151"
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "4px",
            }}
            title="Remove file"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="adm-field-input"
          style={{ padding: "0.45rem 0.75rem" }}
          {...props}
        />
      )}
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

function UserAvatar({ u, getInitials, size, fontSize }) {
  const [imgErr, setImgErr] = useState(false);
  const src = getProfileImgUrl(u.profile_picture);
  const customStyle = size ? { width: size, height: size, fontSize: fontSize, objectFit: "cover" } : { objectFit: "cover" };
  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={u.username ?? u.name ?? ""}
        className="adm-user-avatar"
        style={customStyle}
        onError={() => setImgErr(true)}
      />
    );
  }
  return <div className="adm-user-avatar" style={customStyle}>{getInitials(u)}</div>;
}

function UsersTab() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [open, setOpen]           = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "client",
    spec: "",
    address: "",
    cni: "",
    pw: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "client",
    spec: "",
    address: "",
    cni: "",
    pw: "",
    image: "",
  });

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
      const formData = new FormData();
      formData.append("username", form.name);
      formData.append("email", form.email);
      formData.append("role", form.role);
      formData.append("password", form.pw);
      formData.append("specialty", form.spec || "");
      formData.append("address", form.address || "");
      formData.append("cni_number", form.cni || "");
      if (imageFile) {
        formData.append("profile_picture", imageFile);
      }

      await apiFetch("/api/auth/admin/users/", { 
        method: "POST", 
        body: formData 
      });
      await fetchUsers();
      setOpen(false);
      setForm({ name: "", email: "", role: "client", spec: "", address: "", cni: "", pw: "" });
      setImageFile(null);
    } catch {
      alert("Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", editForm.name);
      formData.append("email", editForm.email);
      formData.append("role", editForm.role);
      formData.append("specialty", editForm.spec || "");
      formData.append("address", editForm.address || "");
      formData.append("cni_number", editForm.cni || "");
      if (editForm.pw) {
        formData.append("password", editForm.pw);
      }

      if (editImageFile) {
        formData.append("profile_picture", editImageFile);
      } else if (!editForm.image) {
        formData.append("profile_picture", "");
      }

      await apiFetch(`/api/auth/admin/users/${editForm.id}/`, {
        method: "PATCH",
        body: formData
      });
      await fetchUsers();
      setEditOpen(false);
      setEditImageFile(null);
    } catch {
      alert("Failed to update user.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u) {
    setEditForm({
      id: u.id ?? u._id,
      name: u.username ?? u.name ?? "",
      email: u.email ?? "",
      role: u.role ?? "client",
      spec: u.specialty ?? "",
      address: u.address ?? "",
      cni: u.cni_number ?? "",
      pw: "",
      image: u.profile_picture ?? "",
    });
    setEditImageFile(null);
    setEditOpen(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    setSaving(true);
    try {
      const id = userToDelete.id ?? userToDelete._id;
      await apiFetch(`/api/auth/admin/users/${id}/`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => (u.id ?? u._id) !== id));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      alert("Failed to delete user.");
    } finally {
      setSaving(false);
    }
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));
  const setEdit = key => e => setEditForm(p => ({ ...p, [key]: e.target.value }));

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
                            <IconBtn 
                              icon={<Eye size={13} />} 
                              onClick={() => {
                                setActiveUser(u);
                                setDetailOpen(true);
                              }} 
                            />
                            <IconBtn 
                              icon={<Pencil size={13} />} 
                              onClick={() => startEdit(u)} 
                            />
                            <IconBtn 
                              icon={<Trash2 size={13} />} 
                              danger 
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteConfirmOpen(true);
                              }} 
                            />
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
      {/* Create user modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="Create New User" onClose={() => setOpen(false)} />
          <form onSubmit={submit} className="adm-space-4">
            <div className="adm-grid-2">
              <FieldInput label="Username" required value={form.name} onChange={set("name")} />
              <FieldInput label="Email" required type="email" value={form.email} onChange={set("email")} />
              <FieldSelect label="Role" value={form.role} onChange={set("role")}>
                {["client", "technician", "delivery", "admin"].map(r => <option key={r}>{r}</option>)}
              </FieldSelect>
              <FieldInput label="Address" required value={form.address} onChange={set("address")} />
              
              {form.role === "technician" && (
                <>
                  <FieldInput label="Specialty" required value={form.spec} onChange={set("spec")} />
                  <FieldInput label="CNI Number" required value={form.cni} onChange={set("cni")} />
                </>
              )}
            </div>
            
            <FieldFileInput
              label="Profile Picture"
              accept="image/*"
              selectedFile={imageFile}
              onClear={() => setImageFile(null)}
              onChange={(e) => setImageFile(e.target.files[0] || null)}
            />
            
            <FieldInput label="Password" required type="password" value={form.pw} onChange={set("pw")} />
            
            <ModalFooter onCancel={() => setOpen(false)} submitLabel="Create User" loading={saving} />
          </form>
        </div>
      </Modal>

      {/* Edit user modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="Edit User" onClose={() => setEditOpen(false)} />
          <form onSubmit={submitEdit} className="adm-space-4">
            <div className="adm-grid-2">
              <FieldInput label="Username" required value={editForm.name} onChange={setEdit("name")} />
              <FieldInput label="Email" required type="email" value={editForm.email} onChange={setEdit("email")} />
              <FieldSelect label="Role" value={editForm.role} onChange={setEdit("role")}>
                {["client", "technician", "delivery", "admin"].map(r => <option key={r}>{r}</option>)}
              </FieldSelect>
              <FieldInput label="Address" required value={editForm.address} onChange={setEdit("address")} />
              
              {editForm.role === "technician" && (
                <>
                  <FieldInput label="Specialty" required value={editForm.spec} onChange={setEdit("spec")} />
                  <FieldInput label="CNI Number" required value={editForm.cni} onChange={setEdit("cni")} />
                </>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <FieldFileInput
                label="Change Profile Picture"
                accept="image/*"
                selectedFile={editImageFile}
                onClear={() => setEditImageFile(null)}
                onChange={(e) => setEditImageFile(e.target.files[0] || null)}
              />
              {editForm.image && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#6b7280", padding: "4px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>Current image: {editForm.image.split("/").pop()}</span>
                  <button
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, image: "" }))}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px"
                    }}
                    title="Remove current image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <FieldInput label="Change Password (leave blank to keep current)" type="password" value={editForm.pw} onChange={setEdit("pw")} />
            
            <ModalFooter onCancel={() => setEditOpen(false)} submitLabel="Save Changes" loading={saving} />
          </form>
        </div>
      </Modal>

      {/* User details modal */}
      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setActiveUser(null); }}>
        {activeUser && (
          <div className="adm-modal-body">
            <ModalHeader title="User Profile Details" onClose={() => { setDetailOpen(false); setActiveUser(null); }} />
            <div className="adm-space-4">
              
              {/* User Avatar Section */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "1rem 0"
              }}>
                <div style={{ width: "84px", height: "84px" }}>
                  <UserAvatar u={activeUser} getInitials={getInitials} size="84px" fontSize="1.75rem" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    {activeUser.username ?? activeUser.name}
                  </h3>
                  <span className={roleBadge(activeUser.role ?? "client")} style={{ display: "inline-block", marginTop: "4px" }}>
                    {activeUser.role}
                  </span>
                </div>
              </div>

              {/* User Profile Fields Grid */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                backgroundColor: "#f3f4f6",
                borderRadius: "0.5rem",
                overflow: "hidden",
                border: "1px solid #e5e7eb"
              }}>
                {[
                  ["User ID", activeUser.id ?? activeUser._id ?? "—"],
                  ["Email Address", activeUser.email ?? "—"],
                  ["Specialty", activeUser.specialty ?? "—"],
                  ["Address", activeUser.address ?? "—"],
                  ["CNI Number", activeUser.cni_number ?? "—"],
                  ["Account Status", activeUser.is_active ? "Active" : "Suspended"],
                  ["Date Joined", activeUser.date_joined ? new Date(activeUser.date_joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"]
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    backgroundColor: "#fff"
                  }}>
                    <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{k}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#111827", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setUserToDelete(null); }}>
        <div className="adm-modal-body">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444"
            }}>
              <AlertTriangle size={24} />
            </div>
            
            <div className="adm-space-2">
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Delete User
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, padding: "0 10px" }}>
                Are you sure you want to delete <strong>{userToDelete?.username ?? userToDelete?.name}</strong>? This will permanently delete this account.
              </p>
            </div>

            <div style={{ display: "flex", width: "100%", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                className="adm-btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => { setDeleteConfirmOpen(false); setUserToDelete(null); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="adm-btn-primary" 
                style={{ flex: 1, backgroundColor: "#ef4444" }} 
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? <span className="adm-spinner" /> : "Delete"}
              </button>
            </div>
          </div>
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
  const [editOpen, setEditOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [objFile, setObjFile]     = useState(null);
  const [mtlFile, setMtlFile]     = useState(null);

  const [editImageFile, setEditImageFile] = useState(null);
  const [editObjFile, setEditObjFile]     = useState(null);
  const [editMtlFile, setEditMtlFile]     = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "Tools",
    price: "",
    stock: "",
    image: "",
    three_d_path: "",
    mtl_file: "",
    discount: "0",
    description: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    category: "Tools",
    price: "",
    stock: "",
    image: "",
    three_d_path: "",
    mtl_file: "",
    discount: "0",
    description: "",
  });

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
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("price", parseFloat(form.price) || 0);
      formData.append("stock", stock);
      formData.append("in_stock", stock > 0);
      formData.append("discount", parseInt(form.discount) || 0);
      formData.append("description", form.description || "");
      formData.append("rating", 0);
      formData.append("likes", 0);

      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (objFile) {
        formData.append("three_d_path", objFile);
      }
      if (mtlFile) {
        formData.append("mtl_file", mtlFile);
      }

      await apiFetch("/api/shop/admin/products/", {
        method: "POST",
        body: formData,
      });
      await fetchProducts();
      setOpen(false);
      setForm({
        name: "",
        category: "Tools",
        price: "",
        stock: "",
        image: "",
        three_d_path: "",
        mtl_file: "",
        discount: "0",
        description: "",
      });
      setImageFile(null);
      setObjFile(null);
      setMtlFile(null);
    } catch {
      alert("Failed to create product.");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const stock = parseInt(editForm.stock) || 0;
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("category", editForm.category);
      formData.append("price", parseFloat(editForm.price) || 0);
      formData.append("stock", stock);
      formData.append("in_stock", stock > 0);
      formData.append("discount", parseInt(editForm.discount) || 0);
      formData.append("description", editForm.description || "");

      if (editImageFile) {
        formData.append("image", editImageFile);
      } else if (!editForm.image) {
        formData.append("image", "");
      }

      if (editObjFile) {
        formData.append("three_d_path", editObjFile);
      } else if (!editForm.three_d_path) {
        formData.append("three_d_path", "");
      }

      if (editMtlFile) {
        formData.append("mtl_file", editMtlFile);
      } else if (!editForm.mtl_file) {
        formData.append("mtl_file", "");
      }

      await apiFetch(`/api/shop/admin/products/${editForm.id}/`, {
        method: "PATCH",
        body: formData,
      });
      await fetchProducts();
      setEditOpen(false);
      setEditImageFile(null);
      setEditObjFile(null);
      setEditMtlFile(null);
    } catch {
      alert("Failed to update product.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p) {
    setEditForm({
      id: p.id ?? p._id,
      name: p.name ?? "",
      category: p.category ?? "Tools",
      price: p.price ?? "",
      stock: p.stock ?? "",
      image: p.image ?? p.image_url ?? "",
      three_d_path: p.three_d_path ?? "",
      mtl_file: p.mtl_file ?? "",
      discount: p.discount ?? "0",
      description: p.description ?? "",
    });
    setEditImageFile(null);
    setEditObjFile(null);
    setEditMtlFile(null);
    setEditOpen(true);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setSaving(true);
    try {
      const id = productToDelete.id ?? productToDelete._id;
      await apiFetch(`/api/shop/admin/products/${id}/`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => (p.id ?? p._id) !== id));
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch {
      alert("Failed to delete product.");
    } finally {
      setSaving(false);
    }
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));
  const setEdit = key => e => setEditForm(p => ({ ...p, [key]: e.target.value }));

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
                            <IconBtn 
                              icon={<Eye size={13} />} 
                              onClick={() => {
                                setActiveProduct(p);
                                setDetailOpen(true);
                              }} 
                            />
                            <IconBtn 
                              icon={<Pencil size={13} />} 
                              onClick={() => startEdit(p)} 
                            />
                            <IconBtn 
                              icon={<Trash2 size={13} />} 
                              danger 
                              onClick={() => {
                                setProductToDelete(p);
                                setDeleteConfirmOpen(true);
                              }} 
                            />
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

      {/* Add product modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="Add New Product" onClose={() => setOpen(false)} />
          <form onSubmit={submit} className="adm-space-4">
            <FieldInput label="Product Name" required value={form.name} onChange={set("name")} />
            
            <div className="adm-grid-2">
              <FieldSelect label="Category" value={form.category} onChange={set("category")}>
                {["Tools", "Safety", "Materials", "Hardware"].map(c => <option key={c}>{c}</option>)}
              </FieldSelect>
              <FieldInput label="Price (FCFA)" required type="number" min="0" step="0.01" value={form.price} onChange={set("price")} />
            </div>

            <div className="adm-grid-2">
              <FieldInput label="Stock Quantity" required type="number" min="0" value={form.stock} onChange={set("stock")} />
              <FieldInput label="Discount (%)" type="number" min="0" max="100" value={form.discount} onChange={set("discount")} />
            </div>

            <FieldFileInput
              label="Product Image File"
              accept="image/*"
              selectedFile={imageFile}
              onClear={() => setImageFile(null)}
              onChange={(e) => setImageFile(e.target.files[0] || null)}
            />
            
            <div className="adm-grid-2">
              <FieldFileInput
                label="3D OBJ File (.obj)"
                accept=".obj"
                selectedFile={objFile}
                onClear={() => setObjFile(null)}
                onChange={(e) => setObjFile(e.target.files[0] || null)}
              />
              <FieldFileInput
                label="3D MTL File (.mtl)"
                accept=".mtl"
                selectedFile={mtlFile}
                onClear={() => setMtlFile(null)}
                onChange={(e) => setMtlFile(e.target.files[0] || null)}
              />
            </div>

            <div>
              <label className="adm-field-label">Description</label>
              <textarea 
                className="adm-field-input" 
                rows="3" 
                value={form.description} 
                onChange={set("description")}
                style={{ resize: "vertical" }}
              />
            </div>

            <ModalFooter onCancel={() => setOpen(false)} submitLabel="Add Product" loading={saving} />
          </form>
        </div>
      </Modal>

      {/* Edit product modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="adm-modal-body">
          <ModalHeader title="Edit Product" onClose={() => setEditOpen(false)} />
          <form onSubmit={submitEdit} className="adm-space-4">
            <FieldInput label="Product Name" required value={editForm.name} onChange={setEdit("name")} />
            
            <div className="adm-grid-2">
              <FieldSelect label="Category" value={editForm.category} onChange={setEdit("category")}>
                {["Tools", "Safety", "Materials", "Hardware"].map(c => <option key={c}>{c}</option>)}
              </FieldSelect>
              <FieldInput label="Price (FCFA)" required type="number" min="0" step="0.01" value={editForm.price} onChange={setEdit("price")} />
            </div>

            <div className="adm-grid-2">
              <FieldInput label="Stock Quantity" required type="number" min="0" value={editForm.stock} onChange={setEdit("stock")} />
              <FieldInput label="Discount (%)" type="number" min="0" max="100" value={editForm.discount} onChange={setEdit("discount")} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <FieldFileInput
                label="Change Product Image File"
                accept="image/*"
                selectedFile={editImageFile}
                onClear={() => setEditImageFile(null)}
                onChange={(e) => setEditImageFile(e.target.files[0] || null)}
              />
              {editForm.image && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#6b7280", padding: "4px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>Current image: {editForm.image.split("/").pop()}</span>
                  <button
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, image: "" }))}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px"
                    }}
                    title="Remove current image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="adm-grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <FieldFileInput
                  label="Change 3D OBJ File (.obj)"
                  accept=".obj"
                  selectedFile={editObjFile}
                  onClear={() => setEditObjFile(null)}
                  onChange={(e) => setEditObjFile(e.target.files[0] || null)}
                />
                {editForm.three_d_path && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#6b7280", padding: "4px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>Current OBJ: {editForm.three_d_path.split("/").pop()}</span>
                    <button
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, three_d_path: "" }))}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px"
                      }}
                      title="Remove current OBJ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <FieldFileInput
                  label="Change 3D MTL File (.mtl)"
                  accept=".mtl"
                  selectedFile={editMtlFile}
                  onClear={() => setEditMtlFile(null)}
                  onChange={(e) => setEditMtlFile(e.target.files[0] || null)}
                />
                {editForm.mtl_file && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#6b7280", padding: "4px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>Current MTL: {editForm.mtl_file.split("/").pop()}</span>
                    <button
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, mtl_file: "" }))}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px"
                      }}
                      title="Remove current MTL"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="adm-field-label">Description</label>
              <textarea 
                className="adm-field-input" 
                rows="3" 
                value={editForm.description} 
                onChange={setEdit("description")}
                style={{ resize: "vertical" }}
              />
            </div>

            <ModalFooter onCancel={() => setEditOpen(false)} submitLabel="Save Changes" loading={saving} />
          </form>
        </div>
      </Modal>

      {/* Product details modal */}
      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setActiveProduct(null); }}>
        {activeProduct && (
          <div className="adm-modal-body">
            <ModalHeader title="Product Details" onClose={() => { setDetailOpen(false); setActiveProduct(null); }} />
            <div className="adm-space-4">
              
              {/* Product Image Section */}
              <div style={{
                width: "100%",
                height: "220px",
                borderRadius: "0.75rem",
                overflow: "hidden",
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                position: "relative"
              }}>
                {(activeProduct.image ?? activeProduct.image_url) ? (
                  <img
                    src={activeProduct.image ?? activeProduct.image_url}
                    alt={activeProduct.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ color: "#9ca3af", fontWeight: 600, fontSize: "1.125rem" }}>No Image Available</div>
                )}
                {activeProduct.discount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 700
                  }}>
                    -{activeProduct.discount}%
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="adm-space-2">
                <h3 style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#111827",
                  margin: "0 0 4px 0"
                }}>
                  {activeProduct.name}
                </h3>
                <span className={catBadge(activeProduct.category)} style={{ display: "inline-block", width: "fit-content" }}>
                  {activeProduct.category ?? "General"}
                </span>
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                backgroundColor: "#f3f4f6",
                borderRadius: "0.5rem",
                overflow: "hidden",
                border: "1px solid #e5e7eb"
              }}>
                {[
                  ["ID", activeProduct.id ?? activeProduct._id ?? "—"],
                  ["Original Price", `${Number(activeProduct.price ?? 0).toFixed(0)} FCFA`],
                  ["Final Price", `${Number(activeProduct.final_price ?? activeProduct.price ?? 0).toFixed(0)} FCFA`],
                  ["Stock Quantity", activeProduct.stock ?? "0"],
                  ["Status", activeProduct.stock > 0 ? "In Stock" : "Out of Stock"],
                  ["Rating", `${activeProduct.rating ?? 0.0} ★`],
                  ["Likes", activeProduct.likes ?? 0],
                  ["3D Model (OBJ)", activeProduct.three_d_path ? "Available (OBJ)" : "Not Available"],
                  ["3D Materials (MTL)", activeProduct.mtl_file ? "Available (MTL)" : "Not Available"]
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    backgroundColor: "#fff"
                  }}>
                    <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{k}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#111827", wordBreak: "break-all", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>

              {activeProduct.description && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.5rem",
                  border: "1px solid #f3f4f6"
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>
                    Description
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0, whiteSpace: "pre-line" }}>
                    {activeProduct.description}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setProductToDelete(null); }}>
        <div className="adm-modal-body">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444"
            }}>
              <AlertTriangle size={24} />
            </div>
            
            <div className="adm-space-2">
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Delete Product
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, padding: "0 10px" }}>
                Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: "flex", width: "100%", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                className="adm-btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => { setDeleteConfirmOpen(false); setProductToDelete(null); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="adm-btn-primary" 
                style={{ flex: 1, backgroundColor: "#ef4444" }} 
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? <span className="adm-spinner" /> : "Delete"}
              </button>
            </div>
          </div>
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
  const navigate = useNavigate();
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
  const [showAppPass, setShowAppPass] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  const si = "adm-field-input";

  return (
    <div className="adm-space-5" style={{ maxWidth: 768 }}>
      <div>
        <h1 className="adm-section-title">Settings</h1>
        <p className="adm-section-sub">Configure your admin dashboard preferences.</p>
      </div>

      {/* General */}
      <div className="adm-card" style={{ width:'120%', padding: "1.5rem" }}>
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
      <div className="adm-card" style={{ width:'120%', padding: "1.5rem" }}>
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
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showAppPass ? "text" : "password"}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••••••••••"
                  className={si}
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowAppPass(!showAppPass)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    color: "#6b7280",
                  }}
                  title={showAppPass ? "Hide App Password" : "Show App Password"}
                >
                  {showAppPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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

      {/* Email Verification Template Card */}
      <div className="adm-card" style={{ width: '120%', padding: "1.5rem" }}>
        <div className="adm-settings-icon-row">
          <Mail size={17} style={{ color: "#f59e0b" }} />
          <h2 className="adm-settings-card-title">Email Templates</h2>
        </div>
        <div className="adm-space-4">
          <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            Preview and customize how the automated verification email template appears to registering technicians and users.
          </p>
          <button
            type="button"
            onClick={() => navigate("/email-template")}
            className="adm-btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              borderColor: "#f59e0b",
              color: "#f59e0b",
              backgroundColor: "transparent",
              cursor: "pointer",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem"
            }}
          >
            <Eye size={14} /> Preview Verification Email Template
          </button>
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



function DocRow({ doc, onToggleVerify, onView, onDownload }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
      <div className="flex items-center gap-2.5" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", itemsCenter: "center", justifyContent: "center", backgroundColor: doc.verified ? "#d1fae5" : "#f3f4f6" }}>
          {doc.verified
            ? <CheckCircle size={13} style={{ color: "#059669" }} />
            : <FileText size={12} style={{ color: "#9ca3af" }} />}
        </div>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "#1f2937", margin: 0 }}>{doc.name}</p>
          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, wordBreak: "break-all" }}>{doc.file}</p>
        </div>
      </div>
      <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span 
          onClick={onToggleVerify}
          style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px", backgroundColor: doc.verified ? "#d1fae5" : "#fef3c7", color: doc.verified ? "#065f46" : "#b45309", cursor: "pointer" }}
          className="hover:opacity-85 transition-opacity"
        >
          {doc.verified ? "Verified" : "Pending"}
        </span>
        <button 
          onClick={onView}
          style={{ border: "none", backgroundColor: "transparent", color: "#4b5563", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px" }}
          className="hover:bg-gray-200 transition-colors"
          title="View Document"
        >
          <Eye size={13} style={{ display: "block" }} />
        </button>
        <button 
          onClick={onDownload}
          style={{ border: "none", backgroundColor: "transparent", color: "#4b5563", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px" }}
          className="hover:bg-gray-200 transition-colors"
          title="Download Document"
        >
          <Download size={13} style={{ display: "block" }} />
        </button>
      </div>
    </div>
  );
}

function TechnicianModal({ open, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, padding: "16px" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "768px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        {children}
      </div>
    </div>
  );
}

function TechnicianDetailModal({ tech, onClose, onApprove, onReject, onToggleVerifyDoc }) {
  const allDocsVerified = tech.docs.every(d => d.verified);

  return (
    <TechnicianModal open onClose={onClose}>
      <div style={{ padding: "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#f59e0b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold" }}>
              {tech.ini}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>{tech.name}</h2>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>{tech.profession} · {tech.city}</p>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>Submitted {tech.submittedAt}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", backgroundColor: "transparent", cursor: "pointer", color: "#9ca3af" }} className="hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Personal info */}
            <section>
              <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Personal Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  [User, "Name", tech.name],
                  [Mail, "Email", tech.email],
                  [Phone, "Phone", tech.phone],
                  [Calendar, "Date of Birth", tech.dob],
                  [User, "Gender", tech.gender],
                  [MapPin, "Location", `${tech.neighborhood}, ${tech.city}`],
                ].map(([Icon, label, value]) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <Icon size={14} style={{ color: "#f59e0b", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: "11px", color: "#9ca3af", display: "block" }}>{label}</span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Professional info */}
            <section>
              <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Professional Profile</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  [Briefcase, "Profession", tech.profession],
                  [Star, "Experience", tech.experience],
                  [Clock, "Availability", tech.availability],
                  [MapPin, "Service Radius", tech.radius],
                ].map(([Icon, label, value]) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <Icon size={14} style={{ color: "#f59e0b", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: "11px", color: "#9ca3af", display: "block" }}>{label}</span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 4px 0" }}>Bio</p>
                <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5, margin: 0 }}>{tech.bio}</p>
              </div>
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 8px 0" }}>Skills</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {tech.skills.map(s => (
                    <span key={s} style={{ padding: "2px 8px", backgroundColor: "#fef3c7", color: "#92400e", fontSize: "12px", borderRadius: "9999px", fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Documents */}
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Supporting Documents</h3>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px", backgroundColor: allDocsVerified ? "#d1fae5" : "#fef3c7", color: allDocsVerified ? "#065f46" : "#92400e" }}>
                  {tech.docs.filter(d => d.verified).length}/{tech.docs.length} verified
                </span>
              </div>
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "12px" }}>
                {tech.docs.map(d => (
                  <DocRow 
                    key={d.name} 
                    doc={d} 
                    onToggleVerify={() => onToggleVerifyDoc(tech.id, d.name)}
                    onView={() => {
                      const url = d.file.startsWith("http") ? d.file : "http://127.0.0.1:8000" + d.file;
                      window.open(url, "_blank");
                    }}
                    onDownload={() => {
                      const url = d.file.startsWith("http") ? d.file : "http://127.0.0.1:8000" + d.file;
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', d.name);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  />
                ))}
              </div>
            </section>

            {/* Portfolio */}
            <section>
              <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Portfolio Files</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {tech.portfolio.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={13} style={{ color: "#9ca3af" }} />
                      <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>{f}</span>
                    </div>
                    <button style={{ border: "none", backgroundColor: "transparent", color: "#f59e0b", cursor: "pointer" }} className="hover:text-amber-600 transition-colors">
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Approval note */}
            {tech.status === "pending" && (
              <section style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af", margin: "0 0 4px 0" }}>Upon approval, the technician will receive:</p>
                <p style={{ fontSize: "12px", color: "#1d4ed8", lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>
                  "Your profile has been verified and approved. Please proceed to subscription payment to activate your account and become visible to clients."
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Action footer */}
        {tech.status === "pending" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
            <button onClick={() => onReject(tech.id)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "1px solid #fca5a5", color: "#dc2626", backgroundColor: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }} className="hover:bg-red-50 transition-colors">
              <XCircle size={15} /> Reject
            </button>
            <button onClick={() => onApprove(tech.id)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "none", color: "#ffffff", backgroundColor: "#16a34a", fontSize: "14px", fontWeight: 600, cursor: "pointer" }} className="hover:bg-green-700 transition-colors">
              <CheckCircle size={15} /> Approve Account
            </button>
          </div>
        )}
      </div>
    </TechnicianModal>
  );
}

function ApplicationsTab({ techs, setTechs }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function toggleVerifyDoc(techId, docName) {
    setTechs(prev => prev.map(t => {
      if (t.id === techId) {
        const updatedDocs = t.docs.map(d => d.name === docName ? { ...d, verified: !d.verified } : d);
        setSelected(prevSelected => prevSelected && prevSelected.id === techId ? { ...prevSelected, docs: updatedDocs } : prevSelected);
        return { ...t, docs: updatedDocs };
      }
      return t;
    }));
  }

  async function approve(id) {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/technicians/${id}/approve/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTechs(prev => prev.map(t => t.id === id ? { ...t, status: "approved" } : t));
        setSelected(null);
        showToast("Account approved — notification sent to technician.", "success");
      } else {
        showToast("Failed to approve. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  }

  async function reject(id) {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/technicians/${id}/reject/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Your application did not meet our current requirements." }),
      });
      if (res.ok) {
        setTechs(prev => prev.map(t => t.id === id ? { ...t, status: "rejected" } : t));
        setSelected(null);
        showToast("Application rejected — technician has been notified.", "error");
      } else {
        showToast("Failed to reject. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  }

  const counts = {
    all: techs.length,
    pending: techs.filter(t => t.status === "pending").length,
    approved: techs.filter(t => t.status === "approved").length,
    rejected: techs.filter(t => t.status === "rejected").length,
  };

  const visible = techs.filter(t => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.profession.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusConfig = {
    pending:  { label: "Pending Review", cls: "bg-amber-100 text-amber-700",  dot: "bg-amber-500"  },
    approved: { label: "Approved",       cls: "bg-green-100 text-green-700",   dot: "bg-green-500"  },
    rejected: { label: "Rejected",       cls: "bg-red-100 text-red-700",       dot: "bg-red-500"    },
  };

  return (
    <div className="space-y-5 relative" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`} style={{ position: "fixed", top: "20px", right: "20px", zIndex: 2000, display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "14px", fontWeight: 500, color: "#ffffff", backgroundColor: toast.type === "success" ? "#16a34a" : "#ef4444" }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", margin: 0 }}>Technician Verifications</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>Review applications, validate documents, and approve or reject technician accounts.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
        {[
          { key: "all",      label: "Total Applications", count: counts.all,      color: "text-gray-900", border: "border-gray-200", activeBorder: "border-amber-500" },
          { key: "pending",  label: "Pending Review",     count: counts.pending,  color: "text-amber-600", border: "border-gray-200", activeBorder: "border-amber-500" },
          { key: "approved", label: "Approved",           count: counts.approved, color: "text-green-600", border: "border-gray-200", activeBorder: "border-green-500" },
          { key: "rejected", label: "Rejected",           count: counts.rejected, color: "text-red-600",   border: "border-gray-200", activeBorder: "border-red-500" },
        ].map(({ key, label, count, color, border, activeBorder }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`p-5 bg-white rounded-2xl border text-left transition-all cursor-pointer ${
              filter === key ? `${activeBorder} border-2 shadow-sm` : `${border} shadow-sm hover:border-gray-300`
            }`}
            style={{
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s",
              border: filter === key ? "2px solid" : "1px solid #e5e7eb",
              borderColor: filter === key ? (key === "approved" ? "#10b981" : key === "rejected" ? "#ef4444" : "#f59e0b") : "#e5e7eb"
            }}
          >
            <div className={`text-3xl font-extrabold ${color}`} style={{ fontSize: "30px", fontWeight: "800", color: key === "approved" ? "#10b981" : key === "rejected" ? "#ef4444" : key === "pending" ? "#d97706" : "#111827" }}>{count}</div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginTop: "4px" }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ display: "flex", flexWrap: "wrap", itemsCenter: "center", gap: "12px" }}>
        <div className="relative flex-1 sm:max-w-xs" style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, profession, city..."
            style={{ width: "100%", padding: "10px 16px 10px 40px", borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", backgroundColor: "#ffffff" }}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", fontSize: "14px", color: "#4b5563" }}>
          <Filter size={13} style={{ color: "#9ca3af" }} />
          <span>Filter applied:</span>
          <span style={{ fontWeight: 600, color: "#111827", textTransform: "capitalize" }}>{filter === "all" ? "All" : filter}</span>
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "64px 0", textAlign: "center" }}>
          <Bell size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>No applications match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {visible.map(tech => {
            const cfg = statusConfig[tech.status];
            const totalDocs = tech.docs.length;
            const verifiedDocs = tech.docs.filter(d => d.verified).length;
            
            return (
              <div key={tech.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "box-shadow 0.2s" }}>
                <div>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#f59e0b", color: "#ffffff", display: "flex", alignItems: "center", justify: "center", fontWeight: "bold", fontSize: "14px" }}>
                        {tech.ini}
                      </div>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#111827", margin: 0 }}>{tech.name}</h4>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#f59e0b", margin: "2px 0 0 0" }}>{tech.profession}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><MapPin size={11} />{tech.city}</span>
                          <span>•</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Briefcase size={11} />{tech.experience}</span>
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", backgroundColor: tech.status === "approved" ? "#d1fae5" : tech.status === "rejected" ? "#fee2e2" : "#fef3c7", color: tech.status === "approved" ? "#065f46" : tech.status === "rejected" ? "#991b1b" : "#92400e" }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", padding: "12px 0", borderTop: "1px solid #f9fafb", borderBottom: "1px solid #f9fafb", fontSize: "11px" }}>
                    <div>
                      <span style={{ color: "#9ca3af", display: "block", marginBottom: "2px" }}>Email</span>
                      <span style={{ color: "#374151", fontWeight: 500, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{tech.email}</span>
                    </div>
                    <div>
                      <span style={{ color: "#9ca3af", display: "block", marginBottom: "2px" }}>Availability</span>
                      <span style={{ color: "#374151", fontWeight: 500, display: "block" }}>{tech.availability.split(",")[0]}</span>
                    </div>
                    <div>
                      <span style={{ color: "#9ca3af", display: "block", marginBottom: "2px" }}>Submitted</span>
                      <span style={{ color: "#374151", fontWeight: 500, display: "block" }}>{tech.submittedAt.split("·")[0]}</span>
                    </div>
                    <div>
                      <span style={{ color: "#9ca3af", display: "block", marginBottom: "2px" }}>Documents</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <div style={{ flex: 1, backgroundColor: "#f3f4f6", height: "6px", borderRadius: "9999px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              borderRadius: "9999px",
                              transition: "all 0.3s",
                              width: `${(verifiedDocs / totalDocs) * 100}%`,
                              backgroundColor: verifiedDocs === totalDocs ? "#10b981" : verifiedDocs === 2 ? "#f59e0b" : "#eab308"
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500 }}>{verifiedDocs}/{totalDocs}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "16px", marginBottom: "20px" }}>
                    {tech.skills.slice(0, 3).map(skill => (
                      <span key={skill} style={{ padding: "2px 8px", backgroundColor: "#f3f4f6", color: "#4b5563", fontSize: "10px", borderRadius: "6px", fontWeight: 500 }}>
                        {skill}
                      </span>
                    ))}
                    {tech.skills.length > 3 && (
                      <span style={{ padding: "2px 8px", backgroundColor: "#f3f4f6", color: "#9ca3af", fontSize: "10px", borderRadius: "6px", fontWeight: 500 }}>
                        +{tech.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: "auto" }}>
                  {tech.status === "pending" ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => reject(tech.id)}
                        style={{ flex: 1, padding: "8px 0", borderRadius: "12px", border: "1px solid #fca5a5", color: "#ef4444", backgroundColor: "#ffffff", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}
                        className="hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        onClick={() => setSelected(tech)}
                        style={{ flex: 1, padding: "8px 0", borderRadius: "12px", border: "1px solid #e5e7eb", color: "#4b5563", backgroundColor: "#ffffff", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <Eye size={13} /> Review
                      </button>
                      <button
                        onClick={() => approve(tech.id)}
                        style={{ flex: 1, padding: "8px 0", borderRadius: "12px", border: "none", color: "#ffffff", backgroundColor: "#16a34a", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}
                        className="hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelected(tech)}
                      style={{ width: "100%", padding: "8px 0", backgroundColor: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: "12px", color: "#4b5563", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}
                      className="hover:bg-gray-100 transition-colors"
                    >
                      View Details <ChevronRight size={13} style={{ marginTop: "2px" }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <TechnicianDetailModal
          tech={selected}
          onClose={() => setSelected(null)}
          onApprove={approve}
          onReject={reject}
          onToggleVerifyDoc={toggleVerifyDoc}
        />
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview",  Icon: BarChart2    },
  { key: "users",    label: "Users",     Icon: Users        },
  { key: "products", label: "Products",  Icon: Package      },
  { key: "orders",   label: "Orders",    Icon: ShoppingCart },
  { key: "application", label: "Application", Icon: FileText },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "settings", label: "Settings",  Icon: Settings     },
];

export default function AdminDashboard() {
  const [tab, setTab]               = useState("overview");
  const [techs, setTechs]           = useState([]);
  const [techsLoading, setTechsLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Get admin name from localStorage — Login.jsx stores as "username" key
  const adminName = localStorage.getItem("username") ?? "Admin";
  const profilePic = localStorage.getItem("profile_picture");

  // Admin Notifications States
  const [localNotifications, setLocalNotifications] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [notifFilter, setNotifFilter] = useState("all");

  const unreadNotifCount = localNotifications.filter(n => n.status === "unread").length;

  // Fetch real technician applications from backend
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    setTechsLoading(true);
    fetch("http://127.0.0.1:8000/api/auth/admin/technicians/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        // Map API shape → UI shape expected by ApplicationsTab
        const mapped = data.map(t => {
          const app = t.application || {};
          const firstName = app.first_name || "";
          const lastName  = app.last_name  || "";
          const name = (firstName + " " + lastName).trim() || t.username;
          const ini  = (firstName[0] || "?") + (lastName[0] || "");
          return {
            id:           t.id,
            ini:          ini.toUpperCase(),
            name,
            email:        t.email,
            phone:        app.phone        || "",
            whatsapp:     app.whatsapp     || "",
            dob:          app.dob          || "",
            gender:       app.gender       || "",
            city:         app.city         || "",
            neighborhood: "",
            address:      app.address      || "",
            profession:   (app.service === "other" && app.custom_service) ? `other (${app.custom_service})` : (app.service || t.specialty || ""),
            experience:   app.experience   || "",
            availability: app.availability || "",
            radius:       app.radius       || "",
            bio:          app.about        || "",
            skills:       app.specializations ? app.specializations.split(",").map(s => s.trim()) : [],
            portfolio:    app.portfolio_urls || [],
            docs:         (app.doc_urls || []).map(url => ({
              name: url.split("/").pop(),
              file: url,
              verified: false,
            })),
            submittedAt:  app.submitted_at ? new Date(app.submitted_at).toLocaleString() : t.date_joined,
            status:       t.approval_status,
            has_paid:     t.has_paid,
            rating:       null,
          };
        });
        setTechs(mapped);
      })
      .catch(() => {})
      .finally(() => setTechsLoading(false));
  }, [tab]);

  // Fetch real notifications from backend on mount/tab switch
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/notifications/my/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (data) {
          const mapped = data.map(n => ({
            id: n.id,
            title: n.notif_type === "new_request" ? "New Service Request Submitted" : "System Notification",
            message: n.message,
            notif_type: n.notif_type || "general",
            status: n.is_read ? "read" : "unread",
            time: new Date(n.created_at).toLocaleDateString(),
            replyText: "",
          }));
          setLocalNotifications(mapped);
        }
      })
      .catch(() => {});
  }, [tab]);

  const handleNotifMarkRead = (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/notifications/mark-all-read/", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error(err));
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n));
  };

  const handleNotifDelete = (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch(`http://127.0.0.1:8000/api/notifications/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error(err));
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotifClearAll = () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/notifications/clear/", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error(err));
    setLocalNotifications([]);
  };

  const handleNotifReply = (id) => {
    const text = replyInputs[id];
    if (!text) return;
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, replyText: text, status: "replied" } : n));
    setReplyInputs(prev => ({ ...prev, [id]: "" }));
  };

  const handleNotifArchive = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "archived" } : n));
  };

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("profile_picture");
    window.location.href = "/login";
  }

  const pendingCount = techs.filter(t => t.status === "pending").length;

  return (
    <div className="adm-scope">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="adm-navbar">
        <div className="adm-navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <span className="adm-logo">MATERIX</span>
            <nav>
              <ul className="adm-nav-links">
                {[
                  { label: "Home", href: "/" },
                  { label: "Our Products", href: "/#products-section" },
                  { label: "Our Services", href: "/#services-section" },
                  { label: "About", href: "/#about-section" }
                ].map(item => (
                  <li key={item.label}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
                <li><span className="adm-active">Dashboard</span></li>
              </ul>
            </nav>
          </div>

          <div className="adm-nav-right">
            <div style={{ position: "relative" }}>
              <button 
                className="adm-bell-btn"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{ position: "relative" }}
              >
                <Bell size={16} />
                {unreadNotifCount > 0 && (
                  <span className="adm-notif-dot">{unreadNotifCount}</span>
                )}
              </button>
              
              {notifDropdownOpen && (
                <div 
                  className="adm-notif-dropdown"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: "0.5rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 100,
                    width: "320px",
                    padding: "1rem",
                    color: "#1f2937",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>Notifications</span>
                    {unreadNotifCount > 0 && (
                      <span style={{ fontSize: "0.75rem", backgroundColor: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: "9999px", fontWeight: 600 }}>
                        {unreadNotifCount} new
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "240px", overflowY: "auto" }} className="adm-custom-scroll">
                    {localNotifications.filter(n => n.status !== "archived").length === 0 ? (
                      <div style={{ padding: "1.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.8125rem" }}>
                        No notifications
                      </div>
                    ) : (
                      localNotifications
                        .filter(n => n.status !== "archived")
                        .slice(0, 5)
                        .map(n => {
                          const isUnread = n.status === "unread";
                          return (
                            <div 
                              key={n.id}
                              onClick={() => {
                                if (isUnread) handleNotifMarkRead(n.id);
                                setNotifDropdownOpen(false);
                                setTab("notifications");
                              }}
                              style={{
                                padding: "0.5rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                backgroundColor: isUnread ? "#fef3c7" : "transparent",
                                borderLeft: isUnread ? "3px solid #f59e0b" : "3px solid transparent",
                                transition: "background-color 0.15s",
                                textAlign: "left"
                              }}
                              onMouseOver={e => {
                                if (!isUnread) e.currentTarget.style.backgroundColor = "#f9fafb";
                              }}
                              onMouseOut={e => {
                                if (!isUnread) e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: "0.8125rem", color: "#111827", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                                  {n.title}
                                </span>
                                <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>{n.time}</span>
                              </div>
                              <p style={{ fontSize: "0.75rem", color: "#4b5563", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.3" }}>
                                {n.message}
                              </p>
                            </div>
                          );
                        })
                    )}
                  </div>
                  
                  <div style={{ marginTop: "0.75rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.5rem", textAlign: "center" }}>
                    <button 
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        setTab("notifications");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FF8C00",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="adm-user-chip" style={{ position: "relative" }}>
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)} 
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
              >
                <span>{adminName}</span>
                <div className="adm-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {profilePic ? <img src={profilePic} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={13} />}
                </div>
                <ChevronDown size={13} style={{ transform: userDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>
              
              {userDropdownOpen && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.5rem",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.375rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  zIndex: 50,
                  minWidth: "150px",
                  overflow: "hidden"
                }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    <li 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        window.location.href = "/profile";
                      }} 
                      style={{
                        padding: "0.5rem 1rem",
                        color: "#d1d5db",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        transition: "background-color 0.15s, color 0.15s"
                      }}
                      className="adm-dropdown-item"
                    >
                      Profile
                    </li>
                    <li 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        window.location.href = "/pack";
                      }} 
                      style={{
                        padding: "0.5rem 1rem",
                        color: "#d1d5db",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        transition: "background-color 0.15s, color 0.15s"
                      }}
                      className="adm-dropdown-item"
                    >
                      Signup
                    </li>
                    <li 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }} 
                      style={{
                        padding: "0.5rem 1rem",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        borderTop: "1px solid #374151",
                        transition: "background-color 0.15s, color 0.15s"
                      }}
                      className="adm-dropdown-item"
                    >
                      Logout
                    </li>
                  </ul>
                </div>
              )}
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
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Icon size={14} />
              <span>{label}</span>
              {key === "application" && pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#FF8C00",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "1px 6px",
                    borderRadius: "9999px",
                    marginLeft: "2px"
                  }}
                >
                  {pendingCount}
                </span>
              )}
              {key === "notifications" && unreadNotifCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "1px 6px",
                    borderRadius: "9999px",
                    marginLeft: "2px"
                  }}
                >
                  {unreadNotifCount}
                </span>
              )}
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
        {tab === "application" && <ApplicationsTab techs={techs} setTechs={setTechs} />}
        {tab === "notifications" && (
          <AdminNotificationsTab
            notifications={localNotifications}
            filter={notifFilter}
            setFilter={setNotifFilter}
            replyInputs={replyInputs}
            setReplyInputs={setReplyInputs}
            onMarkRead={handleNotifMarkRead}
            onReply={handleNotifReply}
            onArchive={handleNotifArchive}
            onDelete={handleNotifDelete}
            onClearAll={handleNotifClearAll}
          />
        )}
        {tab === "settings"  && <SettingsTab />}
      </main>
    </div>
  );
}

// ─── Admin Notifications Tab ──────────────────────────────────────────────────
function AdminNotificationsTab({
  notifications,
  filter,
  setFilter,
  replyInputs,
  setReplyInputs,
  onMarkRead,
  onReply,
  onArchive,
  onDelete,
  onClearAll
}) {
  const unreadCount = notifications.filter(n => n.status === "unread").length;
  
  const filtered = notifications.filter(n => {
    if (filter === "all") return n.status !== "archived";
    return n.status === filter;
  });

  return (
    <div className="adm-space-5">
      <div>
        <h1 className="adm-section-title" style={{ marginBottom: "1.5rem" }}>Notifications Manager</h1>
      </div>

      {/* Filters & Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "unread", label: `Unread${unreadCount > 0 ? `  ${unreadCount}` : ""}` },
            { key: "read", label: "Read" },
            { key: "replied", label: "Replied" },
            { key: "archived", label: "Archived" }
          ].map(opt => {
            const isActive = filter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: isActive ? "none" : "1px solid #e5e7eb",
                  backgroundColor: isActive ? "#f59e0b" : "#ffffff",
                  color: isActive ? "#ffffff" : "#4b5563",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background-color 0.15s"
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "#dc2626"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "#ef4444"}
          >
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.length === 0 ? (
          <div className="adm-card" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
            No notifications in this category.
          </div>
        ) : (
          filtered.map(n => {
            const isUnread = n.status === "unread";
            
            let badgeBg = "#f3f4f6";
            let badgeColor = "#4b5563";
            if (n.status === "unread") { badgeBg = "#ffedd5"; badgeColor = "#ea580c"; }
            else if (n.status === "read") { badgeBg = "#dcfce7"; badgeColor = "#16a34a"; }
            else if (n.status === "replied") { badgeBg = "#dbeafe"; badgeColor = "#2563eb"; }
            else if (n.status === "archived") { badgeBg = "#e5e7eb"; badgeColor = "#4b5563"; }

            return (
              <div
                key={n.id}
                style={{
                  border: isUnread ? "1px solid #fde68a" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  backgroundColor: isUnread ? "#fffbeb" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: isUnread ? "#fff7ed" : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Bell size={18} style={{ color: isUnread ? "#f97316" : "#9ca3af" }} />
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                        {n.title}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            textTransform: "uppercase",
                            backgroundColor: badgeBg,
                            color: badgeColor
                          }}
                        >
                          {n.status}
                        </span>
                        <span style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>{n.time}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                      {n.message}
                    </p>

                    {n.replyText && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "6px",
                          fontSize: "0.8125rem",
                          color: "#374151",
                          borderLeft: "3px solid #2563eb",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px"
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#1e3a8a" }}>Your Reply:</span>
                        <span>{n.replyText}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyInputs[n.id] || ""}
                    onChange={e => setReplyInputs(prev => ({ ...prev, [n.id]: e.target.value }))}
                    style={{
                      height: "34px",
                      borderRadius: "9999px",
                      border: "1px solid #d1d5db",
                      padding: "0 1rem",
                      fontSize: "0.8125rem",
                      color: "#374151",
                      backgroundColor: "#ffffff",
                      flexGrow: 1,
                      outline: "none"
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") onReply(n.id);
                    }}
                  />

                  <button
                    onClick={() => onReply(n.id)}
                    style={{
                      height: "34px",
                      padding: "0 1rem",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "background-color 0.15s"
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "#1d4ed8"}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "#2563eb"}
                  >
                    <Reply size={13} /> Reply
                  </button>

                  {isUnread && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      style={{
                        height: "34px",
                        padding: "0 0.875rem",
                        backgroundColor: "transparent",
                        border: "1px solid #10b981",
                        color: "#10b981",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.15s"
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = "#ecfdf5";
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <CheckCircle size={13} /> Read
                    </button>
                  )}

                  {n.status !== "archived" && (
                    <button
                      onClick={() => onArchive(n.id)}
                      style={{
                        height: "34px",
                        padding: "0 0.875rem",
                        backgroundColor: "transparent",
                        border: "1px solid #d1d5db",
                        color: "#4b5563",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.15s"
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Archive size={13} /> Archive
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(n.id)}
                    style={{
                      height: "34px",
                      width: "34px",
                      backgroundColor: "#fef2f2",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.15s"
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "#fee2e2"}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "#fef2f2"}
                    title="Delete Notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
