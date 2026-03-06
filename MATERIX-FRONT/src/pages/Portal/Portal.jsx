// src/components/Portal/Portal.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Portal.css";
import fallbackImg from "../../assets/images/default.png";

const baseUrl = "http://127.0.0.1:8000"; // change if your backend host/port differs

export default function Portal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [selectedTech, setSelectedTech] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("");
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ✅ Decode user ID from stored token payload
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
        console.log("🔑 Decoded JWT payload:", payload);
        setCurrentUserId(payload.user_id); // assuming your JWT includes "user_id"
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  // Fetch technicians
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTechs() {
      try {
        setLoading(true);
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (category) params.category = category;
        if (availability) params.availability = availability;

        const res = await axios.get(`${baseUrl}/api/portal/technicians/`, {
          params,
          signal: controller.signal,
        });

        console.log("📋 Technicians fetched:", res.data);
        setTechnicians(res.data || []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Failed to load technicians:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTechs();
    return () => controller.abort();
  }, [searchTerm, category, availability]);

  // ✅ Exclude logged-in user’s own card
  const filteredTechnicians = useMemo(() => {
    console.log("👤 Filtering with currentUserId:", currentUserId);

    if (!currentUserId) return technicians;

    const userIdNum = Number(currentUserId); // convert string → number

    const filtered = technicians.filter((tech) => {
      console.log(`Checking tech.id=${tech.id} vs currentUserId=${userIdNum}`);
      return tech.id !== userIdNum; // hide own card
    });

    console.log("✅ After filtering:", filtered);
    return filtered;
  }, [technicians, currentUserId]);

  const handleContactClick = (tech) => {
    setSelectedTech(tech);
  };

  const handleCloseOverlay = () => {
    setSelectedTech(null);
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!selectedTech) return;

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    const payload = {
      technician_id: selectedTech.id,
      client_name: formData.get("client_name"),
      contact: formData.get("contact"),
      preferred_method: formData.get("preferred_method"),
      message: formData.get("message"),
      location: formData.get("location"),
    };

    try {
      const token = localStorage.getItem("access");

      await axios.post(`${baseUrl}/api/portal/requests/`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const techName = selectedTech?.name;
      formEl.reset();
      setSelectedTech(null);
      setToastText(`✅ Message successfully sent to ${techName || "technician"}!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Request failed:", err.response?.data || err.message);
      setSelectedTech(null);
      setToastText("❌ Failed to send message. Please try again.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <>
      <div className="portal-container">
        {/* Navbar */}
        <nav className="navbar">
          <a href="/" className="logolink">
            <div className="logo">MATERIX</div>
          </a>
          <input
            type="text"
            placeholder="Search technicians..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select id="selectcat" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Mason">Mason</option>
            <option value="Electrician">Electrician</option>
            <option value="Plumber">Plumber</option>
            <option value="Carpenter">Carpenter</option>
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </nav>

        {/* Technicians Grid */}
        <div className="technicians-grid">
          {loading && <div>Loading technicians...</div>}
          {!loading &&
            filteredTechnicians.map((tech) => (
              <div key={tech.id} className="tech-card">
                <img
                  src={tech.image || fallbackImg}
                  alt={tech.name}
                  className="tech-img"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImg;
                  }}
                />
                <h3>{tech.name}</h3>
                <p className="specialty">{tech.specialty || "—"}</p>
                {tech.rating != null ? (
                  <p className="rating">⭐ {tech.rating}</p>
                ) : (
                  <p className="rating">⭐ 3.9</p>
                )}
                <p
                  className={`availability ${
                    tech.available ? "available" : "unavailable"
                  }`}
                >
                  {tech.available ? "Available" : "Unavailable"}
                </p>
                <p className="location">{tech.location || "—"}</p>
                <button
                  className="contact-btn"
                  onClick={() => handleContactClick(tech)}
                >
                  Contact Now
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Contact Overlay */}
      {selectedTech && (
        <>
          <div className="overlay-backdrop" onClick={handleCloseOverlay}></div>
          <div className="overlay-panel">
            <div className="overlay-header">
              <img
                src={selectedTech.image || fallbackImg}
                alt={selectedTech.name}
                className="overlay-img"
                onError={(e) => {
                  e.currentTarget.src = fallbackImg;
                }}
              />
              <div>
                <h2>{selectedTech.name}</h2>
                <p>{selectedTech.specialty}</p>
                <p className="overlay-location">
                  📍 {selectedTech.location || "—"}
                </p>
              </div>
              <button className="close-btn" onClick={handleCloseOverlay}>
                ✖
              </button>
            </div>
            <form className="contact-form" onSubmit={handleSubmitMessage}>
              <label>Your Name</label>
              <input name="client_name" type="text" required />

              <label>Your Email / Phone</label>
              <input name="contact" type="text" required />

              <label>Preferred Contact Method</label>
              <select name="preferred_method" required>
                <option value="">Select...</option>
                <option value="Call">Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>

              <label>Location</label>
              <input name="location" type="text" placeholder="City / Address" />

              <label>Message</label>
              <textarea
                name="message"
                rows="4"
                placeholder="I need help with..."
                required
              ></textarea>

              <button type="submit" className="send-btn">
                Send Message
              </button>
            </form>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {showToast && <div className="toast">{toastText || "✅ Message sent!"}</div>}
    </>
  );
}
