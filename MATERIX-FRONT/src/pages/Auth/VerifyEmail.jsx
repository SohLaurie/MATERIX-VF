import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Mail, RefreshCw, ArrowLeft } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract email from navigation state or default to guest address
  const email = location.state?.email || "user@example.com";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // "idle" | "verifying" | "success" | "error"
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSent, setResendSent] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  const MOCK_CODE = "482916";

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleInput = (idx, val) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = char;
    setCode(next);
    setStatus("idle");
    if (char && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = () => {
    const entered = code.join("");
    if (entered.length !== 6) return;
    setStatus("verifying");
    setTimeout(() => {
      if (entered === MOCK_CODE) {
        setStatus("success");
        setTimeout(() => navigate("/portal"), 2000);
      } else {
        setStatus("error");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }, 1200);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendSent(true);
    setCode(["", "", "", "", "", ""]);
    setStatus("idle");
    startCooldown();
    setTimeout(() => setResendSent(false), 3000);
    inputRefs.current[0]?.focus();
  };

  const isComplete = code.every(c => c !== "");

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6" 
      style={{ 
        backgroundColor: "#EDF2F7", 
        fontFamily: "'Inter', 'Poppins', sans-serif" 
      }}
    >
      <div className="w-full max-w-[440px]">
        {/* Back to Registration Link */}
        <button
          onClick={() => navigate("/register")}
          className="flex items-center gap-1.5 mb-4 text-sm font-semibold cursor-pointer transition-colors"
          style={{ color: "#4A5568", background: "none", border: "none" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#FF8000")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4A5568")}
        >
          <span style={{ fontSize: "1.1rem" }}>←</span> Back to Registration
        </button>

        {/* Card */}
        <div 
          className="shadow-xl bg-white" 
          style={{ 
            borderRadius: "24px",
            border: "1px solid #E2E8F0"
          }}
        >
          {/* Header */}
          <div style={{ padding: "36px 32px 0 32px", textAlign: "center" }}>
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
                strokeWidth="2.5" 
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
                margin: "0 0 8px 0",
                letterSpacing: "-0.01em"
              }}
            >
              {status === "success" ? "Email Verified!" : "Enter Verification Code"}
            </h1>
            
            {status !== "success" && (
              <p style={{ color: "#4B5563", fontSize: "0.875rem", margin: "0", lineHeight: "1.5" }}>
                We sent a 6-digit code to <span style={{ color: "#FF8000", fontWeight: "600" }}>{email}</span>
              </p>
            )}
            {status === "success" && (
              <p style={{ color: "#10B981", fontSize: "0.875rem", margin: "0", fontWeight: "600" }}>
                Your account has been verified. Redirecting...
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "#F3F4F6", margin: "24px 0" }} />

          {/* Form / Inputs Container */}
          <div style={{ padding: "0 32px 36px 32px" }}>
            {status !== "success" && (
              <>
                {/* OTP Inputs */}
                <div className="flex gap-3 justify-center mb-4" onPaste={handlePaste}>
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleInput(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      className="w-12 h-14 text-center rounded-xl outline-none transition-all duration-200"
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#111827",
                        border: `1px solid ${
                          status === "error"
                            ? "#EF4444"
                            : digit
                            ? "#FF8000"
                            : "#CBD5E1"
                        }`,
                        backgroundColor: "#ffffff",
                        boxShadow: digit ? "0 0 0 3px rgba(255,128,0,0.1)" : "none"
                      }}
                    />
                  ))}
                </div>

                {/* Error message */}
                {status === "error" && (
                  <p style={{ textAlign: "center", color: "#EF4444", fontSize: "0.875rem", fontWeight: "600", margin: "0 0 16px 0" }}>
                    Incorrect code. Please try again.
                  </p>
                )}

                {/* Expiration Hint */}
                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9CA3AF", margin: "0 0 24px 0" }}>
                  Code expires in <span style={{ color: "#FF8000", fontWeight: "600" }}>10 minutes</span>
                  {" "} - Demo code: <span style={{ color: "#4B5563", fontWeight: "700" }}>482916</span>
                </p>

                {/* Validate Button */}
                <button
                  onClick={handleVerify}
                  disabled={!isComplete || status === "verifying"}
                  className="w-full py-3.5 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isComplete && status !== "verifying" ? "#FF8000" : "#CAD4E2",
                    border: "none",
                    borderRadius: "12px",
                    cursor: isComplete && status !== "verifying" ? "pointer" : "not-allowed",
                    fontSize: "0.9375rem"
                  }}
                >
                  {status === "verifying" ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Validate Code"
                  )}
                </button>

                {/* Resend Action */}
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  {resendSent && (
                    <p style={{ color: "#10B981", fontSize: "0.75rem", fontWeight: "600", margin: "0 0 8px 0" }}>
                      ✓ New code sent to your email!
                    </p>
                  )}
                  <p style={{ color: "#4B5563", fontSize: "0.875rem", margin: "0" }}>
                    Didn't receive the code?{" "}
                    {resendCooldown > 0 ? (
                      <span style={{ color: "#9CA3AF" }}>
                        Resend in <span style={{ color: "#FF8000", fontWeight: "700" }}>{resendCooldown}s</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        className="cursor-pointer transition-colors"
                        style={{ 
                          color: "#FF8000", 
                          fontWeight: "600", 
                          background: "none", 
                          border: "none", 
                          textDecoration: "underline",
                          padding: "0"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#E67E00")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#FF8000")}
                      >
                        Resend Code
                      </button>
                    )}
                  </p>
                </div>
              </>
            )}

            {status === "success" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: "100%", height: "6px", backgroundColor: "#E5E7EB", borderRadius: "9999px", overflow: "hidden", marginBottom: "16px" }}>
                  <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: "#10B981", width: "100%" }} />
                </div>
                <p style={{ color: "#4B5563", fontSize: "0.875rem", margin: "0" }}>Taking you to the portal...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Brand */}
        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#9CA3AF" }}>
          <span style={{ color: "#FFC700", fontWeight: "700" }}>MATERIX</span> - Safety First - www.materix.com
        </p>
      </div>
    </div>
  );
}
