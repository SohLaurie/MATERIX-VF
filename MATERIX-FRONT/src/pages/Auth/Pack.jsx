import React from "react";
import { useNavigate } from "react-router-dom";
import "./Pack.css";

const Pack = () => {
  const navigate = useNavigate();

  const handleRegister = (role) => {
    // Redirect to Register page with role as query param
    navigate(`/register?role=${role}`);
  };

  return (
    <div className="pack-container">
      <h2 className="pack-title">Choose Your Plan</h2>
      <p className="pack-subtitle">Select the package that suits you best</p>

      <div className="pricing-cards">
        {/* Client Plan */}
        <div className="pricing-card">
          <h3 className="plan-name">Client Package</h3>
          <p className="plan-price">Free</p>
          <ul className="plan-features">
            <li>Order your contruction materials from our shop</li>
            <li>Conatct skilled technician from our portal</li>
            <li>Full access to our shop and portal (no payment needed)</li>
          </ul>
          <button
            className="plan-btn" id="btn1"
            onClick={() => handleRegister("client")}
          >
            Join as Client
          </button>
        </div>

        {/* Technician Plan */}
        <div className="pricing-card premium">
          <h3 className="plan-name">Technician Package</h3>
          <p className="plan-price">2,000 XAF / month</p>
          <span className="trial-note">
            14-day trial for 25 XAF (deducted later)
          </span>
          <ul className="plan-features">
            <li>Showcase your portfolio on our portal</li>
            <li>Manage & respond to client requests</li>
            <li>Access to premium dashboard features</li>
            <li>Trial includes all features</li>
          </ul>
          <button
            className="plan-btn"
            onClick={() => handleRegister("technician")}
          >
            Join as Technician
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pack;
