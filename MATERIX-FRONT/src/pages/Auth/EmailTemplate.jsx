import React from "react";
import { useNavigate } from "react-router-dom";

export default function EmailTemplate() {
  const navigate = useNavigate();
  const code = "482916";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#F1F5F9" }}>
      <div className="mb-4 text-center">
        <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "1.125rem" }}>Email Verification Template Preview</h2>
        <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.25rem" }}>This is how the verification email appears to users</p>
      </div>

      {/* Email container */}
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
        {/* Email header bar */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#0F172A" }}>
          <span style={{ color: "#FACC15", fontWeight: 800, fontSize: "1.375rem", fontFamily: "Montserrat, Inter, sans-serif", letterSpacing: "0.05em" }}>MATERIX</span>
          <span style={{ color: "#475569", fontSize: "0.75rem" }}>No-Reply · noreply@materix.com</span>
        </div>

        {/* Email body */}
        <div className="px-8 py-8">
          {/* Subject icon */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#FFF3E0" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="#FF8C00" strokeWidth="2"/>
                <path d="m2 7 10 7 10-7" stroke="#FF8C00" strokeWidth="2"/>
              </svg>
            </div>
            <h1 style={{ fontWeight: 800, fontSize: "1.375rem", color: "#0F172A", fontFamily: "Montserrat, Inter, sans-serif" }}>Verify Your Account</h1>
            <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.5rem", lineHeight: 1.6 }}>
              Use the code below to complete your registration on <strong style={{ color: "#FF8C00" }}>Materix</strong>. It expires in <strong>10 minutes</strong>.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "rgba(15,23,42,0.08)", marginBottom: "2rem" }} />

          {/* Code display */}
          <div className="text-center mb-8">
            <p style={{ fontSize: "0.75rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Your Verification Code</p>
            <div className="flex justify-center gap-3">
              {code.split("").map((digit, idx) => (
                <div
                  key={idx}
                  className="w-12 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#0F172A" }}
                >
                  <span style={{ color: "#FACC15", fontSize: "1.5rem", fontWeight: 800, fontFamily: "monospace" }}>{digit}</span>
                </div>
              ))}
            </div>
            <p style={{ color: "#94A3B8", fontSize: "0.75rem", marginTop: "1rem" }}>
              <span style={{ color: "#EF4444", fontWeight: 600 }}>⚠ Expires in 10 minutes</span>
              {" "}· Do not share this code with anyone.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "rgba(15,23,42,0.08)", marginBottom: "1.5rem" }} />

          {/* Notice */}
          <div className="rounded-xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)" }}>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", lineHeight: 1.6 }}>
              If you did not request this verification, please ignore this email. Your account security is important to us. Never share this code with anyone claiming to be from Materix.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 text-center" style={{ backgroundColor: "#0F172A" }}>
          <p style={{ color: "#FACC15", fontWeight: 700, fontSize: "0.875rem", fontFamily: "Montserrat, Inter, sans-serif", marginBottom: "0.25rem" }}>MATERIX</p>
          <p style={{ color: "#475569", fontSize: "0.75rem" }}>Safety First · www.materix.com</p>
          <p style={{ color: "#374151", fontSize: "0.6875rem", marginTop: "0.5rem" }}>
            © 2026 Materix. All rights reserved. · This is an automated message.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/verify")}
        className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors"
        style={{ backgroundColor: "#FF8C00", border: "none" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E67E00")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FF8C00")}
      >
        Go to Verification Page →
      </button>
    </div>
  );
}
