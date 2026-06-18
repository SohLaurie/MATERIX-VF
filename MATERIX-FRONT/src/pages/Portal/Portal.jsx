import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Star, Phone, X, MapPin, Wrench, Zap, HardHat,
  Hammer, ChevronDown, Clock, DollarSign, Radio, Filter,
  MessageSquare, Mail, Image as ImageIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import Navbar from "../../components/Navbar";

const TECHNICIANS = [
  {
    id: "1",
    name: "Marcus Johnson",
    category: "electrician",
    specialty: "Master Electrician",
    rating: 4.9,
    reviews: 127,
    location: "Downtown",
    coverage: "10 km radius",
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format",
    experience: "12 yrs",
    hourlyRate: "$45/hr",
    about: "Certified master electrician with 12 years handling residential, commercial and industrial electrical systems. Specializes in solar panel installations, smart home wiring and EV charging stations.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&h=400&fit=crop&auto=format", caption: "Commercial panel upgrade — 3-phase 400A installation" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format", caption: "Smart home wiring — Yaoundé Villa" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&auto=format", caption: "Office electrical fit-out — 12 workstations" },
    ],
  },
  {
    id: "2",
    name: "David Okafor",
    category: "plumber",
    specialty: "Senior Plumber",
    rating: 4.8,
    reviews: 98,
    location: "Westside",
    coverage: "15 km radius",
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&auto=format",
    experience: "9 yrs",
    hourlyRate: "$38/hr",
    about: "Expert plumber covering full plumbing installations, leak detection, bathroom renovations and water heater setups. Fast emergency response available 7 days a week.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop&auto=format", caption: "Full bathroom renovation — plumbing & fixtures" },
      { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&auto=format", caption: "Water heater installation — 200L tank" },
    ],
  },
  {
    id: "3",
    name: "Sophie Martin",
    category: "carpenter",
    specialty: "Master Carpenter",
    rating: 4.7,
    reviews: 85,
    location: "Northgate",
    coverage: "20 km radius",
    available: false,
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop&auto=format",
    experience: "7 yrs",
    hourlyRate: "$42/hr",
    about: "Creative master carpenter specializing in custom furniture, kitchen cabinetry and wood flooring. Each project is handcrafted to the client's vision with premium local and imported hardwoods.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop&auto=format", caption: "Custom kitchen cabinetry — mahogany finish" },
      { url: "https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=600&h=400&fit=crop&auto=format", caption: "Bespoke dining table — solid oak" },
      { url: "https://images.unsplash.com/photo-1631048835657-928c45894acf?w=600&h=400&fit=crop&auto=format", caption: "Built-in wardrobe system — 3-door sliding" },
    ],
  },
  {
    id: "4",
    name: "James Kariuki",
    category: "mason",
    specialty: "Senior Mason",
    rating: 4.6,
    reviews: 64,
    location: "Eastview",
    coverage: "25 km radius",
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop&auto=format",
    experience: "15 yrs",
    hourlyRate: "$35/hr",
    about: "Highly experienced mason skilled in brick laying, tiling, concrete works and structural repairs. Managed over 60 construction projects ranging from residential homes to commercial foundations.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&auto=format", caption: "Foundation and slab — 4-bedroom residence" },
      { url: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=600&h=400&fit=crop&auto=format", caption: "Decorative brick facade — commercial storefront" },
    ],
  },
  {
    id: "5",
    name: "Amara Diallo",
    category: "electrician",
    specialty: "Electrical Engineer",
    rating: 4.9,
    reviews: 143,
    location: "Central",
    coverage: "30 km radius",
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=300&fit=crop&auto=format",
    experience: "10 yrs",
    hourlyRate: "$55/hr",
    about: "Licensed electrical engineer with deep expertise in industrial control systems, power distribution and renewable energy integration. Available for consultations, design and full installations.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&auto=format", caption: "Industrial control panel — factory automation" },
      { url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop&auto=format", caption: "Solar microgrid — 50kW off-grid system" },
    ],
  },
  {
    id: "6",
    name: "Robert Chen",
    category: "plumber",
    specialty: "Plumbing Specialist",
    rating: 4.5,
    reviews: 52,
    location: "Southpark",
    coverage: "10 km radius",
    available: false,
    imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=300&fit=crop&auto=format",
    experience: "6 yrs",
    hourlyRate: "$32/hr",
    about: "Reliable plumber focused on residential repairs, pipe fitting and drainage solutions. Trusted by over 200 homeowners for quick, clean and affordable work.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e12dea?w=600&h=400&fit=crop&auto=format", caption: "Under-sink pipe replacement and drainage fix" },
    ],
  },
  {
    id: "7",
    name: "Fatima Ndiaye",
    category: "carpenter",
    specialty: "Furniture Expert",
    rating: 4.8,
    reviews: 76,
    location: "Harbor",
    coverage: "18 km radius",
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=300&fit=crop&auto=format",
    experience: "8 yrs",
    hourlyRate: "$40/hr",
    about: "Artisan carpenter crafting luxury furniture and interior wood elements. Expert in joinery, veneering and restoration of antique furniture pieces.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop&auto=format", caption: "Custom living room furniture set" },
      { url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=400&fit=crop&auto=format", caption: "Bedroom set — walnut veneer finish" },
      { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop&auto=format", caption: "Built-in bookshelf — floor to ceiling" },
    ],
  },
  {
    id: "8",
    name: "Emmanuel Toko",
    category: "mason",
    specialty: "Construction Expert",
    rating: 4.7,
    reviews: 89,
    location: "Uptown",
    coverage: "22 km radius",
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop&auto=format",
    experience: "11 yrs",
    hourlyRate: "$37/hr",
    about: "Versatile construction expert handling masonry, tiling, plastering and structural reinforcements. Known for precision work and on-time project delivery.",
    portfolio: [
      { url: "https://images.unsplash.com/photo-1590644365607-5f7be0cff9d6?w=600&h=400&fit=crop&auto=format", caption: "Terrace tiling — 120m² premium ceramic" },
      { url: "https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?w=600&h=400&fit=crop&auto=format", caption: "Retaining wall and landscaping — residential" },
    ],
  },
];

