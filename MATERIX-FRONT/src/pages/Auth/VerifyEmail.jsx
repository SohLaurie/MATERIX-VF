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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F1F5F9" }}>
      <div className="w-full max-w-md">
        {/* Back */}
        <button
          onClick={() => navigate("/register")}
          className="flex items-center gap-2 mb-6 text-sm cursor-pointer transition-colors"
          style={{ color: "#64748B", background: "none", border: "none" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#FF8C00")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
        >
          <ArrowLeft size={16} /> Back to Registration
        </button>

        {/* Card */}
        <div className="rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center" style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#FFF3E0" }}>
              {status === "success" ? (
                <CheckCircle size={32} style={{ color: "#22C55E" }} />
              ) : (
                <Mail size={32} style={{ color: "#FF8C00" }} />
              )}
            </div>
            <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0F172A", fontFamily: "Montserrat, Inter, sans-serif" }}>
              {status === "success" ? "Email Verified!" : "Enter Verification Code"}
            </h1>
            {status !== "success" && (
              <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                We sent a 6-digit code to{" "}
                <span style={{ color: "#FF8C00", fontWeight: 600 }}>{email}</span>
              </p>
            )}
            {status === "success" && (
              <p className="text-sm mt-2" style={{ color: "#16A34A" }}>
                Your account has been verified. Redirecting...
              </p>
            )}
          </div>

          <div className="px-8 py-7">
            {status !== "success" && (
              <>
                {/* OTP Inputs */}
                <div className="flex gap-3 justify-center mb-2" onPaste={handlePaste}>
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
                      className="w-12 h-14 text-center rounded-xl outline-none transition-all duration-200 font-mono"
                      style={{
                        fontSize: "1.375rem",
                        fontWeight: 700,
                        color: "#0F172A",
                        border: `2px solid ${
                          status === "error"
                            ? "#EF4444"
                            : digit
                            ? "#FF8C00"
                            : "rgba(15,23,42,0.15)"
                        }`,
                        backgroundColor: digit ? "#FFF3E0" : "#F8FAFC",
                        boxShadow: digit ? "0 0 0 3px rgba(255,140,0,0.1)" : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Error message */}
                {status === "error" && (
                  <p className="text-center text-sm mb-4" style={{ color: "#EF4444", fontWeight: 500 }}>
                    Incorrect code. Please try again.
                  </p>
                )}

                {/* Hint */}
                <p className="text-center text-xs mb-6" style={{ color: "#94A3B8" }}>
                  Code expires in <span style={{ color: "#FF8C00", fontWeight: 600 }}>10 minutes</span>
                  {" "}· Demo code: <span style={{ color: "#64748B", fontFamily: "monospace", fontWeight: 600 }}>482916</span>
                </p>

                {/* Verify Button */}
                <button
                  onClick={handleVerify}
                  disabled={!isComplete || status === "verifying"}
                  className="w-full py-3.5 rounded-xl text-white font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isComplete && status !== "verifying" ? "#FF8C00" : "#CBD5E1",
                    border: "none",
                    cursor: isComplete && status !== "verifying" ? "pointer" : "not-allowed",
                  }}
                >
                  {status === "verifying" ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Validate Code"
                  )}
                </button>

                {/* Resend */}
                <div className="text-center mt-5">
                  {resendSent && (
                    <p className="text-xs mb-2" style={{ color: "#22C55E", fontWeight: 500 }}>
                      ✓ New code sent to your email!
                    </p>
                  )}
                  <p className="text-sm" style={{ color: "#64748B" }}>
                    Didn't receive the code?{" "}
                    {resendCooldown > 0 ? (
                      <span style={{ color: "#94A3B8" }}>
                        Resend in <span style={{ color: "#FF8C00", fontWeight: 700, fontFamily: "monospace" }}>{resendCooldown}s</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        className="cursor-pointer transition-colors"
                        style={{ color: "#FF8C00", fontWeight: 600, background: "none", border: "none", textDecoration: "underline" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#E67E00")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#FF8C00")}
                      >
                        Resend Code
                      </button>
                    )}
                  </p>
                </div>
              </>
            )}

            {status === "success" && (
              <div className="text-center">
                <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "#E2E8F0" }}>
                  <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: "#22C55E", width: "100%" }} />
                </div>
                <p className="text-sm" style={{ color: "#64748B" }}>Taking you to the portal...</p>
              </div>
            )}
          </div>
        </div>

        {/* Brand footer */}
        <p className="text-center mt-6 text-xs" style={{ color: "#94A3B8" }}>
          <span style={{ color: "#FACC15", fontWeight: 700, fontFamily: "Montserrat, Inter, sans-serif" }}>MATERIX</span>
          {" "}· Safety First · www.materix.com
        </p>
      </div>
    </div>
  );
}
