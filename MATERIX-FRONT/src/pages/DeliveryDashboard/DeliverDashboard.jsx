import React, { useState } from "react";
import {
  BarChart2, Package, CheckCircle, Clock, Bell, Truck,
  Eye, Trash2, Reply, Archive, Check, X, MapPin, User,
} from "lucide-react";
import Navbar from "../../components/Navbar";

const INIT_ORDERS = [
  { id: "ORD-101", customer: "Sarah Chen", destination: "14 Oak St, Downtown", items: "Industrial Drill, Safety Helmet", total: "$348.99", date: "Jun 16, 2026", status: "pending" },
  { id: "ORD-102", customer: "Mike Johnson", destination: "72 River Rd, Westside", items: "Copper Wire 100m, Wrench Set", total: "$214.50", date: "Jun 15, 2026", status: "in_transit" },
  { id: "ORD-103", customer: "Emily Davis", destination: "9 Maple Ave, Northgate", items: "Steel Bolts Pack x5", total: "$172.50", date: "Jun 14, 2026", status: "delivered" },
  { id: "ORD-104", customer: "James Wilson", destination: "31 Park Blvd, Central", items: "Circuit Breaker 30A, Conduit", total: "$432.00", date: "Jun 13, 2026", status: "pending" },
  { id: "ORD-105", customer: "Lisa Anderson", destination: "55 Harbor Dr, Southpark", items: "Pipe Fittings Set, Sealant", total: "$89.00", date: "Jun 12, 2026", status: "delivered" },
  { id: "ORD-106", customer: "Kwame Asante", destination: "18 Uptown Rd, Eastview", items: "Power Tools Kit", total: "$675.00", date: "Jun 11, 2026", status: "in_transit" },
];

