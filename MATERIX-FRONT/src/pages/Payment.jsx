import React, { useState } from "react";
import "./Payment.css";
import { FaTimes, FaCreditCard, FaPhoneAlt, FaUser, FaEnvelope, FaLock, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Payment = ({ onClose }) => {
  const [showPayment, setShowPayment] = useState(true);
  const [paymentStep, setPaymentStep] = useState("method");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({ phone: "", name: "", email: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");

  const navigate = useNavigate();

  const trialFee = 500;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({ ...paymentDetails, [name]: value });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentCode("TRX" + Math.floor(Math.random() * 1000000));
      setPaymentStep("confirmation");
    }, 2000);
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

              <div className="form-group">
                <label>Email (Optional)</label>
                <div className="input-with-icon">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={paymentDetails.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="security-notice">
                <FaLock className="lock-icon" />
                <span>Your payment is secure and encrypted</span>
              </div>

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
            <p>Your trial has been activated.</p>
            <div className="payment-code">
              <span>Transaction ID:</span>
              <strong>{paymentCode}</strong>
            </div>
            
            <button
              className="continue-shopping-btn"
              onClick={() => { setShowPayment(false); navigate("/login"); }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;