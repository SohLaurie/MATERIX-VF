import React, { useState } from "react";
import "./Payment.css";
import { FaTimes, FaCreditCard, FaPhoneAlt, FaUser, FaEnvelope, FaLock, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Payment = ({ onClose }) => {
  const [showPayment, setShowPayment] = useState(true);
  const [paymentStep, setPaymentStep] = useState("method");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({ phone: "", name: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");

  const navigate = useNavigate();

  const trialFee = 25;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({ ...paymentDetails, [name]: value });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentDetails.phone) return;
    setIsProcessing(true);
    setProcessingMessage("Initiating payment request...");

    try {
      const token = localStorage.getItem("access");
      // Call InitiatePaymentView
      const response = await fetch("http://127.0.0.1:8000/api/auth/payments/initiate/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: paymentDetails.phone,
          amount: getTotalPrice(),
          payment_type: "subscription",
        }),
      });

      if (!response.ok) {
        throw new Error("Initiation failed");
      }

      const data = await response.json();
      const { transaction_id, is_mock } = data;
      setPaymentCode(transaction_id);

      if (is_mock) {
        setProcessingMessage("Simulation: Initiated. Simulating phone PIN authorization (takes 4 seconds)...");
      } else {
        setProcessingMessage("Payment initiated! Check your phone for MTN Mobile Money or Orange Money prompt and enter your PIN.");
      }

      // Poll status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://127.0.0.1:8000/api/auth/payments/status/${transaction_id}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!statusResponse.ok) return;
          const statusData = await statusResponse.json();
          
          if (statusData.status === "success") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingMessage("");
            setPaymentStep("confirmation");
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingMessage("");
            alert("Payment failed. Please verify your mobile money balance or PIN and try again.");
          }
        } catch (pollErr) {
          console.error("Error polling payment status:", pollErr);
        }
      }, 3000);

    } catch (err) {
      console.error("Payment initiation error:", err);
      setIsProcessing(false);
      setProcessingMessage("");
      alert("An error occurred while initiating your subscription payment. Please try again.");
    }
  };

  const getTotalPrice = () => trialFee;

  if (!showPayment) return null;

  return (
    <div className={`payment-modal-overlay ${showPayment ? "show" : ""}`}>
      <div className="payment-modal">
        <button className="close-payment" onClick={() => { setShowPayment(false); onClose(); }}>
          <FaTimes />
        </button>
        <h2>Complete Your Trial Payment</h2>

        {paymentStep === "method" ? (
          <>
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-options">
                <button
                  className={`payment-option ${paymentMethod === "mtn" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("mtn")}
                >
                  <div className="payment-option-content">
                    <FaCreditCard className="payment-icon" />
                    <span>MTN Mobile Money</span>
                    <div className="payment-desc">Pay with your MTN Mobile Money account</div>
                  </div>
                  <div className="payment-fee">No fees</div>
                </button>

                <button
                  className={`payment-option ${paymentMethod === "orange" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("orange")}
                >
                  <div className="payment-option-content">
                    <FaCreditCard className="payment-icon" />
                    <span>Orange Money</span>
                    <div className="payment-desc">Pay with your Orange Money account</div>
                  </div>
                  <div className="payment-fee">No fees</div>
                </button>
              </div>

              <div className="payment-total">
                <span>Total to pay:</span>
                <span className="amount">{getTotalPrice().toLocaleString()} FCFA</span>
              </div>

              <button
                className="next-btn"
                onClick={() => paymentMethod && setPaymentStep("details")}
                disabled={!paymentMethod}
              >
                Continue to Payment <FaArrowRight />
              </button>
            </div>
          </>
        ) : paymentStep === "details" ? (
          <div className="payment-details">
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <FaPhoneAlt className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder={`e.g. 6${paymentMethod === "mtn" ? "7" : "9"}XXXXXXX`}
                    value={paymentDetails.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name as on ID"
                    value={paymentDetails.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="security-notice">
                <FaLock className="lock-icon" />
                <span>Your payment is secure and encrypted</span>
              </div>

              {isProcessing && processingMessage && (
                <div style={{ margin: "0 0 15px 0", color: "#ff8000", fontSize: "0.875rem", fontWeight: "600", textAlign: "center", backgroundColor: "#fff5eb", padding: "10px", borderRadius: "8px", border: "1px solid #ffe3cb" }}>
                  {processingMessage}
                </div>
              )}
              <div className="payment-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setPaymentStep("method")}
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="pay-now-btn"
                  disabled={isProcessing || !paymentDetails.phone || !paymentDetails.name}
                >
                  {isProcessing ? "Processing..." : `Pay ${getTotalPrice().toLocaleString()} FCFA`}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="payment-confirmation">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your account is now fully activated. Your profile is visible to clients on the Materix portal!</p>
            <div className="payment-code">
              <span>Transaction ID:</span>
              <strong>{paymentCode}</strong>
            </div>
            
            <button
              className="continue-shopping-btn"
              onClick={() => { setShowPayment(false); navigate("/techdash"); }}
            >
              Go to My Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;