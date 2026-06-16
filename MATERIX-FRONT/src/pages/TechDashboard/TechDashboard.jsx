import React, { useState } from "react";
import {
  BarChart2, CheckCircle, XCircle, Clock, Bell, Inbox,
  Check, X, Reply, Archive, Trash2, AlertTriangle,
} from "lucide-react";
import Navbar from "../../components/Navbar";

const INIT_REQUESTS = [
  { id: "REQ-001", client: "Sarah Mensah", service: "Electrical Installation", date: "Jun 16, 2026", location: "Downtown", status: "pending" },
  { id: "REQ-002", client: "Paul Eze", service: "Wiring Repair", date: "Jun 15, 2026", location: "Westside", status: "pending" },
  { id: "REQ-003", client: "Linda Nkosi", service: "Panel Upgrade", date: "Jun 14, 2026", location: "Northgate", status: "accepted" },
  { id: "REQ-004", client: "Kwame Asante", service: "Emergency Fix", date: "Jun 13, 2026", location: "Central", status: "rejected" },
  { id: "REQ-005", client: "Amara Diallo", service: "Generator Setup", date: "Jun 12, 2026", location: "Harbor", status: "pending" },
  { id: "REQ-006", client: "Victor Obi", service: "Socket Installation", date: "Jun 11, 2026", location: "Eastview", status: "accepted" },
];

