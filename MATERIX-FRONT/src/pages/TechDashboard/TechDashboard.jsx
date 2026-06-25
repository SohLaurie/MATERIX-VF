import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, CheckCircle, XCircle, Clock, Bell, ChevronDown, Search,
  Eye, X, Reply, Archive, Trash2, AlertTriangle, Check, User, Menu,
  MapPin, Calendar, Wrench, Inbox, TrendingUp, TrendingDown, ExternalLink,
  CreditCard, UserPlus, LogOut
} from "lucide-react";
import "../../styles/admin-dashboard.css";

// ─── Status Badge Helpers ─────────────────────────────────────────────────────
function requestStatusBadge(status) {
  const map = {
    "pending":  "adm-badge adm-badge-pending",
    "accepted": "adm-badge adm-badge-delivered", // green
    "rejected": "adm-badge adm-badge-cancelled", // red
  };
  return map[status] ?? "adm-badge";
}

function requestPriorityBadge(priority) {
  const map = {
    "normal":    "adm-badge adm-badge-progress",
    "urgent":    "adm-badge adm-badge-pending",
    "emergency": "adm-badge adm-badge-cancelled",
  };
  return map[(priority || "").toLowerCase()] ?? "adm-badge adm-badge-progress";
}

function parseRequestMessage(rawMessage) {
  let priority = "normal";
  let dateStr = "Any";
  let desc = rawMessage || "";

  const urgencyMatch = desc.match(/\[Urgency:\s*([^\]]+)\]/i);
  if (urgencyMatch) {
    priority = urgencyMatch[1].toLowerCase();
  }

  const dateMatch = desc.match(/\[Preferred Date:\s*([^\]]+)\]/i);
  if (dateMatch) {
    dateStr = dateMatch[1];
  }

  desc = desc.replace(/\[Urgency:\s*[^\]]+\]\s*/i, "").replace(/\[Preferred Date:\s*[^\]]+\]\s*/i, "");

  return { priority, dateStr, description: desc };
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

