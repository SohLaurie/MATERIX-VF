import React, { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, X, Upload, FileText, CheckCircle } from "lucide-react";
import "./Register.css";

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "#E2E8F0" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Very Weak", color: "#EF4444" };
  if (score === 2) return { score: 2, label: "Weak", color: "#F97316" };
  if (score === 3) return { score: 3, label: "Fair", color: "#FACC15" };
  if (score === 4) return { score: 4, label: "Strong", color: "#22C55E" };
  return { score: 5, label: "Very Strong", color: "#16A34A" };
}

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    address: "",
    cni: "",
    specialty: "",
    category: "",
    password: "",
    confirmPassword: "",
    agreePolicy: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine role from query param
  const params = new URLSearchParams(location.search);
  const role = params.get("role") || "client";

  const passwordStrength = getPasswordStrength(form.password);
  const matchScore =
    form.confirmPassword === ""
      ? 0
      : form.password === form.confirmPassword
      ? 100
      : Math.min(80, (form.confirmPassword.length / Math.max(form.password.length, 1)) * 80);
  const matchColor =
    form.confirmPassword === ""
      ? "#E2E8F0"
      : form.password === form.confirmPassword
      ? "#22C55E"
      : "#EF4444";
  const matchLabel =
    form.confirmPassword === ""
      ? ""
      : form.password === form.confirmPassword
      ? "Passwords match"
      : "Does not match";

  const handleFileAdd = useCallback(
    (files) => {
      if (!files) return;
      const remaining = 3 - uploadedFiles.length;
      const toAdd = Array.from(files).slice(0, remaining);
      setUploadedFiles((prev) => [
        ...prev,
        ...toAdd.map((f) => ({
          id: Math.random().toString(36).slice(2),
          name: f.name,
          size: f.size,
          file: f,
        })),
      ]);
    },
    [uploadedFiles.length]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileAdd(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        role: role,
        address: form.address,
        specialty: role === "technician" ? form.specialty : null,
        cni_number: role === "technician" ? form.cni : null,
        category: role === "technician" ? form.category : null,
      };

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        payload
      );

      if (res.status === 201) {
        setSubmitted(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border outline-none transition-all duration-200 bg-white text-sm";
  const inputStyle = { borderColor: "rgba(15,23,42,0.15)", color: "#0F172A" };
  const inputFocusStyle = {
    borderColor: "#FF8C00",
    boxShadow: "0 0 0 3px rgba(255,140,0,0.1)",
  };

  // If not a client, show simple client form
  if (role !== "technician") {
    return (
      <div className="register-screen">
        <div className="register-container">
          {/* Left panel (circles overlay matching login) */}
          <div className="register-left">
            <div className="register-overlay">
              <h1>Join as Client</h1>
              <p>Create Your Account</p>
              <span className="site-link">www.materix.com</span>
            </div>
            <div className="circle circle1"></div>
            <div className="circle circle2"></div>
            <div className="circle circle3"></div>
          </div>

          {/* Right panel (form box matching login) */}
          <div className="register-right">
            <div className="register-form-box">
              <h3>Hello !</h3>
              <h4>
                <span className="highlight">Good Morning</span>
              </h4>
              <p>
                <span className="login-text">Register</span> Your Account
              </p>

              {submitted ? (
                <div className="text-center py-12" style={{ textAlign: "center" }}>
                  <CheckCircle
                    size={56}
                    style={{ color: "#22C55E", margin: "0 auto 1rem" }}
                  />
                  <h3 style={{ color: "#0F172A", fontWeight: 700, fontSize: "1.25rem" }}>
                    Registration Successful!
                  </h3>
                  <p style={{ color: "#64748B", marginTop: "0.5rem", fontSize: "0.875rem" }}>
                    Redirecting to login...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="input-box">
                    <input
                      type="text"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-box">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-box">
                    <input
                      type="text"
                      placeholder="Residential Address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-box" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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

                  <div className="input-box" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
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
                      title={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {error && <p style={{ color: "red", fontSize: "0.875rem", margin: "10px 0" }}>{error}</p>}

                  <div className="options" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.agreePolicy}
                        onChange={(e) => setForm({ ...form, agreePolicy: e.target.checked })}
                        required
                        style={{ margin: 0 }}
                      />
                      <span>I agree to the <span style={{ color: "#ff6600", fontWeight: 600 }}>Privacy Policy</span></span>
                    </label>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "REGISTERING..." : "REGISTER"}
                  </button>

                  <div className="create-account">
                    Already have an account? <a href="/login"> Sign In</a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-screen">
      <div className="register-tech-container">
        {/* Left panel (circles overlay matching login) */}
        <div className="register-left">
          <div className="register-overlay">
            <h1>Join As Technician</h1>
            <p>Create Your Account</p>
            <span className="site-link" style={{ bottom: '-270px' }}>www.materix.com</span>
          </div>
          <div className="circle circle1"></div>
          <div className="circle circle2"></div>
          <div className="circle circle3"></div>
        </div>

        {/* Right panel (form box scrollable) */}
        <div className="register-tech-right">
          <div className="register-tech-form-box">
            <h3>Hello !</h3>
            <h4>
              <span className="highlight">Good Morning</span>
            </h4>
            <p>
              <span className="login-text">Register</span> Your Account
            </p>

            {submitted ? (
              <div className="text-center py-12" style={{ textAlign: "center" }}>
                <CheckCircle
                  size={56}
                  style={{ color: "#22C55E", margin: "0 auto 1rem" }}
                />
                <h3 style={{ color: "#0F172A", fontWeight: 700, fontSize: "1.25rem" }}>
                  Registration Submitted!
                </h3>
                <p style={{ color: "#64748B", marginTop: "0.5rem", fontSize: "0.875rem" }}>
                  Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Row 1: Username + Email */}
                <div className="tech-grid-2">
                  <div className="input-box" style={{ margin: 0 }}>
                    <input
                      type="text"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-box" style={{ margin: 0 }}>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Address + CNI */}
                <div className="tech-grid-2">
                  <div className="input-box" style={{ margin: 0 }}>
                    <input
                      type="text"
                      placeholder="Address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-box" style={{ margin: 0 }}>
                    <input
                      type="text"
                      placeholder="CNI Number"
                      value={form.cni}
                      onChange={(e) => setForm({ ...form, cni: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Specialty + Category */}
                <div className="tech-grid-2">
                  <div className="input-box" style={{ margin: 0 }}>
                    <input
                      type="text"
                      placeholder="Specialty (e.g. Wiring)"
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-box" style={{ margin: 0 }}>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                      style={{ cursor: "pointer", color: form.category ? "#000" : "#757575" }}
                    >
                      <option value="" disabled hidden>Select category</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="mason">Mason</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Password + Confirm */}
                <div className="tech-grid-2">
                  <div className="input-box" style={{ position: "relative", display: "flex", alignItems: "center", margin: 0 }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  <div className="input-box" style={{ position: "relative", display: "flex", alignItems: "center", margin: 0 }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
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
                      title={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {form.password && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "6px",
                            borderRadius: "9999px",
                            transition: "all 0.3s",
                            backgroundColor: i <= passwordStrength.score ? passwordStrength.color : "#e2e8f0"
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: passwordStrength.color, fontWeight: 600, margin: 0 }}>
                      Strength: {passwordStrength.label}
                    </p>
                  </div>
                )}

                {/* Password Match Indicator */}
                {form.confirmPassword && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          transition: "all 0.3s",
                          width: `${matchScore}%`,
                          backgroundColor: matchColor
                        }}
                      />
                    </div>
                    <p style={{ fontSize: "11px", color: matchColor, fontWeight: 600, marginTop: "4px", margin: 0 }}>
                      {matchLabel}
                    </p>
                  </div>
                )}

                {/* Supporting Documents Upload */}
                <div style={{ margin: "16px 0" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                    Supporting Documents <span style={{ color: "#94a3b8", fontWeight: 400 }}>(max 3 files)</span>
                  </label>

                  {uploadedFiles.length < 3 && (
                    <div
                      className="tech-upload-box"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={24} style={{ color: "#ff6600", margin: "0 auto 0.5rem" }} />
                      <p style={{ fontSize: "14px", color: "#334155", fontWeight: 500, margin: 0 }}>
                        Drag & drop or <span style={{ color: "#ff6600" }}>browse files</span>
                      </p>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px", margin: 0 }}>
                        PDF, JPG, PNG — up to 10MB each
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          handleFileAdd(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="uploaded-docs-list">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="uploaded-doc-badge">
                          <FileText size={14} style={{ color: "#22c55e" }} />
                          <span style={{ maxWidth: "8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))
                            }
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#ef4444",
                              border: "none",
                              color: "white",
                              cursor: "pointer",
                              padding: 0
                            }}
                            title="Remove file"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Privacy Policy */}
                <div className="options" style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.agreePolicy}
                      onChange={(e) => setForm({ ...form, agreePolicy: e.target.checked })}
                      required
                      style={{ margin: 0 }}
                    />
                    <span>I agree to the <span style={{ color: "#ff6600", fontWeight: 600 }}>Privacy Policy</span></span>
                  </label>
                </div>

                {error && <p style={{ color: "red", fontSize: "0.875rem", margin: "10px 0" }}>{error}</p>}

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "REGISTERING..." : "REGISTER"}
                </button>

                <div className="create-account">
                  Already have an account?<a href="/login"> Sign In</a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;