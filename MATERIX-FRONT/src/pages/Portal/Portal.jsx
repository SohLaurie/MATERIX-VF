import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Star, Phone, X, MapPin, Wrench, Zap, HardHat,
  Hammer, ChevronDown, Clock, DollarSign, Radio, Filter,
  MessageSquare, Mail, Image as ImageIcon, ChevronLeft, ChevronRight,
  CheckCircle, Shield, Award, ArrowRight,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import "./Portal.css";



/* ─── Category metadata ─────────────────────────────────────────────────── */
const CATEGORY_META = {
  plumber:     { label: "Plumber",     color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: <Wrench size={12} /> },
  electrician: { label: "Electrician", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: <Zap size={12} /> },
  carpenter:   { label: "Carpenter",   color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: <Hammer size={12} /> },
  mason:       { label: "Mason",       color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: <HardHat size={12} /> },
};

const getCategoryMeta = (category) => {
  const key = (category || "").toLowerCase();
  if (key === "other" || key === "others") {
    return { label: "Others", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1", icon: <Wrench size={12} /> };
  }
  return CATEGORY_META[key] || { label: category || "Technician", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1", icon: <Wrench size={12} /> };
};

/* ─── Helper: service label shown under technician name ─────────────────── */
const getDisplayService = (tech) => {
  if (!tech) return "Technician";
  const isOther = (tech.service === "other" || tech.service === "others" || tech.category === "other" || tech.category === "others");
  if (isOther) {
    return tech.custom_service || tech.other_service || tech.specialty || "Specialist";
  }
  if (tech.service) return tech.service.charAt(0).toUpperCase() + tech.service.slice(1);
  // fallback for mock data that only has category
  if (tech.category && tech.category !== "other") return tech.category.charAt(0).toUpperCase() + tech.category.slice(1);
  return tech.specialty || "Technician";
};

/* ─── Helper: coverage from radius field ────────────────────────────────── */
const getCoverage = (tech) => {
  const r = tech.radius || tech.coverage || "";
  if (!r) return "—";
  if (String(r).toLowerCase().includes("km")) return r;
  return `${r} km`;
};

/* ─── Helper: XAF rate (253–346 range for backend techs without a rate) ─── */
const getXAFRate = (tech) => {
  const r = tech.hourlyRate || tech.hourly_rate || "";
  if (r && r.includes("XAF")) return r;
  // For backend technicians, generate a deterministic XAF rate from their ID
  const seed = String(tech.id || "1").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${253 + (seed % 94)} XAF/hr`;
};

/* ─── Stars renderer ────────────────────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} fill={i <= Math.round(rating) ? "#FACC15" : "none"} style={{ color: i <= Math.round(rating) ? "#FACC15" : "#CBD5E1" }} />
      ))}
    </span>
  );
}

/* ─── Portfolio Slider ──────────────────────────────────────────────────── */
function PortfolioSlider({ items }) {
  const [idx, setIdx] = useState(0);
  if (!items || items.length === 0) return null;
  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setIdx(i => (i + 1) % items.length);

  return (
    <div className="portal-slider">
      {/* Main image */}
      <div className="portal-slider-main">
        <img
          src={items[idx].url}
          alt={items[idx].caption}
          className="portal-slider-img"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=700&h=450&fit=crop&auto=format"; }}
        />
        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button type="button" className="portal-slider-btn portal-slider-btn--prev" onClick={prev} aria-label="Previous">
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button type="button" className="portal-slider-btn portal-slider-btn--next" onClick={next} aria-label="Next">
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
            {/* Dot indicators */}
            <div className="portal-slider-dots">
              {items.map((_, i) => (
                <button key={i} type="button" className={`portal-slider-dot ${i === idx ? "portal-slider-dot--active" : ""}`} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
            {/* Counter badge */}
            <span className="portal-slider-counter">{idx + 1} / {items.length}</span>
          </>
        )}
      </div>

      {/* Caption */}
      <p className="portal-slider-caption">
        <ImageIcon size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
        {items[idx].caption}
      </p>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="portal-slider-thumbs">
          {items.map((p, i) => (
            <button key={i} type="button" className={`portal-slider-thumb ${i === idx ? "portal-slider-thumb--active" : ""}`} onClick={() => setIdx(i)} aria-label={`View photo ${i + 1}`}>
              <img src={p.url} alt={p.caption} onError={e => { e.target.src = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=150&fit=crop"; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Detail Modal ──────────────────────────────────────────────────────── */
function DetailModal({ tech, onClose, onContact }) {
  const meta = getCategoryMeta(tech.category);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="portal-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="portal-modal portal-modal--detail">

        {/* ── Hero ── */}
        <div className="portal-modal-hero">
          <img src={tech.imageUrl} alt={tech.name} className="portal-modal-hero-img"
            onError={e => { e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&auto=format"; }} />
          <div className="portal-modal-hero-overlay" />

          {/* Close button */}
          <button className="portal-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>

          {/* Hero info */}
          <div className="portal-modal-hero-info">
            <div>
              <h2 className="portal-modal-hero-name">{tech.name}</h2>
              <p className="portal-modal-hero-specialty">{getDisplayService(tech)}</p>
            </div>
            <span className="portal-cat-badge" style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
              {meta.icon}&nbsp;{meta.label}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="portal-modal-body">

          {/* Stats row */}
          <div className="portal-modal-stats">
            {[
              { icon: <Star size={18} fill="#FACC15" style={{ color: "#FACC15" }} />, value: String(tech.rating), label: `${tech.reviews} reviews` },
              { icon: <DollarSign size={18} style={{ color: "#FF8C00" }} />, value: getXAFRate(tech), label: "Hourly rate" },
              { icon: <Clock size={18} style={{ color: "#2563EB" }} />, value: tech.experience || tech.years_experience || "—", label: "Experience" },
              { icon: <Radio size={18} style={{ color: "#16A34A" }} />, value: getCoverage(tech), label: "Coverage" },
            ].map((s, i) => (
              <div key={i} className="portal-modal-stat">
                <span className="portal-modal-stat-icon">{s.icon}</span>
                <span className="portal-modal-stat-value">{s.value}</span>
                <span className="portal-modal-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Availability + location */}
          <div className="portal-modal-meta-row">
            <span className={`portal-avail-badge ${tech.available ? "portal-avail-badge--available" : "portal-avail-badge--busy"}`}>
              <span className="portal-avail-dot" /> {tech.available ? "Available Now" : "Currently Busy"}
            </span>
            <span className="portal-location-chip">
              <MapPin size={13} style={{ color: "#FF8C00" }} /> {tech.location}
            </span>
          </div>

          {/* Divider */}
          <div className="portal-divider" />

          {/* About */}
          <div className="portal-modal-section">
            <h4 className="portal-modal-section-title">
              <Shield size={15} style={{ color: "#FF8C00" }} /> About
            </h4>
            <p className="portal-modal-about-text">{tech.about || tech.bio}</p>
          </div>

          {/* Specializations — shown below About */}
          {(tech.specializations || tech.specialty) && (
            <div className="portal-modal-section">
              <h4 className="portal-modal-section-title" style={{ marginBottom: 4 }}>
                <Award size={15} style={{ color: "#FF8C00" }} /> Specialization
              </h4>
              <p className="portal-modal-about-text" style={{ fontStyle: "italic", color: "#64748B" }}>
                {tech.specializations || tech.specialty}
              </p>
            </div>
          )}

          {/* Portfolio */}
          {tech.portfolio && tech.portfolio.length > 0 && (
            <div className="portal-modal-section">
              <h4 className="portal-modal-section-title">
                <ImageIcon size={15} style={{ color: "#FF8C00" }} />
                Portfolio
                <span className="portal-modal-section-count">{tech.portfolio.length} photo{tech.portfolio.length > 1 ? "s" : ""}</span>
              </h4>
              <PortfolioSlider items={tech.portfolio} />
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="portal-modal-footer">
          <button className="portal-btn portal-btn--primary portal-btn--flex" onClick={() => { onClose(); onContact(); }}>
            <Phone size={16} /> Contact Now
          </button>
          <button className="portal-btn portal-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Modal ─────────────────────────────────────────────────────── */
function ContactModal({ tech, onClose }) {
  const meta = getCategoryMeta(tech.category);
  const [form, setForm] = useState({
    clientName: localStorage.getItem("username") || "",
    description: "", contactMethod: "phone",
    phone: "", email: "", preferredDate: "", urgency: "normal",
  });
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    const payload = {
      technician_id: tech.id,
      client_name: form.clientName || "Anonymous Client",
      contact: form.contactMethod === "email" ? form.email : form.phone,
      preferred_method: form.contactMethod,
      message: `[Urgency: ${form.urgency.toUpperCase()}] [Preferred Date: ${form.preferredDate || "Any"}] ${form.description}`,
      location: tech.location || "",
    };
    const token = localStorage.getItem("access");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/portal/requests/", { method: "POST", headers, body: JSON.stringify(payload) });
      if (res.ok) setSent(true);
      else alert("Failed to send request. Please try again.");
    } catch { alert("An error occurred. Please try again."); }
    finally { setIsSending(false); }
  };

  return (
    <div className="portal-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="portal-modal portal-modal--contact">

        {/* Header */}
        <div className="portal-contact-header">
          <div className="portal-contact-header-info">
            <img src={tech.imageUrl} alt={tech.name} className="portal-contact-avatar"
              onError={e => { e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format"; }} />
            <div>
              <p className="portal-contact-header-label">Send Request to</p>
              <h3 className="portal-contact-header-name">{tech.name}</h3>
              <span className="portal-cat-badge portal-cat-badge--sm" style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                {meta.icon}&nbsp;{meta.label}
              </span>
            </div>
          </div>
          <button className="portal-modal-close portal-modal-close--dark" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {sent ? (
          /* Success state */
          <div className="portal-contact-success">
            <div className="portal-success-icon">
              <CheckCircle size={40} style={{ color: "#22C55E" }} />
            </div>
            <h4 className="portal-success-title">Request Sent!</h4>
            <p className="portal-success-text">
              Your request has been sent to <strong>{tech.name}</strong>. They will reach out via your preferred contact method shortly.
            </p>
            <button className="portal-btn portal-btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Scrollable form body */}
            <div className="portal-contact-body">

              {/* Name */}
              <div className="portal-form-group">
                <label className="portal-form-label">Your Full Name <span className="portal-required">*</span></label>
                <input required type="text" placeholder="e.g. John Doe" value={form.clientName}
                  onChange={e => setForm({ ...form, clientName: e.target.value })}
                  className="portal-form-input" />
              </div>

              {/* Description */}
              <div className="portal-form-group">
                <label className="portal-form-label">Project / Repair Description <span className="portal-required">*</span></label>
                <textarea required rows={3} placeholder="Describe what you need done — e.g. 'Fix a leaking pipe under the kitchen sink'..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="portal-form-input portal-form-textarea" />
              </div>

              {/* Urgency */}
              <div className="portal-form-group">
                <label className="portal-form-label">Urgency Level</label>
                <div className="portal-urgency-group">
                  {[
                    { v: "normal",    label: "Normal",    color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
                    { v: "urgent",    label: "Urgent",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
                    { v: "emergency", label: "Emergency", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                  ].map(u => (
                    <button key={u.v} type="button" onClick={() => setForm({ ...form, urgency: u.v })}
                      className="portal-urgency-btn"
                      style={form.urgency === u.v ? { backgroundColor: u.bg, borderColor: u.color, color: u.color } : {}}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="portal-form-group">
                <label className="portal-form-label">Preferred Date</label>
                <input type="date" value={form.preferredDate}
                  onChange={e => setForm({ ...form, preferredDate: e.target.value })}
                  className="portal-form-input" />
              </div>

              {/* Contact method */}
              <div className="portal-form-group">
                <label className="portal-form-label">Preferred Contact Method <span className="portal-required">*</span></label>
                <div className="portal-contact-methods">
                  {[
                    { v: "phone", label: "Phone Call", icon: <Phone size={16} /> },
                    { v: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={16} /> },
                    { v: "email", label: "Email", icon: <Mail size={16} /> },
                  ].map(m => (
                    <button key={m.v} type="button" onClick={() => setForm({ ...form, contactMethod: m.v })}
                      className={`portal-method-btn ${form.contactMethod === m.v ? "portal-method-btn--active" : ""}`}>
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
                <input required type={form.contactMethod === "email" ? "email" : "tel"}
                  placeholder={form.contactMethod === "email" ? "your@email.com" : form.contactMethod === "whatsapp" ? "WhatsApp e.g. +237 6XX XXX XXX" : "Phone e.g. +237 6XX XXX XXX"}
                  value={form.contactMethod === "email" ? form.email : form.phone}
                  onChange={e => setForm({ ...form, [form.contactMethod === "email" ? "email" : "phone"]: e.target.value })}
                  className="portal-form-input" style={{ marginTop: 10 }} />
              </div>
            </div>

            {/* Sticky footer */}
            <div className="portal-modal-footer">
              <button type="submit" disabled={isSending} className="portal-btn portal-btn--primary portal-btn--full">
                {isSending ? "Sending..." : `Send Request to ${tech.name.split(" ")[0]}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Technician Card ────────────────────────────────────────────────────── */
function TechCard({ tech, onDetail, onContact }) {
  const meta = getCategoryMeta(tech.category);
  return (
    <div className="portal-tech-card">
      {/* Cover image */}
      <div className="portal-tech-card-cover">
        <img src={tech.imageUrl} alt={tech.name} className="portal-tech-card-img"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&auto=format"; }} />
        <div className="portal-tech-card-overlay" />
        {/* Availability */}
        <span className={`portal-avail-pill ${tech.available ? "portal-avail-pill--available" : "portal-avail-pill--busy"}`}>
          <span className="portal-avail-dot" />{tech.available ? "Available" : "Busy"}
        </span>
        {/* Category */}
        <span className="portal-cat-badge portal-cat-badge--card" style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          {meta.icon}&nbsp;{meta.label}
        </span>
        {/* Portfolio thumbnails */}
        {tech.portfolio && tech.portfolio.length > 1 && (
          <div className="portal-thumb-strip">
            {tech.portfolio.slice(0, 3).map((p, i) => (
              <div key={i} className="portal-thumb-item">
                <img src={p.url} alt="" onError={e => { e.target.src = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200"; }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="portal-tech-card-body">
        <h3 className="portal-tech-card-name">{tech.name}</h3>
        <p className="portal-tech-card-specialty">{getDisplayService(tech)}</p>

        {/* Rating */}
        <div className="portal-tech-card-rating">
          <Stars rating={tech.rating} />
          <span className="portal-rating-value">{tech.rating}</span>
          <span className="portal-rating-count">({tech.reviews})</span>
          <span className="portal-location-text">
            <MapPin size={10} />{tech.location}
          </span>
        </div>

        {/* Info chips */}
        <div className="portal-tech-card-chips">
          <span className="portal-chip portal-chip--rate"><DollarSign size={10} />{getXAFRate(tech)}</span>
          <span className="portal-chip portal-chip--neutral"><Clock size={10} />{tech.experience || tech.years_experience || "—"}</span>
          <span className="portal-chip portal-chip--neutral"><Radio size={10} />{getCoverage(tech)}</span>
        </div>

        {/* Actions */}
        <div className="portal-tech-card-actions">
          <button className="portal-btn portal-btn--outline portal-btn--sm" onClick={() => onContact(tech)}>
            <Phone size={12} /> Contact
          </button>
          <button className="portal-btn portal-btn--primary portal-btn--sm" onClick={() => onDetail(tech)}>
            See Details <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Portal Page ───────────────────────────────────────────────────── */
export default function Portal() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [detailTech, setDetailTech] = useState(null);
  const [contactTech, setContactTech] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/portal/technicians/")
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        setTechnicians((data || []).map(t => ({
          ...t,
          imageUrl: t.image ? (t.image.startsWith("http") ? t.image : `http://127.0.0.1:8000${t.image}`) : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&auto=format",
          portfolio: (t.portfolio || []).map(p => ({ ...p, url: p.url?.startsWith("http") ? p.url : `http://127.0.0.1:8000${p.url}` })),
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRate = (s) => { const n = parseInt((s || "").replace(/[^0-9]/g, ""), 10); return isNaN(n) ? 0 : n; };

  const filtered = technicians
    .filter(t => {
      const q = search.toLowerCase();
      return ((t.name || "").toLowerCase().includes(q) || (t.specialty || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q))
        && (filterCategory === "all" || t.category === filterCategory);
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "reviews") return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === "rate_asc") return getRate(a.hourlyRate) - getRate(b.hourlyRate);
      return (a.name || "").localeCompare(b.name || "");
    });

  const CATS = ["all", "plumber", "electrician", "carpenter", "mason"];

  return (
    <div className="portal-page">
      <Navbar />

      {/* ── Page Header ── */}
      <div className="portal-header-bar">
        <div className="portal-header-inner">
          <div className="portal-header-text">
            <h1 className="portal-page-title">Find a Technician</h1>
            <p className="portal-page-subtitle">Browse certified professionals ready to solve your problems</p>
          </div>

          {/* Search + filters */}
          <div className="portal-search-row">
            <div className="portal-search-wrap">
              <Search size={16} className="portal-search-icon" />
              <input className="portal-search-input" placeholder="Search by name, specialty or category..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="portal-select-wrap">
              <select className="portal-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {CATS.slice(1).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <ChevronDown size={14} className="portal-select-icon" />
            </div>
            <button className={`portal-filter-btn ${showFilters ? "portal-filter-btn--active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={15} /><span>Sort</span>
            </button>
          </div>

          {/* Sort options */}
          {showFilters && (
            <div className="portal-sort-row">
              <span className="portal-sort-label">Sort by:</span>
              {[
                { v: "rating", l: "Top Rated" }, { v: "reviews", l: "Most Reviews" },
                { v: "rate_asc", l: "Lowest Rate" }, { v: "name", l: "Name A–Z" },
              ].map(s => (
                <button key={s.v} onClick={() => setSortBy(s.v)}
                  className={`portal-sort-btn ${sortBy === s.v ? "portal-sort-btn--active" : ""}`}>
                  {s.l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="portal-pills-bar">
        <div className="portal-pills-inner">
          <div className="portal-pills">
            {CATS.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`portal-pill ${filterCategory === cat ? "portal-pill--active" : ""}`}>
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <p className="portal-result-count">
            <span className="portal-result-count-num">{filtered.length}</span> technician{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="portal-grid-wrapper">
        {loading ? (
          <div className="portal-empty">
            <div className="portal-loading-spinner" />
            <p>Loading technicians...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="portal-empty">
            <Search size={44} style={{ color: "#CBD5E1", marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "#475569" }}>No technicians found</p>
            <p style={{ color: "#94A3B8", fontSize: "0.875rem", marginTop: 4 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="portal-grid">
            {filtered.map(tech => (
              <TechCard key={tech.id} tech={tech} onDetail={setDetailTech} onContact={setContactTech} />
            ))}
          </div>
        )}
      </div>

      {/* ── CTA Banner ── */}
      <div className="portal-cta-banner">
        <Award size={32} style={{ color: "#FACC15", marginBottom: 8 }} />
        <h2 className="portal-cta-title">Are you a skilled technician?</h2>
        <p className="portal-cta-sub">Join our platform and grow your client base with verified leads.</p>
        <button className="portal-btn portal-btn--cta" onClick={() => navigate("/register?role=technician")}>
          Register as Technician <ArrowRight size={16} />
        </button>
      </div>

      {/* ── Modals ── */}
      {detailTech && (
        <DetailModal tech={detailTech} onClose={() => setDetailTech(null)}
          onContact={() => { setContactTech(detailTech); setDetailTech(null); }} />
      )}
      {contactTech && <ContactModal tech={contactTech} onClose={() => setContactTech(null)} />}
    </div>
  );
}