function IconBtn({ onClick, icon, danger = false, success = false }) {
  let cls = "adm-icon-btn";
  if (danger) cls += " danger";
  return (
    <button
      onClick={onClick}
      className={cls}
      style={success ? { color: "#10b981" } : undefined}
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
function OverviewTab({
  statCards,
  recentRequests,
  setTab,
  setViewRequest,
  handleAccept,
  handleReject,
  handleDeleteRequest
}) {
  return (
    <div className="adm-space-6">
      {/* Header */}
      <div>
        <h1 className="adm-section-title">Dashboard Overview</h1>
        <p className="adm-section-sub">Welcome back. Here's your activity overview.</p>
      </div>

      {/* Stat cards */}
      <div className="adm-stats-grid">
        {statCards.map(({ label, value, change, up, Icon }) => (
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
        ))}
      </div>

      {/* Recent Requests Card */}
      <div className="adm-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Recent Requests</h2>
          <button className="adm-view-all" onClick={() => setTab("requests")}>
            View all <ExternalLink size={12} />
          </button>
        </div>
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 650 }}>
            <thead>
              <tr>
                {["Request ID", "Client & Location", "Service", "Date", "Priority", "Status", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRequests.length === 0 ? (
                <EmptyRow cols={7} msg="No recent requests." />
              ) : (
                recentRequests.map(req => (
                  <tr key={req.id}>
                    <td className="adm-td-mono">{req.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{req.client}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{req.location}</div>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "#374151" }}>{req.service}</td>
                    <td style={{ color: "#6b7280", fontSize: "0.75rem" }}>{req.date}</td>
                    <td><span className={requestPriorityBadge(req.priority)}>{req.priority}</span></td>
                    <td><span className={requestStatusBadge(req.status)}>{req.status}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <IconBtn icon={<Eye size={13} />} onClick={() => setViewRequest(req)} />
                        {req.status === "pending" && (
                          <>
                            <IconBtn icon={<Check size={13} />} onClick={() => handleAccept(req.id)} success />
                            <IconBtn icon={<X size={13} />} onClick={() => handleReject(req.id)} danger />
                          </>
                        )}
                        <IconBtn icon={<Trash2 size={13} />} onClick={() => handleDeleteRequest(req.id)} danger />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────
function RequestsTab({
  requests,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  setViewRequest,
  handleAccept,
  handleReject,
  handleDeleteRequest
}) {
  const filtered = requests.filter(r => {
    // Status Filter
    if (filterStatus !== "all statuses" && r.status !== filterStatus) return false;

    // Search Query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      r.id.toLowerCase().includes(q) ||
      r.client.toLowerCase().includes(q) ||
      r.service.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="adm-space-5">
      {/* Header Controls */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-section-title">Service Requests</h1>
          <p className="adm-section-sub">Manage and accept customer service requests.</p>
        </div>
        <div className="adm-page-controls">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><Search size={14} /></span>
            <input
              className="adm-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
            />
          </div>
          <select 
            className="adm-filter-select" 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
          >
            {["All Statuses", "Pending", "Accepted", "Rejected"].map(s => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="adm-table-wrap">
        <div className="adm-table-scroll">
          <table className="adm-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                {["Request ID", "Client", "Service & Location", "Date", "Priority", "Status", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow cols={7} msg="No requests found." />
              ) : (
                filtered.map(req => (
                  <tr key={req.id}>
                    <td className="adm-td-mono">{req.id}</td>
                    <td style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{req.client}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#374151", fontSize: "0.875rem" }}>{req.service}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{req.location}</div>
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "#4b5563" }}>{req.date}</td>
                    <td><span className={requestPriorityBadge(req.priority)}>{req.priority}</span></td>
                    <td><span className={requestStatusBadge(req.status)}>{req.status}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <IconBtn icon={<Eye size={13} />} onClick={() => setViewRequest(req)} />
                        {req.status === "pending" && (
                          <>
                            <IconBtn icon={<Check size={13} />} onClick={() => handleAccept(req.id)} success />
                            <IconBtn icon={<X size={13} />} onClick={() => handleReject(req.id)} danger />
                          </>
                        )}
                        <IconBtn icon={<Trash2 size={13} />} onClick={() => handleDeleteRequest(req.id)} danger />
                      </div>
                    </td>
                  </tr>
                ))
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
  const navigate = useNavigate();
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
            const isPaymentRequired = n.notif_type === "payment_required";
            const isActivated = n.notif_type === "account_activated";
            
            let badgeBg = "#f3f4f6";
            let badgeColor = "#4b5563";
            if (n.status === "unread") { badgeBg = "#ffedd5"; badgeColor = "#ea580c"; }
            else if (n.status === "read") { badgeBg = "#dcfce7"; badgeColor = "#16a34a"; }
            else if (n.status === "replied") { badgeBg = "#dbeafe"; badgeColor = "#2563eb"; }
            else if (n.status === "archived") { badgeBg = "#e5e7eb"; badgeColor = "#4b5563"; }

            // ── Special: Payment Required ────────────────────────────────────
            if (isPaymentRequired) {
              return (
                <div key={n.id} style={{ border: "2px solid #f59e0b", borderRadius: "12px", padding: "1.5rem", backgroundColor: "#fffbeb", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 4px 12px rgba(245,158,11,0.15)" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CreditCard size={20} style={{ color: "#d97706" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e", margin: 0 }}>🎉 Application Approved!</h3>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{n.time}</span>
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "#78350f", margin: "6px 0 0 0", lineHeight: 1.5 }}>{n.message}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #fde68a" }}>
                    <button
                      onClick={() => navigate("/payment")}
                      style={{ flex: 1, padding: "10px 20px", backgroundColor: "#f59e0b", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = "#d97706"}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = "#f59e0b"}
                    >
                      <CreditCard size={15} /> Proceed to Payment →
                    </button>
                    <button onClick={() => onDelete(n.id)} style={{ height: "40px", width: "40px", backgroundColor: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Dismiss">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            }

            // ── Special: Account Activated ───────────────────────────────────
            if (isActivated) {
              return (
                <div key={n.id} style={{ border: "2px solid #10b981", borderRadius: "12px", padding: "1.5rem", backgroundColor: "#f0fdf4", display: "flex", gap: "1rem", alignItems: "flex-start", boxShadow: "0 4px 12px rgba(16,185,129,0.1)" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckCircle size={20} style={{ color: "#059669" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#065f46", margin: 0 }}>✅ Account Activated!</h3>
                    <p style={{ fontSize: "0.875rem", color: "#047857", margin: "6px 0 0 0", lineHeight: 1.5 }}>{n.message}</p>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{n.time}</span>
                  </div>
                  <button onClick={() => onDelete(n.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><X size={16} /></button>
                </div>
              );
            }

            // ── Standard notification card ───────────────────────────────────
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

                {/* Actions row */}
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
export default function TechDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [requests, setRequests] = useState([
    { id: "REQ-001", client: "Sarah Mensah", service: "Electrical Installation", date: "Jun 16, 2026", location: "Downtown", priority: "normal", status: "pending" },
    { id: "REQ-002", client: "Paul Eze", service: "Wiring Repair", date: "Jun 15, 2026", location: "Westside", priority: "urgent", status: "pending" },
    { id: "REQ-003", client: "Linda Nkosi", service: "Panel Upgrade", date: "Jun 14, 2026", location: "Northgate", priority: "normal", status: "accepted" },
    { id: "REQ-004", client: "Kwame Asante", service: "Emergency Fix", date: "Jun 13, 2026", location: "Central", priority: "emergency", status: "rejected" },
    { id: "REQ-005", client: "Amara Diallo", service: "Generator Setup", date: "Jun 12, 2026", location: "Harbor", priority: "normal", status: "pending" },
    { id: "REQ-006", client: "Victor Obi", service: "Socket Installation", date: "Jun 11, 2026", location: "Eastview", priority: "normal", status: "accepted" },
  ]);

  const [localNotifications, setLocalNotifications] = useState([
    {
      id: "N1",
      title: "New Request from Sarah Mensah",
      message: "Sarah requested Electrical Installation on Jun 16, 2026.",
      status: "unread",
      time: "2h ago",
      replyText: ""
    },
    {
      id: "N2",
      title: "New Request from Paul Eze",
      message: "Paul requested Wiring Repair on Jun 15, 2026.",
      status: "unread",
      time: "5h ago",
      replyText: ""
    },
    {
      id: "N3",
      title: "Reminder: Pending request REQ-002",
      message: "You have a pending request awaiting your response.",
      status: "read",
      time: "1d ago",
      replyText: ""
    },
    {
      id: "N4",
      title: "New Request from Amara Diallo",
      message: "Amara requested Generator Setup on Jun 12, 2026.",
      status: "replied",
      time: "2d ago",
      replyText: ""
    },
    {
      id: "N5",
      title: "System: Profile verified",
      message: "Your technician profile has been verified by Materix.",
      status: "archived",
      time: "3d ago",
      replyText: ""
    }
  ]);

  const [replyInputs, setReplyInputs] = useState({});
  const [notifFilter, setNotifFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all statuses");

  const [viewRequest, setViewRequest] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = localStorage.getItem("username") || "Technician";
  const profilePic = localStorage.getItem("profile_picture");
  const approvalStatus = localStorage.getItem("approval_status") || "pending";
  const hasPaid = localStorage.getItem("has_paid") === "true";

  const userRef = useRef(null);

  // Fetch real notifications from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/notifications/my/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        const mapped = data.map(n => ({
          id: n.id,
          title: n.notif_type === "payment_required"   ? "Application Approved — Action Required"
               : n.notif_type === "account_activated"  ? "Account Activated"
               : n.notif_type === "application_rejected" ? "Application Status Update"
               : "Notification",
          message: n.message,
          notif_type: n.notif_type || "general",
          status: n.is_read ? "read" : "unread",
          time: new Date(n.created_at).toLocaleDateString(),
          replyText: "",
        }));
        if (mapped.length > 0) setLocalNotifications(mapped);
      })
      .catch(() => {}); // keep static fallback on error
  }, []);

  // Also refresh user profile to get latest approval_status + has_paid
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/auth/profile/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (data.approval_status) localStorage.setItem("approval_status", data.approval_status);
        if (data.has_paid !== undefined) localStorage.setItem("has_paid", String(data.has_paid));
      })
      .catch(() => {});
  }, []);


  // Close dropdown on click outside
  useEffect(() => {
    const clickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Fetch real service requests from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/portal/requests/my/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(r => {
            const parsed = parseRequestMessage(r.message);
            return {
              id: r.id,
              client: r.client_name,
              service: parsed.description,
              date: parsed.dateStr,
              priority: parsed.priority,
              location: r.location || "Not specified",
              status: r.status,
            };
          });
          setRequests(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleAccept = async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/portal/requests/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "accepted" })
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "accepted" } : r));
        if (viewRequest && viewRequest.id === id) {
          setViewRequest(prev => ({ ...prev, status: "accepted" }));
        }
      } else {
        alert("Failed to accept request.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/portal/requests/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "rejected" })
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
        if (viewRequest && viewRequest.id === id) {
          setViewRequest(prev => ({ ...prev, status: "rejected" }));
        }
      } else {
        alert("Failed to reject request.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleDeleteRequest = (id) => {
    if (confirm("Are you sure you want to delete this request?")) {
      setRequests(prev => prev.filter(r => r.id !== id));
      if (viewRequest && viewRequest.id === id) {
        setViewRequest(null);
      }
    }
  };

  // Notification operations — update local state + call API
  const handleLocalMarkRead = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n));
    const token = localStorage.getItem("access");
    if (token) {
      fetch("http://127.0.0.1:8000/api/notifications/mark-all-read/", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
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
    const token = localStorage.getItem("access");
    if (token) {
      fetch(`http://127.0.0.1:8000/api/notifications/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
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

  // Card counts
  const totalRequestsCount = requests.length;
  const acceptedRequests = requests.filter((r) => r.status === "accepted").length;
  const rejectedRequests = requests.filter((r) => r.status === "rejected").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  const statCards = [
    {
      label: "TOTAL REQUESTS",
      value: String(totalRequestsCount),
      change: "Lifetime assignments", up: true, Icon: BarChart2,
    },
    {
      label: "ACCEPTED",
      value: String(acceptedRequests),
      change: "Active & completed", up: true, Icon: CheckCircle,
    },
    {
      label: "REJECTED",
      value: String(rejectedRequests),
      change: "Declined requests", up: false, Icon: XCircle,
    },
    {
      label: "PENDING",
      value: String(pendingRequests),
      change: "Requires attention", up: true, Icon: Clock,
    },
  ];

  const TABS = [
    { key: "overview",      label: "Overview",      Icon: BarChart2 },
    { key: "requests",      label: "Requests",      Icon: Inbox },
    { key: "notifications", label: "Notifications", Icon: Bell },
  ];

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
              <button 
                className="adm-bell-btn" 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{ position: "relative" }}
              >
                <Bell size={16} />
                {unreadCount > 0 && <span className="adm-notif-dot">{unreadCount}</span>}
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
                    {unreadCount > 0 && (
                      <span style={{ fontSize: "0.75rem", backgroundColor: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: "9999px", fontWeight: 600 }}>
                        {unreadCount} new
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
                                if (isUnread) handleLocalMarkRead(n.id);
                                setNotifDropdownOpen(false);
                                setActiveTab("notifications");
                              }}
                              style={{
                                padding: "0.5rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                backgroundColor: isUnread ? "#fffbeb" : "transparent",
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
                        setActiveTab("notifications");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f59e0b",
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
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "background-color 0.15s, color 0.15s"
                      }}
                      className="adm-dropdown-item"
                    >
                      <User size={14} />
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
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "background-color 0.15s, color 0.15s"
                      }}
                      className="adm-dropdown-item"
                    >
                      <UserPlus size={14} />
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
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        borderTop: "1px solid #374151",
                        transition: "background-color 0.15s, color 0.15s"
                      }}
                      className="adm-dropdown-item"
                    >
                      <LogOut size={14} />
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
              className={`adm-tab-btn${activeTab === key ? " active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="adm-main">
        {activeTab === "overview" && (
          <OverviewTab 
            statCards={statCards}
            recentRequests={requests}
            setTab={setActiveTab}
            setViewRequest={setViewRequest}
            handleAccept={handleAccept}
            handleReject={handleReject}
            handleDeleteRequest={handleDeleteRequest}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab 
            requests={requests}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            setViewRequest={setViewRequest}
            handleAccept={handleAccept}
            handleReject={handleReject}
            handleDeleteRequest={handleDeleteRequest}
          />
        )}

        {activeTab === "notifications" && (
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
      <Modal open={!!viewRequest} onClose={() => setViewRequest(null)}>
        {viewRequest && (
          <div className="adm-modal-body">
            <ModalHeader title="Service Request Details" onClose={() => setViewRequest(null)} />
            
            <div className="adm-space-4" style={{ marginBottom: "1.5rem" }}>
              {[
                ["Request ID", viewRequest.id],
                ["Client Name", viewRequest.client],
                ["Requested Service", viewRequest.service],
                ["Location / Address", viewRequest.location],
                ["Preferred Date", viewRequest.date],
                ["Priority", <span className={requestPriorityBadge(viewRequest.priority)}>{viewRequest.priority}</span>],
                ["Request Status", <span className={requestStatusBadge(viewRequest.status)}>{viewRequest.status}</span>]
              ].map(([k, v]) => (
                <div key={k} className="adm-detail-row">
                  <span className="adm-detail-key">{k}</span>
                  <span className="adm-detail-val">{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem" }}>
              <button className="adm-btn-secondary" onClick={() => setViewRequest(null)}>Close</button>
              
              {viewRequest.status === "pending" && (
                <>
                  <button 
                    className="adm-btn-primary" 
                    onClick={() => {
                      handleAccept(viewRequest.id);
                      setViewRequest(null);
                    }}
                    style={{ border: "none" }}
                  >
                    Accept Request
                  </button>
                  <button 
                    className="adm-btn-primary" 
                    onClick={() => {
                      handleReject(viewRequest.id);
                      setViewRequest(null);
                    }}
                    style={{ backgroundColor: "#ef4444", border: "none" }}
                  >
                    Reject Request
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
