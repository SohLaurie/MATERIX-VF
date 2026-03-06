import React, { useState, useEffect } from "react";
import "./TechDashboard.css";
import { FaCheckCircle, FaTimesCircle, FaClipboardList, FaEye } from "react-icons/fa";
import Navbar2 from "../../components/Navbar";
import axios from "axios";

const baseUrl = "http://127.0.0.1:8000"; // adjust if different

const TechDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
  });
  const [viewRequest, setViewRequest] = useState(null);

  // Helper: get Authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("access");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const headers = getAuthHeader();
        if (!headers) {
          console.warn("No access token found");
          return;
        }

        const res = await axios.get(`${baseUrl}/api/portal/requests/my/`, {
          headers,
        });

        setRequests(res.data);

        // Compute stats
        const total = res.data.length;
        const accepted = res.data.filter((r) => r.status.toLowerCase() === "accepted").length;
        const rejected = res.data.filter((r) => r.status.toLowerCase() === "rejected").length;
        setStats({ total, accepted, rejected });
      } catch (err) {
        console.error("Error fetching requests:", err.response || err);
      }
    };

    fetchRequests();
  }, []);

  // Update request status (Accept/Reject)
  const updateRequestStatus = async (id, status) => {
    try {
      const headers = {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      };
      if (!headers.Authorization) return;

      const res = await axios.patch(
        `${baseUrl}/api/portal/requests/${id}/`,
        { status: status.toLowerCase() }, // backend expects lowercase
        { headers }
      );

      // Update requests state
      const updatedRequests = requests.map((req) =>
        req.id === id ? { ...req, status: res.data.status } : req
      );
      setRequests(updatedRequests);

      // Recompute stats
      const total = updatedRequests.length;
      const accepted = updatedRequests.filter((r) => r.status.toLowerCase() === "accepted").length;
      const rejected = updatedRequests.filter((r) => r.status.toLowerCase() === "rejected").length;
      setStats({ total, accepted, rejected });
    } catch (err) {
      console.error(`Error updating request ${id}:`, err.response || err);
    }
  };

  const handleAccept = (id) => updateRequestStatus(id, "Accepted");
  const handleReject = (id) => updateRequestStatus(id, "Rejected");
  const handleView = (req) => setViewRequest(req);
  const closeModal = () => setViewRequest(null);

  return (
    <>
      <Navbar2 />
      <div className="tech-dashboard" id="techdash">
        <h1 className="dashboard-title">TECHDASHBOARD</h1>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <p className="stat-label">TOTAL REQUESTS</p>
            <h2>{stats.total}</h2>
            <div className="stat-icon total">
              <FaClipboardList />
            </div>
          </div>
          <div className="stat-card">
            <p className="stat-label">ACCEPTED</p>
            <h2>{stats.accepted}</h2>
            <div className="stat-icon accepted">
              <FaCheckCircle />
            </div>
          </div>
          <div className="stat-card">
            <p className="stat-label">REJECTED</p>
            <h2>{stats.rejected}</h2>
            <div className="stat-icon rejected">
              <FaTimesCircle />
            </div>
          </div>
        </div>

        <h2 className="deliveries-title">MANAGE REQUESTS</h2>

        {/* Requests Table */}
        <table className="requests-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Message</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const isFinal = ["accepted", "rejected"].includes(req.status.toLowerCase());
              return (
                <tr key={req.id}>
                  <td>{req.client_name || "Unknown"}</td>
                  <td>{req.message}</td>
                  <td>{req.contact}</td>
                  <td>{req.location}</td>
                  <td className={`status ${req.status.toLowerCase()}`}>{req.status}</td>
                  <td>
                    <button onClick={() => handleView(req)} className="btn view">
                      <FaEye />
                    </button>
                    <button 
                      onClick={() => handleAccept(req.id)} 
                      className="btn accept"
                      disabled={isFinal} // disable if already accepted/rejected
                    >
                      <FaCheckCircle />
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)} 
                      className="btn reject"
                      disabled={isFinal} // disable if already accepted/rejected
                    >
                      <FaTimesCircle />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* View Modal */}
        {viewRequest && (
          <>
            <div className="modal-backdrop" onClick={closeModal}></div>
            <div className="request-modal">
              <h2>Request Details</h2>
              <p><strong>Name:</strong> {viewRequest.client_name || "Unknown"}</p>
              <p><strong>Message:</strong> {viewRequest.message}</p>
              <p><strong>Contact:</strong> {viewRequest.contact}</p>
              <p><strong>Preferred Method:</strong> {viewRequest.preferred_method || "N/A"}</p>
              <p><strong>Location:</strong> {viewRequest.location}</p>
              <p><strong>Status:</strong> {viewRequest.status}</p>
              <button className="close-modal-btn" onClick={closeModal}>Close</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TechDashboard;
