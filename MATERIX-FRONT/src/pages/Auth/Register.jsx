import React, { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Eye, EyeOff, X, Upload, FileText, CheckCircle, 
  Camera, Check, Phone, Mail, Clock, ChevronDown, 
  Plus, Image as ImageIcon 
} from "lucide-react";
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


/* ── Multi-step Wizard Helpers ── */
const STEPS = [
  { label: "Personal Information", sub: "Basic details" },
  { label: "Professional Info", sub: "Skills & services" },
  { label: "Experience & Portfolio", sub: "Showcase your work" },
  { label: "Documents", sub: "Upload documents" },
  { label: "Account & Review", sub: "Create login credentials" },
];

function Sidebar() {
  return (
    <div className="flex flex-col gap-4">
      {/* Quick Tips */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", marginBottom: "0.875rem" }}>Quick Tips</h3>
        <div className="flex flex-col gap-2.5">
          {[
            "Use a clear professional photo",
            "Add accurate information",
            "Upload valid documents",
            "Showcase your best work",
            "Complete all steps for verification",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#FFF3E0" }}>
                <Check size={10} style={{ color: "#FF8C00" }} strokeWidth={3} />
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why complete */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#FFF3E0", border: "1px solid rgba(255,140,0,0.2)" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", marginBottom: "0.5rem" }}>Why complete your profile?</h3>
        <p style={{ fontSize: "0.8125rem", color: "#78350F", lineHeight: 1.6 }}>
          Completed profiles get <strong>3× more job requests</strong> and higher client trust.
        </p>
      </div>

      {/* What happens next */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", marginBottom: "0.875rem" }}>What happens next?</h3>
        <div className="flex flex-col gap-3">
          {[
            "Submit your registration",
            "Our team reviews your profile",
            "Get verified and start receiving jobs",
            "Build your reputation and grow",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#0F172A" }}>
                <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "#FACC15" }}>{i + 1}</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.5 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Need Help */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", marginBottom: "0.875rem" }}>Need Help?</h3>
        <p style={{ fontSize: "0.8125rem", color: "#64748B", marginBottom: "0.75rem" }}>Contact support if you need assistance.</p>
        <div className="flex flex-col gap-2">
          {[
            { icon: <Phone size={13} />, text: "+233 59 123 4567" },
            { icon: <Mail size={13} />, text: "support@materix.com" },
            { icon: <Clock size={13} />, text: "Mon–Sat: 8:00 AM – 6:00 PM" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2" style={{ color: "#64748B", fontSize: "0.8125rem" }}>
              <span style={{ color: "#FF8C00" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-between w-full mb-8 relative px-4">
      {/* Background connecting line */}
      <div 
        className="absolute top-4 left-8 right-8 h-0.5 z-0" 
        style={{ backgroundColor: "#E2E8F0" }}
      />
      {/* Foreground orange line */}
      <div 
        className="absolute top-4 left-8 h-0.5 z-0 transition-all duration-300" 
        style={{ 
          backgroundColor: "#FF8C00", 
          width: `${(current / (STEPS.length - 1)) * 84}%` 
        }}
      />
      
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-col items-center z-10 relative flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: done || active ? "#FF8C00" : "#ffffff",
                border: `2px solid ${done || active ? "#FF8C00" : "#E2E8F0"}`,
                boxShadow: active ? "0 0 0 3px rgba(255,140,0,0.2)" : "none"
              }}
            >
              {done ? (
                <Check size={14} style={{ color: "white" }} strokeWidth={3} />
              ) : (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: active ? "white" : "#94A3B8" }}>
                  {i + 1}
                </span>
              )}
            </div>
            <div className="text-center mt-2">
              <p 
                style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: active || done ? 700 : 500, 
                  color: active ? "#FF8C00" : done ? "#16A34A" : "#94A3B8",
                  whiteSpace: "nowrap" 
                }}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="tech-input-group">
      <label className="tech-label">
        {label}{required && <span className="tech-label-required">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      className="tech-input"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function SelectInput({ options, value, onChange, placeholder }) {
  return (
    <div className="relative">
      <select
        className="tech-select animate-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ appearance: "none", cursor: "pointer", paddingRight: "2.5rem" }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
    </div>
  );
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
  const photoInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [showPasswordTech, setShowPasswordTech] = useState(false);
  const [showConfirmTech, setShowConfirmTech] = useState(false);
  const [dragOverDoc, setDragOverDoc] = useState(false);
  const [dragOverPortfolio, setDragOverPortfolio] = useState(false);

  const [techForm, setTechForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
    address: "",
    cni: "",
    photo: null,
    photoPreview: null,
    service: "",
    customService: "",
    experience: "",
    availability: "",
    radius: "",
    about: "",
    specializations: "",
    photos: [],
    docs: [],
    username: "",
    password: "",
    confirmPassword: "",
    agreePolicy: false,
  });

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

  /* ── Technician Wizard Helper Handlers ── */
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTechForm(prev => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handlePhotoAddTech = (files) => {
    if (!files) return;
    const remaining = 6 - techForm.photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    setTechForm(prev => ({
      ...prev,
      photos: [
        ...prev.photos,
        ...toAdd.map(f => ({
          id: Math.random().toString(36).slice(2),
          name: f.name,
          url: URL.createObjectURL(f),
          file: f
        }))
      ]
    }));
  };

  const handlePhotoRemoveTech = (id) => {
    setTechForm(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== id)
    }));
  };

  const handleFileAddTech = (files) => {
    if (!files) return;
    const remaining = 3 - techForm.docs.length;
    const toAdd = Array.from(files).slice(0, remaining);
    setTechForm(prev => ({
      ...prev,
      docs: [
        ...prev.docs,
        ...toAdd.map(f => ({
          id: Math.random().toString(36).slice(2),
          name: f.name,
          size: f.size,
          file: f
        }))
      ]
    }));
  };

  const handleFileRemoveTech = (id) => {
    setTechForm(prev => ({
      ...prev,
      docs: prev.docs.filter(d => d.id !== id)
    }));
  };

  const isStepValid = (stepIndex) => {
    if (stepIndex === 0) {
      return (
        techForm.firstName.trim() !== "" &&
        techForm.lastName.trim() !== "" &&
        techForm.dob.trim() !== "" &&
        techForm.gender !== "" &&
        techForm.phone.trim() !== "" &&
        techForm.email.trim() !== "" &&
        techForm.city.trim() !== "" &&
        techForm.cni.trim() !== "" &&
        techForm.address.trim() !== ""
      );
    }
    if (stepIndex === 1) {
      return (
        techForm.service !== "" &&
        techForm.experience !== "" &&
        techForm.availability !== "" &&
        techForm.radius !== "" &&
        techForm.about.trim() !== "" &&
        (techForm.service !== "other" || techForm.customService.trim() !== "")
      );
    }
    if (stepIndex === 2) {
      return true; // Portfolio steps are optional
    }
    if (stepIndex === 3) {
      return true; // Recommended documents are optional to proceed
    }
    if (stepIndex === 4) {
      const strength = getPasswordStrength(techForm.password);
      return (
        techForm.username.trim() !== "" &&
        techForm.password.trim() !== "" &&
        techForm.confirmPassword.trim() !== "" &&
        techForm.password === techForm.confirmPassword &&
        techForm.agreePolicy &&
        techForm.password.length >= 8 &&
        strength.score >= 2
      );
    }
    return false;
  };

  const handleNextTech = () => {
    if (!isStepValid(step)) {
      setError("Please fill in all required fields correctly.");
      return;
    }
    setError("");
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleSubmitTech = async (e) => {
    e.preventDefault();
    setError("");

    if (!isStepValid(4)) {
      setError("Please complete all security checks and accept the policies.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", techForm.username);
      formData.append("email", techForm.email);
      formData.append("password", techForm.password);
      formData.append("role", "technician");
      formData.append("address", `${techForm.city}, ${techForm.address}`);
      formData.append(
        "specialty",
        techForm.specializations || techForm.customService || techForm.service
      );
      formData.append("cni_number", techForm.cni);

      // Add extra fields for the TechnicianApplication document
      formData.append("first_name", techForm.firstName);
      formData.append("last_name", techForm.lastName);
      formData.append("phone", techForm.phone);
      formData.append("whatsapp", techForm.whatsapp);
      formData.append("dob", techForm.dob);
      formData.append("gender", techForm.gender);
      formData.append("city", techForm.city);
      formData.append("service", techForm.service);
      formData.append("custom_service", techForm.customService);
      formData.append("experience", techForm.experience);
      formData.append("availability", techForm.availability);
      formData.append("radius", techForm.radius);
      formData.append("about", techForm.about);
      formData.append("specializations", techForm.specializations);

      // Append files
      if (techForm.photo) {
        formData.append("photo", techForm.photo);
      }
      if (techForm.photos && techForm.photos.length > 0) {
        techForm.photos.forEach((p) => {
          if (p.file) {
            formData.append("portfolio_photos", p.file);
          }
        });
      }
      if (techForm.docs && techForm.docs.length > 0) {
        techForm.docs.forEach((d) => {
          if (d.file) {
            formData.append("documents", d.file);
          }
        });
      }

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status === 201) {
        setSubmitted(true);
        setTimeout(() => {
          navigate("/verify", { state: { email: techForm.email } });
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
            <span className="site-link" style={{ bottom: '-310px' }}>www.materix.com</span>
          </div>
          <div className="circle circle1"></div>
          <div className="circle circle2"></div>
          <div className="circle circle3"></div>
        </div>

        {/* Right panel (stepper + forms + sidebar) */}
        <div className="register-tech-right">
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontWeight: 800, fontSize: "1.625rem", color: "#0F172A", fontFamily: "Montserrat, Inter, sans-serif", margin: 0 }}>
              Technician Registration
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "4px", margin: 0 }}>
              Create your account and build your professional profile
            </p>
          </div>

          <Stepper current={step} />

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#F0FDF4" }}>
                <Check size={32} style={{ color: "#22C55E" }} strokeWidth={3} />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#0F172A", margin: 0 }}>Registration Submitted!</h2>
              <p style={{ color: "#64748B", marginTop: "8px", fontSize: "0.875rem", margin: 0 }}>Redirecting to email verification...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
              {/* Main Content (Columns 1-3) */}
              <div className="xl:col-span-3 pr-2">
                {step === 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main form */}
                    <div className="lg:col-span-2 tech-card">
                      <h3 className="tech-title">Personal Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="First Name" required>
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="First name"
                            value={techForm.firstName}
                            onChange={e => setTechForm(prev => ({ ...prev, firstName: e.target.value }))}
                            required
                          />
                        </Field>
                        <Field label="Last Name" required>
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="Last name"
                            value={techForm.lastName}
                            onChange={e => setTechForm(prev => ({ ...prev, lastName: e.target.value }))}
                            required
                          />
                        </Field>
                        <Field label="Date of Birth" required>
                          <input
                            type="date"
                            className="tech-input"
                            value={techForm.dob}
                            onChange={e => setTechForm(prev => ({ ...prev, dob: e.target.value }))}
                            required
                          />
                        </Field>
                        <Field label="Gender" required>
                          <select
                            className="tech-select animate-none"
                            value={techForm.gender}
                            onChange={e => setTechForm(prev => ({ ...prev, gender: e.target.value }))}
                            required
                          >
                            <option value="" disabled hidden>Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </Field>
                        <Field label="Phone Number" required>
                          <input
                            type="tel"
                            className="tech-input"
                            placeholder="+237 6XX XXX XXX"
                            value={techForm.phone}
                            onChange={e => setTechForm(prev => ({ ...prev, phone: e.target.value }))}
                            required
                          />
                        </Field>
                        <Field label="WhatsApp Number">
                          <input
                            type="tel"
                            className="tech-input"
                            placeholder="+237 6XX XXX XXX"
                            value={techForm.whatsapp}
                            onChange={e => setTechForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                          />
                        </Field>
                        <Field label="Email Address" required>
                          <input
                            type="email"
                            className="tech-input"
                            placeholder="you@example.com"
                            value={techForm.email}
                            onChange={e => setTechForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </Field>
                        <Field label="City / Location" required>
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="e.g. Yaoundé"
                            value={techForm.city}
                            onChange={e => setTechForm(prev => ({ ...prev, city: e.target.value }))}
                            required
                          />
                        </Field>
                        <Field label="CNI Number" required>
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="National ID Card number"
                            value={techForm.cni}
                            onChange={e => setTechForm(prev => ({ ...prev, cni: e.target.value }))}
                            required
                          />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label="Full Address" required>
                            <input
                              type="text"
                              className="tech-input"
                              placeholder="Street address, district..."
                              value={techForm.address}
                              onChange={e => setTechForm(prev => ({ ...prev, address: e.target.value }))}
                              required
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                    
                    {/* Photo Box */}
                    <div className="tech-card">
                      <h3 className="tech-title">Profile Photo</h3>
                      <div 
                        className="tech-avatar-circle-container animate-none"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <div className="tech-avatar-circle">
                          {techForm.photoPreview ? (
                            <img src={techForm.photoPreview} alt="Profile" className="tech-avatar-preview" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-4 text-center">
                              <div className="w-14 h-14 rounded-full flex items-center justify-center animate-none" style={{ backgroundColor: "#FFF3E0" }}>
                                <Camera size={24} style={{ color: "#FF8C00" }} />
                              </div>
                              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151", margin: 0 }}>Upload Photo</p>
                              <p style={{ fontSize: "0.6875rem", color: "#94A3B8", margin: 0 }}>JPG, PNG (max 2MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <input 
                        ref={photoInputRef}
                        type="file"
                        style={{ display: "none" }}
                        accept="image/jpg,image/jpeg,image/png"
                        onChange={handleProfilePhotoChange}
                      />
                      {techForm.photoPreview && (
                        <button 
                          type="button"
                          className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg cursor-pointer transition-colors" 
                          style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "none" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTechForm(prev => ({ ...prev, photo: null, photoPreview: null }));
                          }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="tech-card">
                    <h3 className="tech-title">Professional Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Service Offered" required>
                        <select
                          className="tech-select animate-none"
                          value={techForm.service}
                          onChange={e => {
                            const v = e.target.value;
                            setTechForm(prev => ({
                              ...prev,
                              service: v,
                              customService: v !== "other" ? "" : prev.customService
                            }));
                          }}
                          required
                        >
                          <option value="" disabled hidden>Select service</option>
                          <option value="electrician">Electrician</option>
                          <option value="plumber">Plumber</option>
                          <option value="mason">Mason</option>
                          <option value="carpenter">Carpenter</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>

                      {techForm.service === "other" && (
                        <Field label="Specify Your Profession" required>
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="e.g. Painter, Welder, HVAC..."
                            value={techForm.customService}
                            onChange={e => setTechForm(prev => ({ ...prev, customService: e.target.value }))}
                            required
                          />
                        </Field>
                      )}

                      <Field label="Years of Experience" required>
                        <select
                          className="tech-select animate-none"
                          value={techForm.experience}
                          onChange={e => setTechForm(prev => ({ ...prev, experience: e.target.value }))}
                          required
                        >
                          <option value="" disabled hidden>Select experience</option>
                          <option value="0-1">Less than 1 year</option>
                          <option value="1-3">1 – 3 years</option>
                          <option value="3-5">3 – 5 years</option>
                          <option value="5-10">5 – 10 years</option>
                          <option value="10+">10+ years</option>
                        </select>
                      </Field>

                      <Field label="Availability Status" required>
                        <select
                          className="tech-select animate-none"
                          value={techForm.availability}
                          onChange={e => setTechForm(prev => ({ ...prev, availability: e.target.value }))}
                          required
                        >
                          <option value="" disabled hidden>Select availability</option>
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="weekends">Weekends Only</option>
                        </select>
                      </Field>

                      <Field label="Service Radius (km)" required>
                        <select
                          className="tech-select animate-none"
                          value={techForm.radius}
                          onChange={e => setTechForm(prev => ({ ...prev, radius: e.target.value }))}
                          required
                        >
                          <option value="" disabled hidden>Select radius</option>
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                          <option value="20">20 km</option>
                          <option value="50">50 km</option>
                          <option value="100">100 km</option>
                        </select>
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="About You" required>
                          <textarea
                            className="tech-textarea"
                            placeholder="Tell clients about yourself, your experience, and what makes you professional."
                            value={techForm.about}
                            onChange={e => setTechForm(prev => ({ ...prev, about: e.target.value }))}
                            rows={4}
                            style={{ resize: "vertical" }}
                            required
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-2">
                        <Field label="Specializations">
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="e.g. Solar panels, EV charging, smart wiring..."
                            value={techForm.specializations}
                            onChange={e => setTechForm(prev => ({ ...prev, specializations: e.target.value }))}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="tech-card">
                    <h3 className="tech-title" style={{ margin: 0 }}>Portfolio</h3>
                    <p className="tech-subtitle" style={{ margin: "4px 0 16px 0" }}>Showcase your best work — up to 6 project photos.</p>

                    <div className="tech-portfolio-grid">
                      {techForm.photos.map(photo => (
                        <div key={photo.id} className="tech-portfolio-item animate-none">
                          <img src={photo.url} alt={photo.name} />
                          <button
                            type="button"
                            onClick={() => handlePhotoRemoveTech(photo.id)}
                            className="tech-portfolio-item-remove"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {techForm.photos.length < 6 && (
                        <div
                          className="tech-portfolio-add-box"
                          onClick={() => portfolioInputRef.current?.click()}
                        >
                          <Plus size={20} style={{ color: "#94A3B8" }} />
                          <span style={{ fontSize: "0.625rem", color: "#94A3B8", marginTop: "2px" }}>Add</span>
                        </div>
                      )}
                    </div>

                    <div
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                      style={{ 
                        borderColor: dragOverPortfolio ? "#FF8C00" : "#E2E8F0", 
                        backgroundColor: dragOverPortfolio ? "#FFF3E0" : "#F8FAFC" 
                      }}
                      onClick={() => portfolioInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOverPortfolio(true); }}
                      onDragLeave={() => setDragOverPortfolio(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setDragOverPortfolio(false);
                        handlePhotoAddTech(e.dataTransfer.files);
                      }}
                    >
                      <ImageIcon size={28} style={{ color: "#FF8C00", margin: "0 auto 0.5rem" }} />
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", margin: 0 }}>
                        Drag & drop or <span style={{ color: "#FF8C00" }}>browse photos</span>
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px", margin: 0 }}>
                        JPG, PNG — max 5MB each · {6 - techForm.photos.length} remaining
                      </p>
                    </div>
                    <input 
                      ref={portfolioInputRef} 
                      type="file" 
                      style={{ display: "none" }} 
                      multiple 
                      accept="image/*" 
                      onChange={e => { handlePhotoAddTech(e.target.files); e.target.value = ""; }} 
                    />

                    <div className="mt-4">
                      <Field label="Project Description">
                        <textarea
                          className="tech-textarea"
                          placeholder="Describe the project, your role and the outcome..."
                          value={techForm.projectDesc}
                          onChange={e => setTechForm(prev => ({ ...prev, projectDesc: e.target.value }))}
                          rows={3}
                          style={{ resize: "vertical" }}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="tech-card">
                    <h3 className="tech-title" style={{ margin: 0 }}>Supporting Documents</h3>
                    <p className="tech-subtitle" style={{ margin: "4px 0 16px 0" }}>Upload documents to verify your identity and professionalism.</p>

                    {techForm.docs.length < 3 && (
                      <div
                        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4"
                        style={{ 
                          borderColor: dragOverDoc ? "#FF8C00" : "#E2E8F0", 
                          backgroundColor: dragOverDoc ? "#FFF3E0" : "#F8FAFC" 
                        }}
                        onClick={() => documentInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOverDoc(true); }}
                        onDragLeave={() => setDragOverDoc(false)}
                        onDrop={e => { e.preventDefault(); setDragOverDoc(false); handleFileAddTech(e.dataTransfer.files); }}
                      >
                        <Upload size={28} style={{ color: "#FF8C00", margin: "0 auto 0.5rem" }} />
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", margin: 0 }}>
                          Drag & Drop Files Here
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px", margin: 0 }}>
                          PDF, JPG, PNG · Max 10MB each · {3 - techForm.docs.length} files remaining
                        </p>
                        <button 
                          type="button"
                          className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" 
                          style={{ backgroundColor: "#FF8C00", color: "white", border: "none" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            documentInputRef.current?.click();
                          }}
                        >
                          Browse Files
                        </button>
                      </div>
                    )}

                    <input 
                      ref={documentInputRef} 
                      type="file" 
                      multiple 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={e => { handleFileAddTech(e.target.files); e.target.value = ""; }} 
                    />

                    {techForm.docs.length > 0 && (
                      <div className="flex flex-col gap-2 mb-5">
                        {techForm.docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                            <FileText size={16} style={{ color: "#22C55E", flexShrink: 0 }} />
                            <span className="flex-1 text-sm truncate" style={{ color: "#166534" }}>{doc.name}</span>
                            <button 
                              type="button"
                              onClick={() => handleFileRemoveTech(doc.id)} 
                              className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0" 
                              style={{ backgroundColor: "#EF4444", border: "none", color: "white" }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommended docs card */}
                    <div className="rounded-xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid rgba(15,23,42,0.08)" }}>
                      <h4 style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A", margin: "0 0 12px 0" }}>Recommended Documents</h4>
                      {[
                        { label: "National Identity Card (CNI)", required: true },
                        { label: "Professional Certificate", required: true },
                        { label: "Police Clearance", required: false },
                      ].map((doc, i) => (
                        <div key={i} className="tech-recommend-item">
                          <Check size={14} style={{ color: "#22C55E" }} strokeWidth={3} />
                          <span style={{ fontSize: "0.8125rem", color: "#374151" }}>{doc.label}</span>
                          {!doc.required && <span className="tech-recommend-badge-opt">(Optional)</span>}
                        </div>
                      ))}
                      <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "12px", lineHeight: 1.5, margin: 0 }}>
                        Providing these documents increases client trust and helps obtain a verified technician badge.
                      </p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="tech-card">
                    <h3 className="tech-title">Account Security</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Username" required>
                          <input
                            type="text"
                            className="tech-input"
                            placeholder="Choose a username"
                            value={techForm.username}
                            onChange={e => setTechForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                          />
                        </Field>
                      </div>

                      {/* Password */}
                      <div>
                        <Field label="Password" required>
                          <div className="relative">
                            <input
                              type={showPasswordTech ? "text" : "password"}
                              className="tech-input"
                              placeholder="Create password"
                              value={techForm.password}
                              onChange={e => setTechForm(prev => ({ ...prev, password: e.target.value }))}
                              style={{ paddingRight: "3rem" }}
                              required
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPasswordTech(!showPasswordTech)} 
                              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" 
                              style={{ background: "none", border: "none", color: "#94A3B8" }}
                            >
                              {showPasswordTech ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {techForm.password && (
                            <div className="mt-2">
                              <div className="flex gap-1 mb-1">
                                {[1,2,3,4,5].map(i => {
                                  const strength = getPasswordStrength(techForm.password);
                                  return (
                                    <div 
                                      key={i} 
                                      className="flex-1 h-1.5 rounded-full transition-all duration-300" 
                                      style={{ backgroundColor: i <= strength.score ? strength.color : "#E2E8F0" }} 
                                    />
                                  );
                                })}
                              </div>
                              {techForm.password && (
                                <p style={{ fontSize: "0.6875rem", color: getPasswordStrength(techForm.password).color, fontWeight: 700, margin: 0 }}>
                                  Strength: {getPasswordStrength(techForm.password).label}
                                </p>
                              )}
                            </div>
                          )}
                        </Field>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <Field label="Confirm Password" required>
                          <div className="relative">
                            <input
                              type={showConfirmTech ? "text" : "password"}
                              className="tech-input"
                              placeholder="Repeat password"
                              value={techForm.confirmPassword}
                              onChange={e => setTechForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              style={{ paddingRight: "3rem" }}
                              required
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowConfirmTech(!showConfirmTech)} 
                              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" 
                              style={{ background: "none", border: "none", color: "#94A3B8" }}
                            >
                              {showConfirmTech ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {techForm.confirmPassword && (
                            <div className="mt-2">
                              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
                                <div 
                                  className="h-full rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${techForm.confirmPassword === techForm.password ? 100 : Math.min(70, (techForm.confirmPassword.length / (techForm.password.length || 1)) * 70)}%`, 
                                    backgroundColor: techForm.confirmPassword === techForm.password ? "#22C55E" : "#EF4444" 
                                  }} 
                                />
                              </div>
                              <p 
                                style={{ 
                                  fontSize: "0.6875rem", 
                                  color: techForm.confirmPassword === techForm.password ? "#22C55E" : "#EF4444", 
                                  fontWeight: 700, 
                                  marginTop: "4px",
                                  margin: 0 
                                }}
                              >
                                {techForm.confirmPassword === techForm.password ? "Passwords match" : "Does not match"}
                              </p>
                            </div>
                          )}
                        </Field>
                      </div>

                      {/* Password rules */}
                      <div className="sm:col-span-2 rounded-xl p-4" style={{ backgroundColor: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", margin: "0 0 10px 0" }}>Password Rules:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[
                            { label: "At least 8 characters", ok: techForm.password.length >= 8 },
                            { label: "Uppercase letter", ok: /[A-Z]/.test(techForm.password) },
                            { label: "Lowercase letter", ok: /[a-z]/.test(techForm.password) },
                            { label: "Number", ok: /[0-9]/.test(techForm.password) },
                            { label: "Special character", ok: /[^A-Za-z0-9]/.test(techForm.password) },
                          ].map((rule, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check size={12} style={{ color: rule.ok ? "#22C55E" : "#CBD5E1" }} strokeWidth={3} />
                              <span style={{ fontSize: "0.75rem", color: rule.ok ? "#16A34A" : "#94A3B8" }}>{rule.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Privacy */}
                      <div className="sm:col-span-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={techForm.agreePolicy}
                            onChange={e => setTechForm(prev => ({ ...prev, agreePolicy: e.target.checked }))}
                            className="mt-0.5 cursor-pointer"
                            style={{ accentColor: "#FF8C00", width: "16px", height: "16px" }}
                            required
                          />
                          <label htmlFor="terms" style={{ fontSize: "0.8125rem", color: "#64748B", lineHeight: 1.6, cursor: "pointer", margin: 0 }}>
                            I agree to the{" "}
                            <span style={{ color: "#FF8C00", fontWeight: 600 }}>Privacy Policy</span>
                            {" "}and{" "}
                            <span style={{ color: "#FF8C00", fontWeight: 600 }}>Terms of Service</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && <p style={{ color: "red", fontSize: "0.875rem", margin: "10px 0" }}>{error}</p>}

                {/* Navigation controls */}
                <div className="tech-footer-actions">
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    disabled={step === 0}
                    className="tech-btn-back"
                  >
                    ← Back
                  </button>
                  <div className="tech-dot-indicator">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div 
                        key={i} 
                        className="tech-dot" 
                        style={{ 
                          backgroundColor: i === step ? "#FF8C00" : "#E2E8F0", 
                          width: i === step ? "24px" : "6px" 
                        }} 
                      />
                    ))}
                  </div>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextTech}
                      className="tech-btn-next"
                      disabled={!isStepValid(step)}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitTech}
                      className="tech-btn-next"
                      disabled={!isStepValid(4) || loading}
                    >
                      {loading ? "Registering..." : "Save & Continue →"}
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar (Column 4) */}
              <div className="xl:col-span-1">
                <Sidebar />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;