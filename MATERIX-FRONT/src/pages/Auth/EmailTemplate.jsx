import React from "react";
import { useNavigate } from "react-router-dom";

export default function EmailTemplate() {
  const navigate = useNavigate();
  const code = "482916";

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6" 
      style={{ 
        backgroundColor: "#F3F4F6", 
        fontFamily: "'Inter', 'Poppins', sans-serif", 
        paddingTop: "24px",
        paddingBottom: "24px",

      }}
    >

      {/* Email Card Container */}
      <div 
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-xl" 
        style={{ 
          backgroundColor: "#ffffff", 
          border: "1px solid #E5E7EB"
        }}
      >
        {/* Email Header */}
        <div 
          style={{ 
            backgroundColor: "#111827", 
            padding: "20px 32px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between" 
          }}
        >
          <div style={{ flex: 1 }}>
            <span 
              style={{ 
                color: "#FFC700", 
                fontWeight: "900", 
                fontSize: "1.5rem", 
                letterSpacing: "0.02em",
                fontFamily: "'Inter', sans-serif"
              }}
            >
              MATERIX
            </span>
          </div>
          <div>
            <span 
              style={{ 
                color: "#9CA3AF", 
                fontSize: "0.75rem",
                opacity: 0.85
              }}
            >
              No-Reply - noreply@materix.com
            </span>
          </div>
        </div>

        {/* Email Body */}
        <div style={{ padding: "36px 40px" }}>
          {/* Envelope Icon Container */}
          <div className="text-center" style={{ marginBottom: "24px" }}>
            <div 
              style={{ 
                width: "56px", 
                height: "56px", 
                borderRadius: "14px", 
                margin: "0 auto 20px auto", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                backgroundColor: "#FFF5EB" 
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FF8000" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            
            <h1 
              style={{ 
                fontWeight: "800", 
                fontSize: "1.5rem", 
                color: "#111827", 
                margin: "0 0 12px 0",
                letterSpacing: "-0.01em"
              }}
            >
              Verify Your Account
            </h1>
            
            <p 
              style={{ 
                color: "#4B5563", 
                fontSize: "0.875rem", 
                lineHeight: "1.6",
                margin: "0" 
              }}
            >
              Use the code below to complete your registration on{" "}
              <span style={{ color: "#FF8000", fontWeight: "700" }}>Materix</span>. It expires in{" "}
              <strong style={{ color: "#111827", fontWeight: "700" }}>10 minutes.</strong>
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "#E5E7EB", margin: "24px 0" }} />

          {/* Verification Code Box */}
          <div className="text-center" style={{ marginBottom: "24px" }}>
            <p 
              style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700",
                color: "#9CA3AF", 
                textTransform: "uppercase", 
                letterSpacing: "0.08em", 
                margin: "0 0 16px 0" 
              }}
            >
              YOUR VERIFICATION CODE
            </p>
            
            <div className="flex justify-center gap-3">
              {code.split("").map((digit, idx) => (
                <div
                  key={idx}
                  style={{ 
                    width: "46px", 
                    height: "56px", 
                    borderRadius: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    backgroundColor: "#111827" 
                  }}
                >
                  <span 
                    style={{ 
                      color: "#FFC700", 
                      fontSize: "1.5rem", 
                      fontWeight: "800", 
                      fontFamily: "'Inter', sans-serif" 
                    }}
                  >
                    {digit}
                  </span>
                </div>
              ))}
            </div>
            
            <p 
              style={{ 
                color: "#9CA3AF", 
                fontSize: "0.75rem", 
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <span style={{ color: "#EF4444", fontWeight: "700" }}>Expires in 10 minutes</span>
              {" "}- Do not share this code with anyone.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "#E5E7EB", margin: "24px 0" }} />

          {/* Notice Box */}
          <div 
            style={{ 
              backgroundColor: "#F8FAFC", 
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "16px"
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "#5C6B80", lineHeight: "1.6", margin: "0" }}>
              If you did not request this verification, please ignore this email. Your account security is important to us. Never share this code with anyone claiming to be from Materix.
            </p>
          </div>
        </div>

        {/* Email Footer */}
        <div 
          style={{ 
            backgroundColor: "#111827", 
            padding: "24px 32px", 
            textAlign: "center" 
          }}
        >
          <p 
            style={{ 
              color: "#FFC700", 
              fontWeight: "900", 
              fontSize: "0.875rem", 
              margin: "0 0 4px 0",
              letterSpacing: "0.02em"
            }}
          >
            MATERIX
          </p>
          <p style={{ color: "#9CA3AF", fontSize: "0.75rem", margin: "0" }}>
            Safety First - www.materix.com
          </p>
          <p style={{ color: "#4B5563", fontSize: "0.6875rem", marginTop: "12px", marginBottom: "0" }}>
            © 2026 Materix. All rights reserved. - This is an automated message.
          </p>
        </div>
      </div>

      
    </div>
  );
}

