import React, { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, X, Upload, FileText, CheckCircle } from "lucide-react";

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

  // If not a technician, show simple client form
  if (role !== "technician") {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F1F5F9" }}>
        {/* Left panel */}
        <div
          className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col items-center justify-between p-10 relative overflow-hidden"
          style={{ backgroundColor: "#0F172A" }}
        >
          <div
            className="absolute top-12 left-12 w-28 h-28 rounded-full"
            style={{
              background: "radial-gradient(circle at 40% 40%, #FF8C00, #7C2D00)",
              opacity: 0.9,
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute top-28 left-32 w-16 h-16 rounded-full"
            style={{
              background: "radial-gradient(circle at 40% 40%, #FACC15, #B45309)",
              opacity: 0.7,
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute bottom-24 right-10 w-36 h-36 rounded-full"
            style={{
              background: "radial-gradient(circle at 40% 40%, #EF4444, #7C0000)",
              opacity: 0.8,
              filter: "blur(2px)",
            }}
          />
          <div className="w-full z-10">
            <span
              style={{
                color: "#FACC15",
                fontWeight: 800,
                fontSize: "2rem",
                fontFamily: "Montserrat, Inter, sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              MATERIX
            </span>
          </div>
          <div className="z-10 text-center">
            <h2
              style={{
                color: "#FF8C00",
                fontSize: "2rem",
                fontWeight: 700,
                fontFamily: "Montserrat, Inter, sans-serif",
              }}
            >
              Join as Client
            </h2>
            <p style={{ color: "#94A3B8", marginTop: "0.75rem", fontSize: "1rem" }}>
              Create Your Account
            </p>
          </div>
          <div className="z-10">
            <p style={{ color: "#475569", fontSize: "0.75rem" }}>www.materix.com</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                Welcome!
              </p>
              <h1
                style={{
                  color: "#FF8C00",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  fontFamily: "Montserrat, Inter, sans-serif",
                }}
              >
                Register
              </h1>
              <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Client Signup Form
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: "Username", name: "username", type: "text", placeholder: "Enter username" },
                  { label: "Email Address", name: "email", type: "email", placeholder: "Enter email" },
                  { label: "Address", name: "address", type: "text", placeholder: "Enter address" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      className={inputClass}
                      style={inputStyle}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                      placeholder="Create password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={(e) => Object.assign(e.target.style, { ...inputFocusStyle, paddingRight: "3rem" })}
                      onBlur={(e) => Object.assign(e.target.style, { ...inputStyle, paddingRight: "3rem" })}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={inputClass}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      onFocus={(e) => Object.assign(e.target.style, { ...inputFocusStyle, paddingRight: "3rem" })}
                      onBlur={(e) => Object.assign(e.target.style, { ...inputStyle, paddingRight: "3rem" })}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p style={{ color: "#EF4444", fontSize: "0.875rem" }}>{error}</p>}
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="policy" checked={form.agreePolicy}
                    onChange={(e) => setForm({ ...form, agreePolicy: e.target.checked })}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "#FF8C00" }} required />
                  <label htmlFor="policy" className="text-sm cursor-pointer" style={{ color: "#64748B" }}>
                    I agree to the{" "}
                    <span style={{ color: "#FF8C00", fontWeight: 600 }}>Privacy Policy</span>
                  </label>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: loading ? "#94A3B8" : "#FF8C00", border: "none", fontSize: "0.9rem", letterSpacing: "0.08em" }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#E67E00"; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#FF8C00"; }}>
                  {loading ? "REGISTERING..." : "REGISTER"}
                </button>
                <p className="text-center text-sm" style={{ color: "#64748B" }}>
                  Already have an account?{" "}
                  <button type="button" onClick={() => navigate("/login")} className="cursor-pointer"
                    style={{ color: "#FF8C00", fontWeight: 600, background: "none", border: "none" }}>
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F1F5F9" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col items-center justify-between p-10 relative overflow-hidden"
        style={{ backgroundColor: "#0F172A" }}
      >
        <div
          className="absolute top-12 left-12 w-28 h-28 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, #FF8C00, #7C2D00)",
            opacity: 0.9,
            filter: "blur(1px)",
          }}
        />
        <div
          className="absolute top-28 left-32 w-16 h-16 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, #FACC15, #B45309)",
            opacity: 0.7,
            filter: "blur(1px)",
          }}
        />
        <div
          className="absolute bottom-24 right-10 w-36 h-36 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, #EF4444, #7C0000)",
            opacity: 0.8,
            filter: "blur(2px)",
          }}
        />
        <div
          className="absolute bottom-40 right-28 w-20 h-20 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, #FF8C00, #431400)",
            opacity: 0.6,
          }}
        />

        <div className="w-full z-10">
          <span
            style={{
              color: "#FACC15",
              fontWeight: 800,
              fontSize: "2rem",
              fontFamily: "Montserrat, Inter, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            MATERIX
          </span>
        </div>

        <div className="z-10 text-center">
          <h2
            style={{
              color: "#FF8C00",
              fontSize: "2rem",
              fontWeight: 700,
              fontFamily: "Montserrat, Inter, sans-serif",
            }}
          >
            Join as Technician
          </h2>
          <p style={{ color: "#94A3B8", marginTop: "0.75rem", fontSize: "1rem" }}>
            Create Your Account
          </p>
        </div>

        <div className="z-10">
          <p style={{ color: "#475569", fontSize: "0.75rem" }}>www.materix.com</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              Welcome!
            </p>
            <h1
              style={{
                color: "#FF8C00",
                fontSize: "1.75rem",
                fontWeight: 700,
                fontFamily: "Montserrat, Inter, sans-serif",
              }}
            >
              Register
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Technician Signup Form
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-12">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Username + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Username
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Enter username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Enter email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Address + CNI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Address
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Enter address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    CNI Number
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Enter CNI number"
                    value={form.cni}
                    onChange={(e) => setForm({ ...form, cni: e.target.value })}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Specialty + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Specialty
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. Electrical Wiring"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Category
                  </label>
                  <select
                    className={inputClass}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="carpenter">Carpenter</option>
                    <option value="mason">Mason</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                      placeholder="Create password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={(e) =>
                        Object.assign(e.target.style, { ...inputFocusStyle, paddingRight: "3rem" })
                      }
                      onBlur={(e) =>
                        Object.assign(e.target.style, { ...inputStyle, paddingRight: "3rem" })
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ background: "none", border: "none", color: "#94A3B8" }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor:
                                i <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "#E2E8F0",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: passwordStrength.color, fontWeight: 600 }}>
                        Strength: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={inputClass}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      onFocus={(e) =>
                        Object.assign(e.target.style, { ...inputFocusStyle, paddingRight: "3rem" })
                      }
                      onBlur={(e) =>
                        Object.assign(e.target.style, { ...inputStyle, paddingRight: "3rem" })
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ background: "none", border: "none", color: "#94A3B8" }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.confirmPassword && (
                    <div className="mt-2">
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "#E2E8F0" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${matchScore}%`, backgroundColor: matchColor }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: matchColor, fontWeight: 600 }}>
                        {matchLabel}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Documents */}
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "#334155" }}>
                  Supporting Documents{" "}
                  <span style={{ color: "#94A3B8", fontWeight: 400 }}>(max 3 files)</span>
                </label>

                {uploadedFiles.length < 3 && (
                  <div
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: dragOver ? "#FF8C00" : "rgba(15,23,42,0.15)",
                      backgroundColor: dragOver ? "#FFF3E0" : "#F8FAFC",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={24} style={{ color: "#FF8C00", margin: "0 auto 0.5rem" }} />
                    <p className="text-sm" style={{ color: "#334155", fontWeight: 500 }}>
                      Drag & drop or{" "}
                      <span style={{ color: "#FF8C00" }}>browse files</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                      PDF, JPG, PNG — up to 10MB each
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        handleFileAdd(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="relative flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                        style={{
                          backgroundColor: "#F0FDF4",
                          borderColor: "#BBF7D0",
                          color: "#166534",
                        }}
                      >
                        <FileText size={14} style={{ color: "#22C55E", flexShrink: 0 }} />
                        <span style={{ maxWidth: "8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))
                          }
                          className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
                          style={{
                            backgroundColor: "#EF4444",
                            border: "none",
                            color: "white",
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
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="policy"
                  checked={form.agreePolicy}
                  onChange={(e) => setForm({ ...form, agreePolicy: e.target.checked })}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#FF8C00" }}
                  required
                />
                <label htmlFor="policy" className="text-sm cursor-pointer" style={{ color: "#64748B" }}>
                  I agree to the{" "}
                  <span style={{ color: "#FF8C00", fontWeight: 600, cursor: "pointer" }}>
                    Privacy Policy
                  </span>
                </label>
              </div>

              {error && (
                <p style={{ color: "#EF4444", fontSize: "0.875rem", fontWeight: 500 }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: loading ? "#94A3B8" : "#FF8C00",
                  border: "none",
                  fontSize: "0.9rem",
                  letterSpacing: "0.08em",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#E67E00";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#FF8C00";
                }}
              >
                {loading ? "REGISTERING..." : "REGISTER"}
              </button>

              <p className="text-center text-sm" style={{ color: "#64748B" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="cursor-pointer"
                  style={{
                    color: "#FF8C00",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                  }}
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;