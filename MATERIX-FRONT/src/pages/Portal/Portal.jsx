import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, Phone, Info, X, MapPin, Wrench, Zap, HardHat, Hammer } from "lucide-react";
import Navbar from "../../components/Navbar";

const TECHNICIANS = [
  { id: "1", name: "Marcus Johnson", category: "electrician", specialty: "Master Electrician", rating: 4.9, reviews: 127, location: "Downtown", available: true, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format", experience: "12 yrs" },
  { id: "2", name: "David Okafor", category: "plumber", specialty: "Senior Plumber", rating: 4.8, reviews: 98, location: "Westside", available: true, imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&auto=format", experience: "9 yrs" },
  { id: "3", name: "Sophie Martin", category: "carpenter", specialty: "Master Carpenter", rating: 4.7, reviews: 85, location: "Northgate", available: false, imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop&auto=format", experience: "7 yrs" },
  { id: "4", name: "James Kariuki", category: "mason", specialty: "Senior Mason", rating: 4.6, reviews: 64, location: "Eastview", available: true, imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop&auto=format", experience: "15 yrs" },
  { id: "5", name: "Amara Diallo", category: "electrician", specialty: "Electrical Engineer", rating: 4.9, reviews: 143, location: "Central", available: true, imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=300&fit=crop&auto=format", experience: "10 yrs" },
  { id: "6", name: "Robert Chen", category: "plumber", specialty: "Plumbing Specialist", rating: 4.5, reviews: 52, location: "Southpark", available: false, imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=300&fit=crop&auto=format", experience: "6 yrs" },
  { id: "7", name: "Fatima Ndiaye", category: "carpenter", specialty: "Furniture Expert", rating: 4.8, reviews: 76, location: "Harbor", available: true, imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=300&fit=crop&auto=format", experience: "8 yrs" },
  { id: "8", name: "Emmanuel Toko", category: "mason", specialty: "Construction Expert", rating: 4.7, reviews: 89, location: "Uptown", available: true, imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop&auto=format", experience: "11 yrs" },
];

const CATEGORY_META = {
  plumber: { label: "Plumber", color: "#2563EB", bg: "#EFF6FF", icon: <Wrench size={12} /> },
  electrician: { label: "Electrician", color: "#FF8C00", bg: "#FFF3E0", icon: <Zap size={12} /> },
  carpenter: { label: "Carpenter", color: "#16A34A", bg: "#F0FDF4", icon: <Hammer size={12} /> },
  mason: { label: "Mason", color: "#7C3AED", bg: "#F5F3FF", icon: <HardHat size={12} /> },
};

function DetailModal({ tech, onClose }) {
  const meta = CATEGORY_META[tech.category];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: "#ffffff" }}>
        <div className="relative h-48">
          <img src={tech.imageUrl} alt={tech.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.8), transparent)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-800/80 transition-colors" style={{ backgroundColor: "rgba(15,23,42,0.6)", border: "none", color: "white" }}>
            <X size={16} />
          </button>
          <div className="absolute bottom-4 left-4">
            <h3 style={{ color: "white", fontWeight: 700, fontSize: "1.25rem" }}>{tech.name}</h3>
            <span className="text-sm" style={{ color: "#CBD5E1" }}>{tech.specialty}</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: tech.available ? "#F0FDF4" : "#FEF2F2", color: tech.available ? "#16A34A" : "#DC2626" }}>
              {tech.available ? "Available" : "Busy"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[{ label: "Rating", value: `${tech.rating}★` }, { label: "Reviews", value: tech.reviews }, { label: "Experience", value: tech.experience }].map(s => (
              <div key={s.label} className="p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC" }}>
                <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F172A" }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
            <MapPin size={14} style={{ color: "#FF8C00", flexShrink: 0 }} />
            {tech.location}
          </div>
          <button className="w-full py-3 rounded-xl text-white font-semibold cursor-pointer transition-all" style={{ backgroundColor: "#FF8C00", border: "none" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E67E00")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FF8C00")}>
            Contact Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Portal() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);

  const filtered = TECHNICIANS
    .filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.specialty.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "all" || t.category === filterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F5F9" }}>
      {/* Existing Navbar */}
      <Navbar />

      {/* Hero search bar */}
      <div style={{ backgroundColor: "#0F172A", padding: "3rem 1rem 2rem" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 style={{ color: "#FACC15", fontWeight: 800, fontSize: "2.25rem", fontFamily: "Montserrat, Inter, sans-serif", marginBottom: "0.5rem" }}>
            Find a Trusted Technician
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "1rem", marginBottom: "1.75rem" }}>
            Browse certified professionals ready to solve your problems
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#1E293B", color: "#F8FAFC", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Search by name, specialty, category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ backgroundColor: "#1E293B", color: "#F8FAFC", border: "1px solid rgba(255,255,255,0.1)", minWidth: "160px" }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="plumber">Plumber</option>
              <option value="electrician">Electrician</option>
              <option value="carpenter">Carpenter</option>
              <option value="mason">Mason</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              style={{ backgroundColor: showFilters ? "#FF8C00" : "#334155", color: "white", border: "none" }}
            >
              <Filter size={16} /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-2">
                <label className="text-sm" style={{ color: "#94A3B8" }}>Sort by:</label>
                {[{ value: "rating", label: "Top Rated" }, { value: "reviews", label: "Most Reviews" }, { value: "name", label: "Name A-Z" }].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    style={{ backgroundColor: sortBy === s.value ? "#FF8C00" : "#334155", color: "white", border: "none" }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "#64748B" }}>
            Showing <span style={{ color: "#0F172A", fontWeight: 600 }}>{filtered.length}</span> technicians
            {filterCategory !== "all" && <span> in <span style={{ color: "#FF8C00", fontWeight: 600 }}>{filterCategory}</span></span>}
          </p>
          {/* Category filter pills */}
          <div className="hidden sm:flex gap-2">
            {["all", "plumber", "electrician", "carpenter", "mason"].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  backgroundColor: filterCategory === cat ? "#FF8C00" : "#ffffff",
                  color: filterCategory === cat ? "white" : "#64748B",
                  border: `1px solid ${filterCategory === cat ? "#FF8C00" : "#E2E8F0"}`,
                }}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} style={{ color: "#CBD5E1", margin: "0 auto 1rem" }} />
            <p style={{ color: "#64748B", fontWeight: 500 }}>No technicians found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(tech => {
              const meta = CATEGORY_META[tech.category];
              return (
                <div
                  key={tech.id}
                  className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ height: "180px" }}>
                    <img
                      src={tech.imageUrl}
                      alt={tech.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Available badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: tech.available ? "rgba(22,163,74,0.9)" : "rgba(220,38,38,0.9)" }}
                      >
                        {tech.available ? "Available" : "Busy"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}>{tech.name}</h3>
                        <p style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "0.1rem" }}>{tech.specialty}</p>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.icon}{meta.label}
                      </span>
                    </div>

                    {/* Rating + location */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={13} fill="#FACC15" style={{ color: "#FACC15" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A" }}>{tech.rating}</span>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>({tech.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: "#94A3B8" }}>
                        <MapPin size={11} />
                        {tech.location}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTech(tech)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all border"
                        style={{ backgroundColor: "transparent", borderColor: "#FF8C00", color: "#FF8C00" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FFF3E0"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Phone size={13} className="inline mr-1" />Contact
                      </button>
                      <button
                        onClick={() => setSelectedTech(tech)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all text-white"
                        style={{ backgroundColor: "#FF8C00", border: "none" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E67E00")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FF8C00")}
                      >
                        <Info size={13} className="inline mr-1" />Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA */}
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

      {selectedTech && <DetailModal tech={selectedTech} onClose={() => setSelectedTech(null)} />}
    </div>
  );
}
