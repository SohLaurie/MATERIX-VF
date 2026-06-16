import React, { useState } from "react";
import "./Signup.css";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check confirm password
    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }

    setError("");
    alert("Signup Successful ✅");
  };

  return (
    <div className="signup-container">
      {/* Left Section */}
      <div className="signup-left">
        <div className="overlay">
          <h1>Join Us</h1>
          <p>Create Your Account</p>
          <span className="site-link">www.materix.com</span>
        </div>

        {/* Floating Shapes */}
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <div className="form-box">
          <h3>Welcome !</h3>
          <h4>
            <span className="highlight">Sign Up</span>
          </h4>
          <p>Create Your New Account</p>

          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <input type="text" placeholder="Username" required />
            </div>
            <div className="input-box">
              <input type="email" placeholder="Email Address" required />
            </div>
            <div className="input-box" style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                title="Must be at least 8 characters, include uppercase, lowercase, number, and special character"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  color: "#6b7280",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <small className="hint" style={{ width: "100%" }}>
                Password must be 8+ characters with uppercase, lowercase, number
                & special symbol.
              </small>
            </div>
            <div className="input-box" style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  color: "#6b7280",
                  height: "100%"
                }}
                title={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="options">
              <label>
                <input type="checkbox" required /> I agree to the{" "}
                <a href="/" className="policy-link">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" className="submit-btn">
              SIGN UP
            </button>

            <div className="account-link">
              Already have an account? <a href="/login">Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
