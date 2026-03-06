import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Signup.css";
import Payment from "../../pages/Payment.jsx";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    specialty: "",
    address: "",
    cni_number: "",
  });
  const [error, setError] = useState("");
  const [role, setRole] = useState("client");
  const [showPayment, setShowPayment] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userRole = params.get("role") || "client";
    setRole(userRole);
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*()\-_=+{};:,<.>]/.test(pwd)) strength++;

    if (strength <= 2) return "Weak";
    if (strength === 3 || strength === 4) return "Medium";
    if (strength === 5) return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm) {
      setError("❌ Passwords do not match!");
      return;
    }

    const strongPwdRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/;

    if (!strongPwdRegex.test(formData.password)) {
      setError(
        "❌ Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    setError("");

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: role,
        address: formData.address, // always send address
        specialty: role === "technician" ? formData.specialty : null,
        // address: role === "technician" ? formData.address : null,
        cni_number: role === "technician" ? formData.cni_number : null,
      };

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        payload
      );

      if (res.status === 201) {
        if (role === "technician") {
          setShowPayment(true); // ✅ show payment only after technician registers successfully
        } else {
          alert(`Registration Successful for ${role}`);
          navigate("/login");
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "❌ Registration failed. Please check your details."
      );
    }
  };

  return (
    <div className="bodyscreen">
      <div className="signup-container">
        {/* Left Section */}
        <div className="signup-left">
          <div className="overlay">
            <h1>
              {role === "technician" ? "Join as Technician" : "Join as Client"}
            </h1>
            <p>Create Your Account</p>
            <span className="site-link">www.materix.com</span>
          </div>
          <div className="circle circle1"></div>
          <div className="circle circle2"></div>
          <div className="circle circle3"></div>
        </div>

        {/* Right Section */}
        <div className="signup-right">
          <div className="form-box">
            <h3>Welcome !</h3>
            <h4>
              <span className="highlight">Register</span>
            </h4>
            <p>
              {role === "technician"
                ? "Technician Signup Form"
                : "Client Signup Form"}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-box">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="input-box">
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

              {role === "technician" && (
                <>
                  <div className="input-box">
                    <input
                      type="text"
                      name="specialty"
                      placeholder="Specialty"
                      required
                      value={formData.specialty}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="input-box">
                    <input
                      type="text"
                      name="cni_number"
                      placeholder="CNI Number"
                      required
                      value={formData.cni_number}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div className="input-box password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {formData.password && (
                <p
                  className={`password-strength ${getPasswordStrength(
                    formData.password
                  ).toLowerCase()}`}
                >
                  Strength: {getPasswordStrength(formData.password)}
                </p>
              )}

              {/* Confirm Password */}
              <div className="input-box password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder="Confirm Password"
                  required
                  value={formData.confirm}
                  onChange={handleChange}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {error && <p className="error">{error}</p>}

              <div className="options">
                <label>
                  <input type="checkbox" required /> I agree to the{" "}
                  <a href="/" className="policy-link">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button type="submit" className="submit-btn">
                REGISTER
              </button>

              <div className="account-link">
                Already have an account? <a href="/login">Sign in</a>
              </div>
            </form>
          </div>
        </div>

        {showPayment && <Payment onClose={() => setShowPayment(false)} />}
      </div>
    </div>
  );
};

export default Register;