const CATEGORY_META = {
  plumber:     { label: "Plumber",     color: "#2563EB", bg: "#EFF6FF", icon: <Wrench size={11} /> },
  electrician: { label: "Electrician", color: "#FF8C00", bg: "#FFF3E0", icon: <Zap size={11} /> },
  carpenter:   { label: "Carpenter",   color: "#16A34A", bg: "#F0FDF4", icon: <Hammer size={11} /> },
  mason:       { label: "Mason",       color: "#7C3AED", bg: "#F5F3FF", icon: <HardHat size={11} /> },
};

const getCategoryMeta = (category) => {
  const key = (category || "").toLowerCase();
  return CATEGORY_META[key] || {
    label: category ? (category.charAt(0).toUpperCase() + category.slice(1)) : "Technician",
    color: "#4B5563",
    bg: "#F3F4F6",
    icon: <Wrench size={11} />
  };
};

/* ── Contact / Request Form Modal ── */
function ContactModal({ tech, onClose }) {
  const meta = getCategoryMeta(tech.category);
  const [form, setForm] = useState({
    clientName: localStorage.getItem("username") || "",
    description: "",
    contactMethod: "phone",
    phone: "",
    email: "",
    preferredDate: "",
    urgency: "normal"
  });
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);

    const payload = {
      technician_id: tech.id,
      client_name: form.clientName || "Anonymous Client",
      contact: form.contactMethod === "email" ? form.email : form.phone,
      preferred_method: form.contactMethod,
      message: `[Urgency: ${form.urgency.toUpperCase()}] [Preferred Date: ${form.preferredDate || "Any"}] ${form.description}`,
      location: tech.location || ""
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/portal/requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSent(true);
      } else {
        alert("Failed to send request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-4 animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#0F172A" }}>
          <div>
            <p style={{ color: "#94A3B8", fontSize: "0.75rem" }}>Send Request to</p>
            <h3 style={{ color: "#FACC15", fontWeight: 700, fontSize: "1.0625rem", fontFamily: "Montserrat, Inter, sans-serif" }}>{tech.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "white" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-14 px-8 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#F0FDF4" }}>
              <MessageSquare size={28} style={{ color: "#22C55E" }} />
            </div>
            <h4 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F172A", marginBottom: "0.5rem" }}>Request Sent!</h4>
            <p style={{ color: "#64748B", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Your request has been sent to <strong>{tech.name}</strong>. They will reach out via your preferred contact method shortly.
            </p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ backgroundColor: "#FF8C00", border: "none" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 flex flex-col gap-4">
            {/* Full Name */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>
                Your Full Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. John Doe"
                value={form.clientName}
                onChange={e => setForm({ ...form, clientName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
                onFocus={e => { e.target.style.borderColor = "#FF8C00"; e.target.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Project description */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>
                Project / Repair Description <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what you need done — e.g. 'Fix a leaking pipe under the kitchen sink', 'Install 5 new power outlets in the living room'..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC", resize: "vertical" }}
                onFocus={e => { e.target.style.borderColor = "#FF8C00"; e.target.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>Urgency</label>
              <div className="flex gap-2">
                {[{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }, { value: "emergency", label: "Emergency" }].map(u => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setForm({ ...form, urgency: u.value })}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all"
                    style={{
                      backgroundColor: form.urgency === u.value ? (u.value === "emergency" ? "#FEF2F2" : u.value === "urgent" ? "#FFF3E0" : "#F0FDF4") : "#F8FAFC",
                      borderColor: form.urgency === u.value ? (u.value === "emergency" ? "#EF4444" : u.value === "urgent" ? "#FF8C00" : "#22C55E") : "#E2E8F0",
                      color: form.urgency === u.value ? (u.value === "emergency" ? "#DC2626" : u.value === "urgent" ? "#FF8C00" : "#16A34A") : "#64748B",
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred date */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>Preferred Date</label>
              <input
                type="date"
                value={form.preferredDate}
                onChange={e => setForm({ ...form, preferredDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all cursor-pointer"
                style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
                onFocus={e => { e.target.style.borderColor = "#FF8C00"; e.target.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Contact method */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>
                Preferred Contact Method <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { value: "phone", label: "Phone Call", icon: <Phone size={14} /> },
                  { value: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={14} /> },
                  { value: "email", label: "Email", icon: <Mail size={14} /> },
                ].map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm({ ...form, contactMethod: m.value })}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border cursor-pointer transition-all"
                    style={{
                      backgroundColor: form.contactMethod === m.value ? "#FFF3E0" : "#F8FAFC",
                      borderColor: form.contactMethod === m.value ? "#FF8C00" : "#E2E8F0",
                      color: form.contactMethod === m.value ? "#FF8C00" : "#64748B",
                    }}
                  >
                    {m.icon}
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600 }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Contact detail input */}
              {form.contactMethod === "email" ? (
                <input
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
                  onFocus={e => { e.target.style.borderColor = "#FF8C00"; e.target.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                />
              ) : (
                <input
                  required
                  type="tel"
                  placeholder={form.contactMethod === "whatsapp" ? "WhatsApp number e.g. +237 6XX XXX XXX" : "Phone number e.g. +237 6XX XXX XXX"}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
                  onFocus={e => { e.target.style.borderColor = "#FF8C00"; e.target.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                />
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all mt-1"
              style={{ backgroundColor: isSending ? "#FFB84D" : "#FF8C00", border: "none" }}
              onMouseEnter={e => { if (!isSending) e.currentTarget.style.backgroundColor = "#E67E00"; }}
              onMouseLeave={e => { if (!isSending) e.currentTarget.style.backgroundColor = "#FF8C00"; }}
            >
              {isSending ? "Sending Request..." : `Send Request to ${tech.name.split(" ")[0]}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Portfolio image slider ── */
function PortfolioSlider({ items }) {
  const [idx, setIdx] = useState(0);
  if (!items || items.length === 0) return null;
  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setIdx(i => (i + 1) % items.length);
  return (
    <div>
      <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img src={items[idx].url} alt={items[idx].caption} className="w-full h-full object-cover" />
        {items.length > 1 && (
          <>
            <button type="button" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: "rgba(15,23,42,0.55)", border: "none", color: "white", backdropFilter: "blur(4px)" }}>
              <ChevronLeft size={14} />
            </button>
            <button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: "rgba(15,23,42,0.55)", border: "none", color: "white", backdropFilter: "blur(4px)" }}>
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {items.map((_, i) => (
                <button key={i} type="button" onClick={() => setIdx(i)} className="w-1.5 h-1.5 rounded-full cursor-pointer" style={{ backgroundColor: i === idx ? "#FF8C00" : "rgba(255,255,255,0.5)", border: "none", padding: 0 }} />
              ))}
            </div>
          </>
        )}
      </div>
      <p className="mt-2 text-xs" style={{ color: "#64748B", fontStyle: "italic" }}>{items[idx].caption}</p>
      
      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {items.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all p-0"
              style={{
                border: i === idx ? "2px solid #FF8C00" : "2px solid rgba(15,23,42,0.06)",
                boxShadow: i === idx ? "0 0 0 2px rgba(255,140,0,0.2)" : "none",
              }}
            >
              <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detail Modal ── */
function DetailModal({ tech, onClose, onContact }) {
  const meta = getCategoryMeta(tech.category);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl my-4 animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
        {/* Hero image */}
        <div className="relative h-44">
          <img src={tech.imageUrl} alt={tech.name} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.85) 40%, transparent)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
            <X size={16} />
          </button>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <h3 style={{ color: "white", fontWeight: 800, fontSize: "1.25rem", fontFamily: "Montserrat, Inter, sans-serif" }}>{tech.name}</h3>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem" }}>{tech.specialty}</p>
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: "65vh" }}>
          {/* Key stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Star size={15} fill="#FACC15" style={{ color: "#FACC15" }} />, value: `${tech.rating}`, sub: `${tech.reviews} reviews` },
              { icon: <DollarSign size={15} style={{ color: "#FF8C00" }} />, value: tech.hourlyRate, sub: "Hourly rate" },
              { icon: <Clock size={15} style={{ color: "#2563EB" }} />, value: tech.experience, sub: "Experience" },
              { icon: <Radio size={15} style={{ color: "#16A34A" }} />, value: tech.coverage, sub: "Coverage" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)" }}>
                <div className="mb-1">{s.icon}</div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A" }}>{s.value}</p>
                <p style={{ fontSize: "0.625rem", color: "#94A3B8", marginTop: "1px" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Availability + location */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: tech.available ? "#F0FDF4" : "#FEF2F2", color: tech.available ? "#16A34A" : "#DC2626" }}>
              ● {tech.available ? "Available Now" : "Currently Busy"}
            </span>
            <span className="flex items-center gap-1 text-sm" style={{ color: "#64748B" }}>
              <MapPin size={13} style={{ color: "#FF8C00" }} /> {tech.location}
            </span>
          </div>

          {/* About */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A", marginBottom: "0.5rem" }}>About</h4>
            <p style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.7 }}>{tech.about}</p>
          </div>

          {/* Portfolio */}
          {tech.portfolio && tech.portfolio.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={14} style={{ color: "#FF8C00" }} />
                <h4 style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A" }}>Portfolio ({tech.portfolio.length} photo{tech.portfolio.length > 1 ? "s" : ""})</h4>
              </div>
              <PortfolioSlider items={tech.portfolio} />
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { onClose(); onContact(); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#FF8C00", border: "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E67E00")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FF8C00")}
            >
              <Phone size={14} />Contact Now
            </button>
            <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer border transition-all" style={{ borderColor: "#E2E8F0", color: "#64748B", backgroundColor: "transparent" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Portal() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [detailTech, setDetailTech] = useState(null);
  const [contactTech, setContactTech] = useState(null);

  // Real database technicians loaded from the API
  const [technicians, setTechnicians] = useState(TECHNICIANS);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/portal/technicians/")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          // Normalize paths for images
          const formatted = data.map(t => ({
            ...t,
            imageUrl: t.image ? (t.image.startsWith('http') ? t.image : `http://127.0.0.1:8000${t.image}`) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=300&fit=crop&auto=format",
            portfolio: (t.portfolio || []).map(p => ({
              ...p,
              url: p.url ? (p.url.startsWith('http') ? p.url : `http://127.0.0.1:8000${p.url}`) : p.url
            }))
          }));
          setTechnicians(formatted);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch technicians, using mock fallback:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to parse rates robustly, preventing NaN sorting issues
  const getRate = (rateStr) => {
    if (!rateStr) return 0;
    const num = parseInt(rateStr.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  };

  const filtered = technicians
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = (t.name || "").toLowerCase().includes(q) || 
                          (t.specialty || "").toLowerCase().includes(q) || 
                          (t.category || "").toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || t.category === filterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "reviews") return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === "rate_asc") return getRate(a.hourlyRate) - getRate(b.hourlyRate);
      return (a.name || "").localeCompare(b.name || "");
    });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F5F9" }}>
      <Navbar />

      {/* Page header */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(15,23,42,0.07)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="mb-5">
            <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "#0F172A", fontFamily: "Montserrat, Inter, sans-serif" }}>
              Find a Technician
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Browse certified professionals ready to solve your problems
            </p>
          </div>

          {/* Search row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border transition-all"
                style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
                placeholder="Search by name, specialty or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => { e.target.style.borderColor = "#FF8C00"; e.target.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div className="relative" style={{ minWidth: "160px" }}>
              <select
                className="w-full pl-4 pr-9 py-3 rounded-xl text-sm outline-none border cursor-pointer appearance-none"
                style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="plumber">Plumber</option>
                <option value="electrician">Electrician</option>
                <option value="carpenter">Carpenter</option>
                <option value="mason">Mason</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
              style={{
                backgroundColor: showFilters ? "#FFF3E0" : "#ffffff",
                borderColor: showFilters ? "#FF8C00" : "#E2E8F0",
                color: showFilters ? "#FF8C00" : "#64748B",
              }}
            >
              <Filter size={15} /> <span className="hidden sm:inline">Sort</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 items-center" style={{ borderColor: "rgba(15,23,42,0.07)" }}>
              <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>Sort by:</span>
              {[
                { value: "rating", label: "Top Rated" },
                { value: "reviews", label: "Most Reviews" },
                { value: "rate_asc", label: "Lowest Rate" },
                { value: "name", label: "Name A–Z" }
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all"
                  style={{
                    backgroundColor: sortBy === s.value ? "#FF8C00" : "#ffffff",
                    borderColor: sortBy === s.value ? "#FF8C00" : "#E2E8F0",
                    color: sortBy === s.value ? "white" : "#64748B"
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category pills + count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {["all", "plumber", "electrician", "carpenter", "mason"].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all capitalize border"
              style={{
                backgroundColor: filterCategory === cat ? "#FF8C00" : "#ffffff",
                color: filterCategory === cat ? "white" : "#64748B",
                borderColor: filterCategory === cat ? "#FF8C00" : "#E2E8F0"
              }}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>
          <span style={{ color: "#0F172A", fontWeight: 600 }}>{filtered.length}</span> technician{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        {filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
            <Search size={40} style={{ color: "#CBD5E1", margin: "0 auto 0.75rem" }} />
            <p style={{ color: "#64748B", fontWeight: 500 }}>No technicians found</p>
            <p style={{ color: "#94A3B8", fontSize: "0.8125rem", marginTop: "0.25rem" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in duration-300">
            {filtered.map(tech => {
              const meta = getCategoryMeta(tech.category);
              return (
                <div
                  key={tech.id}
                  className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
                  style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.07)" }}
                >
                  {/* Cover image */}
                  <div className="relative overflow-hidden flex-shrink-0" style={{ height: "160px" }}>
                    <img src={tech.imageUrl} alt={tech.name} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.5) 0%, transparent 60%)" }} />
                    {/* Available badge */}
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: tech.available ? "rgba(22,163,74,0.92)" : "rgba(100,116,139,0.88)", color: "white", backdropFilter: "blur(4px)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      {tech.available ? "Available" : "Busy"}
                    </span>
                    {/* Category */}
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: meta.bg, color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                    {/* Portfolio preview thumbnails */}
                    {tech.portfolio && tech.portfolio.length > 0 && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {tech.portfolio.slice(0, 3).map((p, i) => (
                          <div key={i} className="w-8 h-8 rounded-md overflow-hidden border border-white/50" style={{ borderColor: "rgba(255,255,255,0.5)" }}>
                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }} className="truncate">{tech.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "1px" }}>{tech.specialty}</p>

                    {/* Key info pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "#FFF3E0", color: "#FF8C00", fontWeight: 600 }}>
                        <DollarSign size={10} />{tech.hourlyRate}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" }}>
                        <Clock size={10} />{tech.experience}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" }}>
                        <Radio size={10} />{tech.coverage}
                      </span>
                    </div>

                    {/* Rating + location */}
                    <div className="flex items-center justify-between mt-2.5 mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={12} fill="#FACC15" style={{ color: "#FACC15" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A" }}>{tech.rating}</span>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>({tech.reviews})</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94A3B8" }}>
                        <MapPin size={10} style={{ color: "#CBD5E1" }} />{tech.location}
                      </span>
                    </div>

                    {/* Buttons — pushed to bottom */}
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => setContactTech(tech)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all flex items-center justify-center gap-1"
                        style={{ backgroundColor: "transparent", borderColor: "#FF8C00", color: "#FF8C00" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#FFF3E0")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Phone size={11} />Contact Now
                      </button>
                      <button
                        onClick={() => setDetailTech(tech)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer text-white transition-all"
                        style={{ backgroundColor: "#FF8C00", border: "none" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E67E00")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FF8C00")}
                      >
                        See Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="py-12 text-center" style={{ backgroundColor: "#0F172A" }}>
        <h2 style={{ color: "#FACC15", fontWeight: 700, fontSize: "1.5rem", fontFamily: "Montserrat, Inter, sans-serif" }}>Are you a skilled technician?</h2>
        <p style={{ color: "#94A3B8", marginTop: "0.5rem", fontSize: "0.9rem" }}>Join our platform and grow your client base.</p>
        <button
          onClick={() => navigate("/register?role=technician")}
          className="mt-4 px-8 py-3 rounded-xl font-semibold text-white cursor-pointer transition-all"
          style={{ backgroundColor: "#FF8C00", border: "none" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E67E00")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FF8C00")}
        >
          Register as Technician
        </button>
      </div>

      {/* Modals */}
      {detailTech && (
        <DetailModal
          tech={detailTech}
          onClose={() => setDetailTech(null)}
          onContact={() => {
            setContactTech(detailTech);
            setDetailTech(null);
          }}
        />
      )}
      {contactTech && <ContactModal tech={contactTech} onClose={() => setContactTech(null)} />}
    </div>
  );
}
