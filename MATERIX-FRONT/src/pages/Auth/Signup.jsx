import React, { useState } from "react";
import "./Signup.css";

const Signup = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                title="Must be at least 8 characters, include uppercase, lowercase, number, and special character"
              />
              <small className="hint">
                Password must be 8+ characters with uppercase, lowercase, number
                & special symbol.
              </small>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
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
