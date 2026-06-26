import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart2, ShoppingCart, Bell, ChevronDown, Search, Eye, X,
  AlertTriangle, CheckCircle, Truck, Package, TrendingUp, TrendingDown,
  User, ExternalLink, Menu, Archive, Trash2, Reply, Map, List,
  Phone, MapPin, Calendar, UserPlus, LogOut
} from "lucide-react";
import "../../styles/admin-dashboard.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons (Vite/Webpack path issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Colored markers by status
const STATUS_COLORS = {
  "In Progress": "#3b82f6",   // blue
  "Delivered":   "#22c55e",   // green
  "Pending":     "#eab308",   // yellow
};

function makeColoredIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 26 14 26S28 23.63 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
  });
}

// ─── API Helpers ──────────────────────────────────────────────────────────────
const BASE = "http://127.0.0.1:8000";

function authHeader() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, opts = {}) {
  const { headers: optHeaders, ...restOpts } = opts;
  let headers = { ...authHeader(), ...optHeaders };
  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  let res = await fetch(`${BASE}${path}`, {
    headers,
    ...restOpts,
  });
  
  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      try {
        const refreshRes = await fetch(`${BASE}/api/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("access", refreshData.access);
          
          // Retry with new token
          headers = { ...headers, Authorization: `Bearer ${refreshData.access}` };
          res = await fetch(`${BASE}${path}`, {
            headers,
            ...restOpts,
          });
        } else {
          localStorage.clear();
          window.location.href = "/login";
          throw new Error("Session expired. Please log in again.");
        }
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        throw err;
      }
    } else {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
  }
  
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

// ─── Delivery Map View ────────────────────────────────────────────────────────
function DeliveryMapView({ orders, handleDelivered, handleAccept, setViewOrder, actionLoading, username }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [geocodeCache, setGeocodeCache] = useState({});
  const [resolvedCoords, setResolvedCoords] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [hiddenOrderIds, setHiddenOrderIds] = useState([]);

  const visibleOrders = orders.filter(o => !hiddenOrderIds.includes(o.id));
  const hasFitBoundsRef = useRef(false);
  const visibleOrdersKey = visibleOrders.map(o => o.id).join(",");

  useEffect(() => {
    hasFitBoundsRef.current = false;
  }, [visibleOrdersKey]);

  // Geocode an address string → { lat, lng }
  const geocodeAddress = async (address) => {
    if (!address) return null;
    if (geocodeCache[address]) return geocodeCache[address];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setGeocodeCache(prev => ({ ...prev, [address]: coords }));
        return coords;
      }
    } catch { /* silent */ }
    return null;
  };

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { center: [3.848, 11.502], zoom: 12, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // 1. Geocode all orders sequentially, updating resolvedCoords state
  useEffect(() => {
    let active = true;
    
    const resolveAll = async () => {
      const newResolved = { ...resolvedCoords };
      let changed = false;
      let hasUnresolvedAddress = false;

      for (const order of visibleOrders) {
        const orderId = order.id;
        if (newResolved[orderId]) continue; // already resolved

        if (order.gps_location && typeof order.gps_location === 'object' && order.gps_location.lat && order.gps_location.lng) {
          newResolved[orderId] = {
            lat: parseFloat(order.gps_location.lat),
            lng: parseFloat(order.gps_location.lng)
          };
          changed = true;
        } else {
          const addr = order.customer_address || order.delivery_address;
          if (addr) {
            if (geocodeCache[addr]) {
              newResolved[orderId] = geocodeCache[addr];
              changed = true;
            } else {
              hasUnresolvedAddress = true;
            }
          }
        }
      }

      if (changed && active) {
        setResolvedCoords(newResolved);
      }

      // If there are unresolved addresses, geocode them sequentially with a rate limit delay
      if (hasUnresolvedAddress) {
        setGeocoding(true);
        for (const order of visibleOrders) {
          if (!active) return;
          const orderId = order.id;
          if (newResolved[orderId]) continue;

          const addr = order.customer_address || order.delivery_address;
          if (addr && !geocodeCache[addr]) {
            // Respect rate limit: wait 1 second
            await new Promise(r => setTimeout(r, 1000));
            if (!active) return;
            const coords = await geocodeAddress(addr);
            if (coords) {
              newResolved[orderId] = coords;
              setResolvedCoords(prev => ({ ...prev, [orderId]: coords }));
            }
          }
        }
        setGeocoding(false);
      }
    };

    resolveAll();
    return () => { active = false; };
  }, [visibleOrders, geocodeCache]);

  // 2. Synchronously draw markers based on resolvedCoords
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const bounds = [];
    const groups = {};

    for (const order of visibleOrders) {
      const orderId = order.id;
      const coords = resolvedCoords[orderId];
      if (!coords) continue;

      const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
      if (!groups[key]) {
        groups[key] = { coords, orders: [] };
      }
      groups[key].orders.push(order);
    }

    for (const [key, group] of Object.entries(groups)) {
      const { coords, orders: groupOrders } = group;
      bounds.push([coords.lat, coords.lng]);

      let color = "#6b7280";
      const statuses = groupOrders.map(o => o.status);
      if (statuses.includes("Pending")) {
        color = STATUS_COLORS["Pending"];
      } else if (statuses.includes("In Progress")) {
        color = STATUS_COLORS["In Progress"];
      } else if (statuses.includes("Delivered")) {
        color = STATUS_COLORS["Delivered"];
      }

      const marker = L.marker([coords.lat, coords.lng], { icon: makeColoredIcon(color) });
      marker.on("click", () => {
        setSelectedGroup({ coords, orders: groupOrders });
        const map = mapInstanceRef.current;
        if (map) {
          const zoom = map.getZoom() || 13;
          const offset = 0.08 / Math.pow(2, zoom - 10);
          map.setView([coords.lat + offset, coords.lng], zoom);
        }
      });
      marker.addTo(map);
      markersRef.current.push(marker);
    }

    if (bounds.length > 0 && !hasFitBoundsRef.current) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        hasFitBoundsRef.current = true;
      } catch { /* ignore */ }
    }
  }, [visibleOrders, resolvedCoords]);

  // Invalidate map size after mount (sidebar may cause sizing issues)
  useEffect(() => {
    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
  }, []);

  const formattedDate = (d) => {
    if (!d) return "—";
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleSidePanelClick = async (order) => {
    setSelectedGroup(null); // Close any open details overlay first
    const orderId = order.id;
    let coords = resolvedCoords[orderId];

    if (!coords) {
      if (order.gps_location && typeof order.gps_location === 'object' && order.gps_location.lat && order.gps_location.lng) {
        coords = {
          lat: parseFloat(order.gps_location.lat),
          lng: parseFloat(order.gps_location.lng)
        };
      } else {
        const addr = order.customer_address || order.delivery_address;
        if (addr) {
          coords = await geocodeAddress(addr);
        }
      }
      if (coords) {
        setResolvedCoords(prev => ({ ...prev, [orderId]: coords }));
      }
    }

    if (coords) {
      const map = mapInstanceRef.current;
      if (map) {
        map.setView([coords.lat, coords.lng], 14);
      }
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 130px)", gap: 0, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.10)", border: "1px solid #e5e7eb" }}>
      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Geocoding spinner */}
        {geocoding && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#6b7280", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", zIndex: 900 }}>
            📍 Locating orders...
          </div>
        )}

        {/* Legend */}
        <div style={{ position: "absolute", bottom: 16, left: 16, background: "white", borderRadius: 10, padding: "10px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.13)", zIndex: 900, fontSize: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9ca3af", marginBottom: 6 }}>LEGEND</p>
          {Object.entries(STATUS_COLORS).map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "#374151" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Premium Scrollable Grouped Orders Popup Card */}
        {selectedGroup && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "white", borderRadius: 20, padding: "20px 24px", width: 330,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)", zIndex: 1000,
            border: "1px solid #f3f4f6",
            display: "flex", flexDirection: "column"
          }}>
            {/* Top Close X */}
            <button 
              onClick={() => setSelectedGroup(null)} 
              style={{ 
                position: "absolute", top: 16, right: 16, 
                background: "none", border: "none", cursor: "pointer", 
                color: "#9ca3af", padding: 4, zIndex: 1001 
              }}
            >
              <X size={16} />
            </button>

            {/* Scrollable Container */}
            <div style={{ 
              maxHeight: 380, overflowY: "auto", 
              display: "flex", flexDirection: "column", gap: 20,
              paddingRight: 4
            }}>
              {selectedGroup.orders.map((ord, idx) => {
                let badgeBg = "#fffbeb";
                let badgeColor = "#d97706";
                let badgeBorder = "#fef3c7";
                if (ord.status === "In Progress") {
                  badgeBg = "#eff6ff";
                  badgeColor = "#1d4ed8";
                  badgeBorder = "#dbeafe";
                } else if (ord.status === "Delivered") {
                  badgeBg = "#ecfdf5";
                  badgeColor = "#047857";
                  badgeBorder = "#d1fae5";
                }

                const price = Number(ord.total_price || 0).toLocaleString();
                const phoneVal = ord.customer_phone || "+237 681 567 890";
                const addrVal = ord.customer_address || ord.delivery_address || "No address";
                const itemsVal = (ord.items || []).map(i => `${i.product_name} x${i.quantity}`).join(", ") || "—";
                const dateVal = formattedDate(ord.created_at);

                return (
                  <div key={ord.id} style={{
                    display: "flex", flexDirection: "column", gap: 12,
                    borderBottom: idx < selectedGroup.orders.length - 1 ? "1px solid #f3f4f6" : "none",
                    paddingBottom: idx < selectedGroup.orders.length - 1 ? 20 : 0
                  }}>
                    {/* Header: ID and Status badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>
                        #{(ord.id || ord._id || "").slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`,
                        borderRadius: 20, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 600
                      }}>
                        {ord.status}
                      </span>
                    </div>

                    {/* Customer Name */}
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "2px 0 0" }}>
                      {ord.customer_username}
                    </h3>

                    {/* Info list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: "#4b5563" }}>
                        <Phone size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        <span>{phoneVal}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: "#4b5563" }}>
                        <MapPin size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        <span>{addrVal}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: "#4b5563" }}>
                        <Package size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        <span>{itemsVal}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: "#4b5563" }}>
                        <Calendar size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        <span>{dateVal}</span>
                      </div>
                    </div>

                    {/* Price and Button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                        {price} FCFA
                      </span>
                      <div>
                        {ord.status === "Pending" && (
                          <button
                            onClick={() => {
                              handleAccept(ord.id ?? ord._id);
                              ord.status = "In Progress";
                              ord.assigned_agent = "You";
                              setSelectedGroup({ ...selectedGroup });
                            }}
                            disabled={actionLoading}
                            style={{
                              background: "#f97316", color: "white", border: "none",
                              borderRadius: 10, padding: "8px 16px", fontWeight: 700,
                              fontSize: "0.82rem", cursor: "pointer", boxShadow: "0 2px 4px rgba(249,115,22,0.15)"
                            }}
                          >
                            Claim Order
                          </button>
                        )}
                        {ord.status === "In Progress" && (ord.assigned_agent === "You" || ord.assigned_agent === username) && (
                          <button
                            onClick={() => {
                              handleDelivered(ord.id ?? ord._id);
                              ord.status = "Delivered";
                              setSelectedGroup({ ...selectedGroup });
                            }}
                            disabled={actionLoading}
                            style={{
                              background: "#00c05b", color: "white", border: "none",
                              borderRadius: 10, padding: "8px 16px", fontWeight: 700,
                              fontSize: "0.82rem", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,192,91,0.15)"
                            }}
                          >
                            Mark Delivered
                          </button>
                        )}
                        {ord.status === "Delivered" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>
                            <span style={{ fontSize: "1.05rem" }}>✓</span> Completed
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Details link */}
                    <div style={{ textAlign: "center", marginTop: 4 }}>
                      <button
                        onClick={() => { setViewOrder(ord); setSelectedGroup(null); }}
                        style={{
                          background: "none", border: "none", color: "#f97316",
                          fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 4
                        }}
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right side order list panel */}
      <div style={{ width: 280, background: "white", borderLeft: "1px solid #e5e7eb", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", margin: 0 }}>Orders ({visibleOrders.length})</p>
        </div>
        <div style={{ padding: "8px 0" }}>
          {visibleOrders.map(order => {
            const color = STATUS_COLORS[order.status] || "#6b7280";
            const isSelected = selectedGroup?.orders?.some(o => o.id === order.id);
            return (
              <div
                key={order.id}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px", background: isSelected ? "#fff7ed" : "transparent",
                  borderBottom: "1px solid #f3f4f6",
                  transition: "background 0.15s",
                }}
              >
                <button
                  onClick={() => handleSidePanelClick(order)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 10,
                    background: "none", border: "none", padding: 0,
                    cursor: "pointer", textAlign: "left", minWidth: 0
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.82rem", color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.customer_username}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.customer_address || "No address"}
                    </p>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", margin: "2px 0 0" }}>
                      {Number(order.total_price || 0).toLocaleString()} FCFA
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiddenOrderIds(prev => [...prev, order.id]);
                    if (selectedGroup) {
                      const remaining = selectedGroup.orders.filter(o => o.id !== order.id);
                      if (remaining.length === 0) {
                        setSelectedGroup(null);
                      } else {
                        setSelectedGroup({ ...selectedGroup, orders: remaining });
                      }
                    }
                  }}
                  title="Remove from map view"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#9ca3af", padding: "4px 8px", display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: 4, transition: "color 0.15s, background 0.15s"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {visibleOrders.length === 0 && (
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.82rem", padding: "2rem 1rem" }}>No orders to display</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({
  loading,
  filteredOrders,
  allOrders,
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
  const [viewMode, setViewMode] = useState("list"); // "list" | "map"

  return (
    <div className="adm-space-5">
      {/* Header controls */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-section-title">Order Management</h1>
          <p className="adm-section-sub">Track and claim customer shipments.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* List / Map toggle */}
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                background: viewMode === "list" ? "white" : "transparent",
                color: viewMode === "list" ? "#111827" : "#6b7280",
                boxShadow: viewMode === "list" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.15s",
              }}
            >
              <List size={13} /> List View
            </button>
            <button
              onClick={() => setViewMode("map")}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                background: viewMode === "map" ? "white" : "transparent",
                color: viewMode === "map" ? "#111827" : "#6b7280",
                boxShadow: viewMode === "map" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.15s",
              }}
            >
              <Map size={13} /> Map View
            </button>
          </div>

          {/* Search & filter — only in list mode */}
          {viewMode === "list" && (
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
          )}
        </div>
      </div>

      {/* ── MAP VIEW ── */}
      {viewMode === "map" && (
        <DeliveryMapView
          orders={allOrders}
          handleDelivered={handleDelivered}
          handleAccept={handleAccept}
          setViewOrder={setViewOrder}
          actionLoading={actionLoading}
          username={username}
        />
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
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
      )}
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
                      padding: "0 0.875rem",
                      backgroundColor: "transparent",
                      border: "1px solid #fee2e2",
                      color: "#ef4444",
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
                      e.currentTarget.style.backgroundColor = "#fef2f2";
                      e.currentTarget.style.borderColor = "#fca5a5";
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "#fee2e2";
                    }}
                    title="Delete Notification"
                  >
                    <Trash2 size={13} /> Delete
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
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Local static/interactive Notifications state
  const [localNotifications, setLocalNotifications] = useState([]);
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
    if (token) {
      fetch("http://127.0.0.1:8000/api/notifications/my/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => {
          const mapped = data.map(n => ({
            id: n.id,
            title: n.notif_type === "new_request" ? "New Service Request" : (n.notif_type === "order_assigned" ? "New Order Assigned" : "System Notification"),
            message: n.message,
            notif_type: n.notif_type || "general",
            status: n.is_read ? "read" : "unread",
            time: new Date(n.created_at).toLocaleDateString(),
            replyText: "",
          }));
          setLocalNotifications(mapped);
        })
        .catch(() => {});
    }
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
    if (token) {
      fetch("http://127.0.0.1:8000/api/notifications/mark-all-read/", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(err => console.error(err));
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
    if (token) {
      fetch(`http://127.0.0.1:8000/api/notifications/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(err => console.error(err));
    }
  };

  const handleLocalClearAll = () => {
    setLocalNotifications([]);
    if (token) {
      fetch("http://127.0.0.1:8000/api/notifications/clear/", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(err => console.error(err));
    }
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
                        color: "#3b82f6",
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
            <a href="#" className="adm-active" style={{ color: "#f59e0b", fontWeight: 700 }}>Dashboard</a>
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
            allOrders={orders}
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