const INIT_NOTIFICATIONS = [
  { id: "N1", title: "New Request from Sarah Mensah", body: "Sarah requested Electrical Installation on Jun 16, 2026.", time: "2h ago", status: "unread" },
  { id: "N2", title: "New Request from Paul Eze", body: "Paul requested Wiring Repair on Jun 15, 2026.", time: "5h ago", status: "unread" },
  { id: "N3", title: "Reminder: Pending request REQ-002", body: "You have a pending request awaiting your response.", time: "1d ago", status: "read" },
  { id: "N4", title: "New Request from Amara Diallo", body: "Amara requested Generator Setup on Jun 12, 2026.", time: "2d ago", status: "replied" },
  { id: "N5", title: "System: Profile verified", body: "Your technician profile has been verified by Materix.", time: "3d ago", status: "archived" },
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

function ConfirmModal({ type, requestId, clientName, onConfirm, onCancel }) {
  const isAccept = type === "accept";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-xs rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: isAccept ? "#F0FDF4" : "#FEF2F2" }}>
            {isAccept
              ? <CheckCircle size={22} style={{ color: "#16A34A" }} />
              : <AlertTriangle size={22} style={{ color: "#EF4444" }} />}
          </div>
          <h3 style={{ fontWeight: 700, color: "#0F172A", marginBottom: "0.4rem" }}>
            {isAccept ? "Accept Request" : "Reject Request"}
          </h3>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Are you sure you want to {isAccept ? "accept" : "reject"} the request from{" "}
            <strong>{clientName}</strong>?
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer border"
            style={{ backgroundColor: "transparent", borderColor: "#E2E8F0", color: "#64748B" }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer text-white"
            style={{ backgroundColor: isAccept ? "#16A34A" : "#EF4444", border: "none" }}>
            {isAccept ? "Accept" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
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

const TechDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [requests, setRequests] = useState(INIT_REQUESTS);
  const [notifications, setNotifications] = useState(INIT_NOTIFICATIONS);
  const [confirmModal, setConfirmModal] = useState(null); // { type, id, client }
  const [deleteModal, setDeleteModal] = useState(null);
  const [clearAllModal, setClearAllModal] = useState(false);
  const [replyInput, setReplyInput] = useState({});
  const [notifFilter, setNotifFilter] = useState("all");

  const totalRequests = requests.length;
  const acceptedRequests = requests.filter((r) => r.status === "accepted").length;
  const rejectedRequests = requests.filter((r) => r.status === "rejected").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const filteredNotifs = notifications.filter(
    (n) => notifFilter === "all" || n.status === notifFilter
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart2 size={16} /> },
    { id: "requests", label: "Requests", icon: <Inbox size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  ];

  const handleAccept = (id) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r))
    );
    setConfirmModal(null);
  };

  const handleReject = (id) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
    setConfirmModal(null);
  };

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

  const requestStatusBadge = (status) => {
    const map = {
      pending: { bg: "#FFF3E0", color: "#FF8C00", label: "Pending" },
      accepted: { bg: "#F0FDF4", color: "#16A34A", label: "Accepted" },
      rejected: { bg: "#FEF2F2", color: "#EF4444", label: "Rejected" },
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
            Technician Dashboard
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Welcome back. Here's your activity overview.
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
              }}
            >
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

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<BarChart2 size={22} />} label="Total Requests" value={totalRequests} color="#2563EB" bg="#EFF6FF" />
              <StatCard icon={<CheckCircle size={22} />} label="Accepted" value={acceptedRequests} color="#16A34A" bg="#F0FDF4" />
              <StatCard icon={<XCircle size={22} />} label="Rejected" value={rejectedRequests} color="#EF4444" bg="#FEF2F2" />
              <StatCard icon={<Clock size={22} />} label="Pending" value={pendingRequests} color="#FF8C00" bg="#FFF3E0" />
            </div>

            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                <h2 style={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem" }}>Recent Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                      {["Request ID", "Client", "Service", "Date", "Status"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs uppercase tracking-wider"
                          style={{ color: "#94A3B8", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 4).map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}>
                        <td className="px-6 py-4 text-sm" style={{ color: "#94A3B8", fontWeight: 500 }}>{req.id}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{req.client}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#334155" }}>{req.service}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#64748B" }}>{req.date}</td>
                        <td className="px-6 py-4">{requestStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
              <h2 style={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem" }}>All Requests</h2>
              <span className="text-sm" style={{ color: "#64748B" }}>{requests.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.06)", backgroundColor: "#F8FAFC" }}>
                    {["ID", "Client", "Service", "Location", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider"
                        style={{ color: "#94A3B8", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const isFinal = req.status === "accepted" || req.status === "rejected";
                    return (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}>
                        <td className="px-5 py-4 text-xs" style={{ color: "#94A3B8", fontWeight: 500 }}>{req.id}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{req.client}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#334155" }}>{req.service}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#64748B" }}>{req.location}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#64748B" }}>{req.date}</td>
                        <td className="px-5 py-4">{requestStatusBadge(req.status)}</td>
                        <td className="px-5 py-4">
                          {isFinal ? (
                            <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>—</span>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmModal({ type: "accept", id: req.id, client: req.client })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white"
                                style={{ backgroundColor: "#16A34A", border: "none" }}>
                                <Check size={11} /> Accept
                              </button>
                              <button
                                onClick={() => setConfirmModal({ type: "reject", id: req.id, client: req.client })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white"
                                style={{ backgroundColor: "#EF4444", border: "none" }}>
                                <X size={11} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                        <Bell size={18} style={{ color: notif.status === "unread" ? "#FF8C00" : "#94A3B8" }} />
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

      {confirmModal && (
        <ConfirmModal
          type={confirmModal.type}
          requestId={confirmModal.id}
          clientName={confirmModal.client}
          onConfirm={() =>
            confirmModal.type === "accept"
              ? handleAccept(confirmModal.id)
              : handleReject(confirmModal.id)
          }
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {deleteModal && (
        <DeleteConfirm
          onConfirm={() => deleteNotif(deleteModal)}
          onCancel={() => setDeleteModal(null)}
        />
      )}
      {clearAllModal && (
        <ClearAllConfirm
          onConfirm={() => { setNotifications([]); setClearAllModal(false); }}
          onCancel={() => setClearAllModal(false)}
        />
      )}
    </div>
  );
};

export default TechDashboard;