const INIT_NOTIFICATIONS = [
  { id: "D1", title: "New Order ORD-101 Assigned", body: "Order ORD-101 from Sarah Chen has been assigned to you.", time: "30m ago", status: "unread" },
  { id: "D2", title: "New Order ORD-104 Assigned", body: "Order ORD-104 from James Wilson requires delivery today.", time: "1h ago", status: "unread" },
  { id: "D3", title: "Order ORD-102 In Transit", body: "ORD-102 has been picked up and is now in transit.", time: "3h ago", status: "read" },
  { id: "D4", title: "Order ORD-103 Delivered", body: "ORD-103 was successfully delivered to Emily Davis.", time: "1d ago", status: "replied" },
  { id: "D5", title: "Route Update: Downtown", body: "Traffic delay on Oak Street. Consider alternate route.", time: "2d ago", status: "archived" },
];

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#94A3B8", letterSpacing: "0.1em" }}>{label}</p>
          <p style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const statusMap = {
    pending: { label: "Pending", color: "#FF8C00", bg: "#FFF3E0" },
    in_transit: { label: "In Transit", color: "#2563EB", bg: "#EFF6FF" },
    delivered: { label: "Delivered", color: "#16A34A", bg: "#F0FDF4" },
  };
  const s = statusMap[order.status] || statusMap.pending;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(15,23,42,0.08)", backgroundColor: "#0F172A" }}>
          <div>
            <p className="text-xs" style={{ color: "#94A3B8" }}>Order Details</p>
            <h3 style={{ color: "#FACC15", fontWeight: 700, fontSize: "1.125rem" }}>{order.id}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "white" }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
            <span className="text-sm" style={{ color: "#64748B" }}>{order.date}</span>
          </div>
          <div className="space-y-3">
            {[
              { icon: <User size={14} />, label: "Customer", value: order.customer },
              { icon: <MapPin size={14} />, label: "Destination", value: order.destination },
              { icon: <Package size={14} />, label: "Items", value: order.items },
              { icon: <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>$</span>, label: "Total", value: order.total },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC" }}>
                <span style={{ color: "#FF8C00", marginTop: "2px", flexShrink: 0 }}>{row.icon}</span>
                <div>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{row.label}</p>
                  <p className="text-sm" style={{ color: "#0F172A", fontWeight: 500 }}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white"
            style={{ backgroundColor: "#FF8C00", border: "none" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-xs rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#FEF2F2" }}>
            <Trash2 size={22} style={{ color: "#EF4444" }} />
          </div>
          <h3 style={{ fontWeight: 700, color: "#0F172A", marginBottom: "0.4rem" }}>Delete Notification</h3>
          <p className="text-sm" style={{ color: "#64748B" }}>Are you sure you want to delete this notification?</p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer border"
            style={{ backgroundColor: "transparent", borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer text-white"
            style={{ backgroundColor: "#EF4444", border: "none" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ClearAllConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-xs rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#FFF3E0" }}>
            <Trash2 size={22} style={{ color: "#FF8C00" }} />
          </div>
          <h3 style={{ fontWeight: 700, color: "#0F172A", marginBottom: "0.4rem" }}>Clear All Notifications</h3>
          <p className="text-sm" style={{ color: "#64748B" }}>This will permanently remove all notifications.</p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer border"
            style={{ backgroundColor: "transparent", borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer text-white"
            style={{ backgroundColor: "#FF8C00", border: "none" }}>Clear All</button>
        </div>
      </div>
    </div>
  );
}

const DeliverDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [orders] = useState(INIT_ORDERS);
  const [notifications, setNotifications] = useState(INIT_NOTIFICATIONS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [clearAllModal, setClearAllModal] = useState(false);
  const [replyInput, setReplyInput] = useState({});
  const [notifFilter, setNotifFilter] = useState("all");

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const filteredNotifs = notifications.filter(
    (n) => notifFilter === "all" || n.status === notifFilter
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart2 size={16} /> },
    { id: "orders", label: "Orders", icon: <Truck size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  ];

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && n.status === "unread" ? { ...n, status: "read" } : n))
    );

  const archiveNotif = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "archived" } : n))
    );

  const deleteNotif = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDeleteModal(null);
  };

  const sendReply = (id) => {
    if (!replyInput[id]?.trim()) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "replied" } : n))
    );
    setReplyInput((prev) => ({ ...prev, [id]: "" }));
  };

  const orderStatusBadge = (status) => {
    const map = {
      pending: { bg: "#FFF3E0", color: "#FF8C00", label: "Pending" },
      in_transit: { bg: "#EFF6FF", color: "#2563EB", label: "In Transit" },
      delivered: { bg: "#F0FDF4", color: "#16A34A", label: "Delivered" },
    };
    const s = map[status] || map.pending;
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full"
        style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
    );
  };

  const notifStatusBadge = (status) => {
    const map = {
      unread: { bg: "#FFF3E0", color: "#FF8C00" },
      read: { bg: "#F0FDF4", color: "#16A34A" },
      replied: { bg: "#EFF6FF", color: "#2563EB" },
      archived: { bg: "#F8FAFC", color: "#64748B" },
    };
    const s = map[status] || map.read;
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
        style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F5F9" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 style={{ fontWeight: 800, fontSize: "1.625rem", color: "#0F172A", fontFamily: "Montserrat, Inter, sans-serif" }}>
            Delivery Dashboard
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage your assigned delivery orders.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ backgroundColor: "#E2E8F0" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? "#ffffff" : "transparent",
                color: activeTab === tab.id ? "#FF8C00" : "#64748B",
                border: "none",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>
              {tab.icon}
              {tab.label}
              {tab.id === "notifications" && unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center"
                  style={{ backgroundColor: "#FF8C00", fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard icon={<Package size={22} />} label="Total Orders" value={totalOrders} color="#2563EB" bg="#EFF6FF" />
              <StatCard icon={<Clock size={22} />} label="Pending" value={pendingOrders} color="#FF8C00" bg="#FFF3E0" />
              <StatCard icon={<CheckCircle size={22} />} label="Delivered" value={deliveredOrders} color="#16A34A" bg="#F0FDF4" />
            </div>

            <div className="rounded-2xl shadow-sm overflow-hidden"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                <h2 style={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem" }}>Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                      {["Order ID", "Customer", "Destination", "Total", "Status"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs uppercase tracking-wider"
                          style={{ color: "#94A3B8", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 4).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}>
                        <td className="px-6 py-4 text-sm" style={{ color: "#94A3B8", fontWeight: 500 }}>{order.id}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{order.customer}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#334155" }}>{order.destination}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{order.total}</td>
                        <td className="px-6 py-4">{orderStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="rounded-2xl shadow-sm overflow-hidden"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(15,23,42,0.06)" }}>
              <h2 style={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem" }}>Assigned Orders</h2>
              <span className="text-sm" style={{ color: "#64748B" }}>{orders.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.06)", backgroundColor: "#F8FAFC" }}>
                    {["Order ID", "Customer", "Destination", "Items", "Total", "Date", "Status", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider"
                        style={{ color: "#94A3B8", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}>
                      <td className="px-5 py-4 text-xs" style={{ color: "#94A3B8", fontWeight: 500 }}>{order.id}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{order.customer}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#334155", maxWidth: "8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.destination}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: "#64748B", maxWidth: "8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.items}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{order.total}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#64748B" }}>{order.date}</td>
                      <td className="px-5 py-4">{orderStatusBadge(order.status)}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white transition-all"
                          style={{ backgroundColor: "#0F172A", border: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#334155")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0F172A")}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2 flex-wrap">
                {["all", "unread", "read", "replied", "archived"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setNotifFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all capitalize"
                    style={{
                      backgroundColor: notifFilter === f ? "#FF8C00" : "#ffffff",
                      color: notifFilter === f ? "white" : "#64748B",
                      border: `1px solid ${notifFilter === f ? "#FF8C00" : "#E2E8F0"}`,
                    }}>
                    {f}
                    {f === "unread" && unreadCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => setClearAllModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white"
                style={{ backgroundColor: "#EF4444", border: "none" }}>
                <Trash2 size={12} /> Clear All
              </button>
            </div>

            <div className="rounded-2xl shadow-sm overflow-hidden"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#94A3B8" }}>
                  <Bell size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p className="text-sm">No {notifFilter !== "all" ? notifFilter : ""} notifications</p>
                </div>
              ) : (
                filteredNotifs.map((notif, idx) => (
                  <div key={notif.id} className="p-5 transition-colors"
                    style={{
                      borderBottom: idx < filteredNotifs.length - 1 ? "1px solid rgba(15,23,42,0.05)" : "none",
                      backgroundColor: notif.status === "unread" ? "#FFFBF0" : "transparent",
                    }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: notif.status === "unread" ? "#FFF3E0" : "#F8FAFC" }}>
                        <Truck size={18} style={{ color: notif.status === "unread" ? "#FF8C00" : "#94A3B8" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A" }}>{notif.title}</p>
                            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{notif.body}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notifStatusBadge(notif.status)}
                            <span className="text-xs" style={{ color: "#94A3B8" }}>{notif.time}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <input
                            className="flex-1 min-w-32 px-3 py-1.5 rounded-lg text-xs outline-none border"
                            style={{ borderColor: "#E2E8F0", color: "#334155" }}
                            placeholder="Write a reply..."
                            value={replyInput[notif.id] || ""}
                            onChange={(e) => setReplyInput((prev) => ({ ...prev, [notif.id]: e.target.value }))}
                          />
                          <button onClick={() => sendReply(notif.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white"
                            style={{ backgroundColor: "#2563EB", border: "none" }}>
                            <Reply size={11} /> Reply
                          </button>
                          {notif.status === "unread" && (
                            <button onClick={() => markRead(notif.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                              style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "none" }}>
                              <Check size={11} /> Read
                            </button>
                          )}
                          {notif.status !== "archived" && (
                            <button onClick={() => archiveNotif(notif.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                              style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
                              <Archive size={11} /> Archive
                            </button>
                          )}
                          <button onClick={() => setDeleteModal(notif.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "none" }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {deleteModal && <DeleteConfirm onConfirm={() => deleteNotif(deleteModal)} onCancel={() => setDeleteModal(null)} />}
      {clearAllModal && (
        <ClearAllConfirm
          onConfirm={() => { setNotifications([]); setClearAllModal(false); }}
          onCancel={() => setClearAllModal(false)}
        />
      )}
    </div>
  );
};

export default DeliverDashboard;
