import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");



  // Common handler to load profile and redirect
  const handlePostAuth = async (data) => {
    // Save tokens
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    // Fetch profile to get role
    const profileRes = await axios.get(
      "http://127.0.0.1:8000/api/auth/profile/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.access}`,
        },
      }
    );

    const profileData = profileRes.data;

    localStorage.setItem("username", profileData.username || profileData.email);
    localStorage.setItem("role", profileData.role);

    // Fetch profile picture separately
    try {
      const profilePictureRes = await axios.get(
        "http://127.0.0.1:8000/api/profile/",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.access}`,
          },
        }
      );

      const pictureData = profilePictureRes.data;

      const profilePicUrl = pictureData.profile_picture.startsWith('http')
          ? pictureData.profile_picture
          : `http://127.0.0.1:8000${pictureData.profile_picture}`;
      localStorage.setItem(
        "profile_picture",
        profilePicUrl || ""
      );
    } catch (picErr) {
      console.warn("Profile picture fetch failed:", picErr);
      localStorage.setItem("profile_picture", ""); // fallback
    }

    // Redirect based on role
    switch (profileData.role) {
      case "client":
        window.location.href = "/";
        break;
      case "technician":
        window.location.href = "/techdash";
        break;
      case "delivery":
      case "deliveryagent":
        window.location.href = "/deldash";
        break;
      case "admin":
        window.location.href = "/admindash";
        break;
      default:
        window.location.href = "/#home";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Login request
      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data;

      // Check if 2FA is required
      if (data.require_2fa) {
        navigate("/verify", { state: { email, is2FA: true } });
        return;
      }

      await handlePostAuth(data);
    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(err.response.data.detail || "Login failed");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };


  return (
    <div className="bodyscreen"> 
      <div className="login-container">
        <div className="login-left">
          <div className="overlay">
            <h1>Welcome Page</h1>
            <p>Sign In To Your Account</p>
            <span className="site-link">www.materix.com</span>
          </div>
          <div className="circle circle1"></div>
          <div className="circle circle2"></div>
          <div className="circle circle3"></div>
        </div>
    
        <div className="login-right">
          <div className="form-box">
            <h3>Hello !</h3>
            <h4>
              <span className="highlight">Good Morning</span>
            </h4>
            <p>
              <span className="login-text">Login</span> Your Account
            </p>
    
            <form onSubmit={handleSubmit}>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-box" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
    
              {error && <p style={{ color: "red" }}>{error}</p>}
    
              <div className="options">
                <label>
                  <input type="checkbox" /> Remember
                </label>
                <a href="/" className="forgot">
                  Forgot Password ?
                </a>
              </div>
    
              <button type="submit" className="submit-btn">
                SUBMIT
              </button>
    
              <div className="create-account">
                <a href="/pack">Create Account</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    
  );
};

export default Login;