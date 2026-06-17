import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart2, ShoppingCart, Bell, ChevronDown, Search, Eye, X,
  AlertTriangle, CheckCircle, Truck, Package, TrendingUp, TrendingDown,
  User, ExternalLink, Menu, Archive, Trash2, Reply
} from "lucide-react";
import "../../styles/admin-dashboard.css";

// ─── API Helpers ──────────────────────────────────────────────────────────────
const BASE = "http://127.0.0.1:8000";

function authHeader() {
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

function orderStatusBadge(s) {
  const map = {
    "Delivered":   "adm-badge adm-badge-delivered",
    "In Progress": "adm-badge adm-badge-progress",
    "Pending":     "adm-badge adm-badge-pending",
    "Cancelled":   "adm-badge adm-badge-cancelled",
  };
  return map[s] ?? "adm-badge";
}

// ─── Shared UI Components ─────────────────────────────────────────────────────
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

// ─── Loading Row ──────────────────────────────────────────────────────────────
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
function OverviewTab({ 
  loading, 
  error,
  statCards, 
  myActiveOrders, 
  claimableOrders, 
  setTab, 
  setViewOrder, 
  handleAccept, 
  handleDelivered, 
  actionLoading 
}) {
  return (
    <div className="adm-space-6">
      {/* Header */}
      <div>
        <h1 className="adm-section-title">Dashboard Overview</h1>
        <p className="adm-section-sub">Welcome back. Track and claim customer shipments.</p>
      </div>

      {/* Stat cards */}
      <div className="adm-stats-grid">
        {loading
          ? [0, 1, 2, 3].map(i => (
              <div key={i} className="adm-stat-card" style={{ minHeight: 120 }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
                  <span className="adm-spinner" />
                </div>
              </div>
            ))
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

      {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}

      {/* Active Shipments Card */}
      <div className="adm-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>My Active Shipments</h2>
          <button className="adm-view-all" onClick={() => setTab("orders")}>
            View all <ExternalLink size={12} />
          </button>
        </div>
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                {["Order ID", "Customer & Address", "Total", "Status", "Date", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <LoadingRow cols={6} />
                : myActiveOrders.length === 0
                ? <EmptyRow cols={6} msg="No active shipments." />
                : myActiveOrders.slice(0, 5).map(o => {
                    const id = o.id ?? o._id;
                    const customer = o.customer_username ?? "—";
                    const address = o.customer_address ?? "No address provided";
                    const total = Number(o.total_price ?? 0).toFixed(2);
                    const formattedDate = o.created_at
                      ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";

                    return (
                      <tr key={id}>
                        <td className="adm-td-mono">{id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{customer}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{address}</div>
                        </td>
                        <td style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{total} FCFA</td>
                        <td><span className={orderStatusBadge(o.status)}>{o.status}</span></td>
                        <td style={{ color: "#6b7280", fontSize: "0.75rem" }}>{formattedDate}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <IconBtn icon={<Eye size={13} />} onClick={() => setViewOrder(o)} />
                            <button
                              onClick={() => handleDelivered(id)}
                              className="adm-btn-primary"
                              style={{ padding: "4px 8px !important", fontSize: "0.75rem !important", backgroundColor: "#10b981", height: "26px", border: "none" }}
                              disabled={actionLoading}
                            >
                              Deliver
                            </button>
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

      {/* Available Claims Card */}
      <div className="adm-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Available Claims</h2>
          <button className="adm-view-all" onClick={() => setTab("orders")}>
            View all <ExternalLink size={12} />
          </button>
        </div>
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                {["Order ID", "Customer & Address", "Total", "Status", "Date", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <LoadingRow cols={6} />
                : claimableOrders.length === 0
                ? <EmptyRow cols={6} msg="No claimable orders available." />
                : claimableOrders.slice(0, 5).map(o => {
                    const id = o.id ?? o._id;
                    const customer = o.customer_username ?? "—";
                    const address = o.customer_address ?? "No address provided";
                    const total = Number(o.total_price ?? 0).toFixed(2);
                    const formattedDate = o.created_at
                      ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";

                    return (
                      <tr key={id}>
                        <td className="adm-td-mono">{id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{customer}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{address}</div>
                        </td>
                        <td style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{total} FCFA</td>
                        <td><span className={orderStatusBadge(o.status)}>{o.status}</span></td>
                        <td style={{ color: "#6b7280", fontSize: "0.75rem" }}>{formattedDate}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <IconBtn icon={<Eye size={13} />} onClick={() => setViewOrder(o)} />
                            <button
                              onClick={() => handleAccept(id)}
                              className="adm-btn-primary"
                              style={{ padding: "4px 8px !important", fontSize: "0.75rem !important", backgroundColor: "#f59e0b", height: "26px", border: "none" }}
                              disabled={actionLoading}
                            >
                              Claim
                            </button>
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
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({
  loading,
  filteredOrders,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  setViewOrder,
  handleAccept,
  handleDelivered,
  actionLoading,
  username
}) {
  return (
    <div className="adm-space-5">
      {/* Header controls */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-section-title">Order Management</h1>
          <p className="adm-section-sub">Track and claim customer shipments.</p>
        </div>
        <div className="adm-page-controls">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><Search size={14} /></span>
            <input
              className="adm-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
            />
          </div>
          <select 
            className="adm-filter-select" 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
          >
            {["All Statuses", "Pending", "In Progress", "Delivered"].map(s => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="adm-table-wrap">
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 740 }}>
            <thead>
              <tr>
                {["Order ID", "Customer", "Agent", "Total", "Status", "Date", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRow cols={7} />
              ) : filteredOrders.length === 0 ? (
                <EmptyRow cols={7} msg="No orders found." />
              ) : (
                filteredOrders.map(order => {
                  const id = order.id ?? order._id;
                  const isMe = order.assigned_agent === "You" || order.assigned_agent === username;
                  const isUnassigned = !order.assigned_agent;
                  const total = Number(order.total_price ?? 0).toFixed(2);
                  const formattedDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—";
                  
                  return (
                    <tr key={id}>
                      <td className="adm-td-mono">{id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{order.customer_username}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{order.customer_address || "No address provided"}</div>
                      </td>
                      <td style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                        {isMe ? (
                          <span style={{ color: "#f59e0b", fontWeight: 600 }}>You</span>
                        ) : isUnassigned ? (
                          <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Unassigned</span>
                        ) : (
                          order.assigned_agent
                        )}
                      </td>
                      <td style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{total} FCFA</td>
                      <td>
                        <span className={orderStatusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{formattedDate}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <IconBtn icon={<Eye size={13} />} onClick={() => setViewOrder(order)} />
                          
                          {isUnassigned && order.status === "Pending" && (
                            <button 
                              onClick={() => handleAccept(id)} 
                              className="adm-btn-primary" 
                              style={{ padding: "4px 8px !important", fontSize: "0.75rem !important", backgroundColor: "#f59e0b", height: "26px", border: "none" }}
                              disabled={actionLoading}
                            >
                              Claim
                            </button>
                          )}
                          
                          {isMe && order.status === "In Progress" && (
                            <button 
                              onClick={() => handleDelivered(id)} 
                              className="adm-btn-primary" 
                              style={{ padding: "4px 8px !important", fontSize: "0.75rem !important", backgroundColor: "#10b981", height: "26px", border: "none" }}
                              disabled={actionLoading}
                            >
                              Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab({
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
    if (filter === "all") return n.status !== "archived"; // by default, don't show archived in 'all' list
    return n.status === filter;
  });

  return (
    <div className="adm-space-5">
      {/* Header section */}
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
            
            // Badge color scheme
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
                {/* Header info */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  {/* Left Circle Icon */}
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
                    <Truck size={18} style={{ color: isUnread ? "#f97316" : "#9ca3af" }} />
                  </div>

                  {/* Text Content */}
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

                    {/* Show typed reply */}
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

                {/* Actions sub-row */}
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
                      borderRadius: "9999px",
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DeliverDashboard() {
  const [orders, setOrders] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [tab, setTab] = useState("overview");
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all statuses");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Local static/interactive Notifications state
  const [localNotifications, setLocalNotifications] = useState([
    {
      id: "ORD-101",
      title: "New Order ORD-101 Assigned",
      message: "Order ORD-101 from Sarah Chen has been assigned to you.",
      status: "unread",
      time: "30m ago",
      replyText: ""
    },
    {
      id: "ORD-104",
      title: "New Order ORD-104 Assigned",
      message: "Order ORD-104 from James Wilson requires delivery today.",
      status: "unread",
      time: "1h ago",
      replyText: ""
    },
    {
      id: "ORD-102",
      title: "Order ORD-102 In Transit",
      message: "ORD-102 has been picked up and is now in transit.",
      status: "read",
      time: "3h ago",
      replyText: ""
    },
    {
      id: "ORD-103",
      title: "Order ORD-103 Delivered",
      message: "ORD-103 was successfully delivered to Emily Davis.",
      status: "replied",
      time: "1d ago",
      replyText: ""
    },
    {
      id: "route-update",
      title: "Route Update: Downtown",
      message: "Traffic delay on Oak Street. Consider alternate route.",
      status: "archived",
      time: "2d ago",
      replyText: ""
    }
  ]);
  const [notifFilter, setNotifFilter] = useState("all");
  const [replyInputs, setReplyInputs] = useState({});

  // Mobile menu open
  const [mobileOpen, setMobileOpen] = useState(false);

  const token = localStorage.getItem("access");
  const username = localStorage.getItem("username") || "Guest";
  const profilePic = localStorage.getItem("profile_picture");

  const userRef = useRef(null);

  // Fetch all orders
  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/shop/delivery/orders/");
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load delivery orders. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAccept = async (orderId) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/shop/delivery/orders/${orderId}/assign/`, {
        method: "PATCH",
      });

      // Local state update
      setOrders((prev) =>
        prev.map((order) => {
          const id = order.id ?? order._id;
          return id === orderId
            ? { ...order, assigned_agent: username, status: "In Progress" }
            : order;
        })
      );
    } catch (err) {
      console.error("Error assigning order:", err);
      alert("Failed to claim order. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelivered = async (orderId) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/shop/delivery/orders/${orderId}/deliver/`, {
        method: "PATCH",
      });

      // Local state update
      setOrders((prev) =>
        prev.map((order) => {
          const id = order.id ?? order._id;
          return id === orderId ? { ...order, status: "Delivered" } : order;
        })
      );
    } catch (err) {
      console.error("Error marking order delivered:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Local notifications operations
  const handleLocalMarkRead = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n));
  };

  const handleLocalReply = (id) => {
    const text = replyInputs[id];
    if (!text || !text.trim()) return;
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "replied", replyText: text } : n));
    setReplyInputs(prev => ({ ...prev, [id]: "" }));
  };

  const handleLocalArchive = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "archived" } : n));
  };

  const handleLocalDelete = (id) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLocalClearAll = () => {
    setLocalNotifications([]);
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("profile_picture");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const clickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Card counts
  const availableClaims = orders.filter((o) => !o.assigned_agent && o.status === "Pending").length;
  const inprogressOrders = orders.filter((o) => (o.assigned_agent === "You" || o.assigned_agent === username) && o.status === "In Progress").length;
  const completedOrders = orders.filter((o) => (o.assigned_agent === "You" || o.assigned_agent === username) && o.status === "Delivered").length;
  const totalAssigned = orders.filter((o) => (o.assigned_agent === "You" || o.assigned_agent === username)).length;

  const myActiveOrders = orders.filter((o) => (o.assigned_agent === "You" || o.assigned_agent === username) && o.status === "In Progress");
  const claimableOrders = orders.filter((o) => !o.assigned_agent && o.status === "Pending");

  // Search & filter logic
  const filteredOrders = orders.filter(order => {
    const isMe = order.assigned_agent === "You" || order.assigned_agent === username;
    const isUnassigned = !order.assigned_agent;
    
    // Status filter
    if (filterStatus === "pending" && (!isUnassigned || order.status !== "Pending")) return false;
    if (filterStatus === "in progress" && (!isMe || order.status !== "In Progress")) return false;
    if (filterStatus === "delivered" && (!isMe || order.status !== "Delivered")) return false;

    // Search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const idMatches = `ord-${order.id}`.includes(query) || String(order.id).includes(query);
    const customerMatches = (order.customer_username || "").toLowerCase().includes(query);
    const addressMatches = (order.customer_address || "").toLowerCase().includes(query);

    return idMatches || customerMatches || addressMatches;
  });

  const statCards = [
    {
      label: "AVAILABLE CLAIMS",
      value: String(availableClaims),
      change: "Pending unassigned", up: true, Icon: Package,
    },
    {
      label: "MY IN PROGRESS",
      value: String(inprogressOrders),
      change: "Active shipments", up: true, Icon: Truck,
    },
    {
      label: "MY COMPLETED",
      value: String(completedOrders),
      change: "Delivered", up: true, Icon: CheckCircle,
    },
    {
      label: "TOTAL ASSIGNED",
      value: String(totalAssigned),
      change: "All my claims", up: true, Icon: ShoppingCart,
    },
  ];

  const TABS = [
    { key: "overview",      label: "Overview",      Icon: BarChart2 },
    { key: "orders",        label: "Orders",        Icon: ShoppingCart },
    { key: "notifications", label: "Notifications", Icon: Bell },
  ];

  // Dynamic unread notifications count for badge
  const unreadCount = localNotifications.filter(n => n.status === "unread").length;

  return (
    <div className="adm-scope">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="adm-navbar">
        <div className="adm-navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <span className="adm-logo" style={{ cursor: "pointer" }} onClick={() => window.location.href = "/"}>MATERIX</span>
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
            {/* Notification Bell Icon */}
            <div style={{ position: "relative" }}>
              <button className="adm-bell-btn" onClick={() => setTab("notifications")}>
                <Bell size={16} />
                {unreadCount > 0 && <span className="adm-notif-dot">{unreadCount}</span>}
              </button>
            </div>

            {/* Profile Dropdown Chip */}
            <div className="adm-user-chip" ref={userRef} style={{ position: "relative" }}>
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)} 
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
              >
                <span>{username}</span>
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

            <button className="adm-mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
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

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
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

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="adm-main">
        {tab === "overview" && (
          <OverviewTab 
            loading={loading}
            error={error}
            statCards={statCards}
            myActiveOrders={myActiveOrders}
            claimableOrders={claimableOrders}
            setTab={setTab}
            setViewOrder={setViewOrder}
            handleAccept={handleAccept}
            handleDelivered={handleDelivered}
            actionLoading={actionLoading}
          />
        )}

        {tab === "orders" && (
          <OrdersTab 
            loading={loading}
            filteredOrders={filteredOrders}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            setViewOrder={setViewOrder}
            handleAccept={handleAccept}
            handleDelivered={handleDelivered}
            actionLoading={actionLoading}
            username={username}
          />
        )}

        {tab === "notifications" && (
          <NotificationsTab 
            notifications={localNotifications}
            filter={notifFilter}
            setFilter={setNotifFilter}
            replyInputs={replyInputs}
            setReplyInputs={setReplyInputs}
            onMarkRead={handleLocalMarkRead}
            onReply={handleLocalReply}
            onArchive={handleLocalArchive}
            onDelete={handleLocalDelete}
            onClearAll={handleLocalClearAll}
          />
        )}
      </main>

      {/* ── Details Modal ─────────────────────────────────────────────────── */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)}>
        {viewOrder && (
          <div className="adm-modal-body">
            <ModalHeader title={`Order Details`} onClose={() => setViewOrder(null)} />
            
            <div className="adm-space-4" style={{ marginBottom: "1.5rem" }}>
              {[
                ["Order ID", viewOrder.id],
                ["Customer", viewOrder.customer_username],
                ["Delivery Address", viewOrder.customer_address || "No address provided"],
                ["Total Price", `${Number(viewOrder.total_price || 0).toFixed(2)} FCFA`],
                ["Order Status", <span className={orderStatusBadge(viewOrder.status)}>{viewOrder.status}</span>],
                ["Assigned Dispatcher", viewOrder.assigned_agent === "You" || viewOrder.assigned_agent === username ? (
                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>You</span>
                ) : !viewOrder.assigned_agent ? (
                  <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Unassigned</span>
                ) : (
                  viewOrder.assigned_agent
                )]
              ].map(([k, v]) => (
                <div key={k} className="adm-detail-row">
                  <span className="adm-detail-key">{k}</span>
                  <span className="adm-detail-val">{v}</span>
                </div>
              ))}
            </div>

            {/* Products List */}
            {(viewOrder.items ?? []).length > 0 && (
              <div style={{ marginTop: "1.25rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.075em", marginBottom: "0.75rem" }}>Products List</p>
                <div className="adm-space-2">
                  {viewOrder.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "#374151" }}>{item.product_name} × {item.quantity ?? 1}</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{Number(item.price_at_purchase ?? 0).toFixed(2)} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem" }}>
              <button className="adm-btn-secondary" onClick={() => setViewOrder(null)}>Close</button>
              
              {!viewOrder.assigned_agent && viewOrder.status === "Pending" && (
                <button 
                  className="adm-btn-primary" 
                  onClick={() => {
                    handleAccept(viewOrder.id);
                    setViewOrder(null);
                  }}
                  style={{ border: "none" }}
                  disabled={actionLoading}
                >
                  Accept Claim
                </button>
              )}

              {(viewOrder.assigned_agent === "You" || viewOrder.assigned_agent === username) && viewOrder.status === "In Progress" && (
                <button 
                  className="adm-btn-primary" 
                  onClick={() => {
                    handleDelivered(viewOrder.id);
                    setViewOrder(null);
                  }}
                  style={{ backgroundColor: "#10b981", border: "none" }}
                  disabled={actionLoading}
                >
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
