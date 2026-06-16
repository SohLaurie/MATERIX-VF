import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Lock, Eye, EyeOff, Save, User } from 'lucide-react';
import Navbar from './Navbar';
import NavbarDel from './Navbar_delivery';
import previewFallback from '../assets/images/man1.jpg';
import '../styles/admin-dashboard.css';

const baseUrl = "http://127.0.0.1:8000";

const Profile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('client');
  const [specialty, setSpecialty] = useState('');
  const [cniNumber, setCniNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [bio, setBio] = useState('');
  const [userId, setUserId] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Avatar files
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(previewFallback);
  
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success'); // 'success' | 'error'
  const [saving, setSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access');
      if (!token) return;

      try {
        const res = await axios.get(`${baseUrl}/api/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Split username into first and last name
        const username = res.data.username || '';
        const parts = username.trim().split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        
        setEmail(res.data.email || '');
        setAddress(res.data.address || '');
        setRole(res.data.role || 'client');
        setSpecialty(res.data.specialty || '');
        setCniNumber(res.data.cni_number || '');
        setUserId(res.data.id ?? res.data._id ?? '1024');

        // Load custom fields from localstorage
        setMobileNumber(localStorage.getItem(`profile_phone_${res.data.email}`) || '+237 690 123 456');
        setGender(localStorage.getItem(`profile_gender_${res.data.email}`) || 'Male');
        setBio(localStorage.getItem(`profile_bio_${res.data.email}`) || 'Senior electrical technician with 8+ years of field experience.');

        if (res.data.profile_picture) {
          const profilePicUrl = res.data.profile_picture.startsWith('http')
            ? res.data.profile_picture
            : `${baseUrl}${res.data.profile_picture}`;
          setPreviewPic(profilePicUrl);
          localStorage.setItem('profile_picture', profilePicUrl);
        } else {
          setPreviewPic(previewFallback);
        }

        localStorage.setItem('username', username);
        localStorage.setItem('role', res.data.role || 'client');
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewPic(URL.createObjectURL(file));
    }
  };

  const handleDeleteAvatar = () => {
    setProfilePic(''); // Setting to empty string indicates deletion to backend
    setPreviewPic(previewFallback);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    
    const token = localStorage.getItem('access');
    if (!token) {
      setMsgType('error');
      setMessage('You must be logged in.');
      setSaving(false);
      return;
    }

    const formData = new FormData();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    formData.append('username', fullName);
    formData.append('address', address);
    formData.append('specialty', specialty);
    formData.append('cni_number', cniNumber);

    if (profilePic !== null) {
      formData.append('profile_picture', profilePic);
    }

    try {
      const res = await axios.put(`${baseUrl}/api/profile/update/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      localStorage.setItem('username', res.data.username);
      
      // Save local fields
      localStorage.setItem(`profile_phone_${email}`, mobileNumber);
      localStorage.setItem(`profile_gender_${email}`, gender);
      localStorage.setItem(`profile_bio_${email}`, bio);

      if (res.data.profile_picture) {
        const profilePicUrl = res.data.profile_picture.startsWith('http')
          ? res.data.profile_picture
          : `${baseUrl}${res.data.profile_picture}`;
        localStorage.setItem('profile_picture', profilePicUrl);
        setPreviewPic(profilePicUrl);
      } else {
        localStorage.removeItem('profile_picture');
        setPreviewPic(previewFallback);
      }

      setProfilePic(null);
      
      setMsgType('success');
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setMsgType('error');
      const backendErr = err.response?.data;
      if (backendErr?.cni_number) {
        setMessage(backendErr.cni_number[0]);
      } else {
        setMessage('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!newPassword) {
      setMsgType('error');
      setMessage("Please enter a new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsgType('error');
      setMessage("New passwords do not match!");
      return;
    }

    setPassSaving(true);
    const token = localStorage.getItem('access');
    if (!token) {
      setMsgType('error');
      setMessage('You must be logged in.');
      setPassSaving(false);
      return;
    }

    const formData = new FormData();
    if (role !== 'admin') {
      formData.append('current_password', currentPassword);
    }
    formData.append('new_password', newPassword);

    try {
      await axios.put(`${baseUrl}/api/profile/update/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setMsgType('success');
      setMessage('Password updated successfully!');
    } catch (err) {
      console.error('Password update error:', err);
      setMsgType('error');
      const backendErr = err.response?.data;
      if (backendErr?.current_password) {
        setMessage(backendErr.current_password[0]);
      } else {
        setMessage('Failed to update password.');
      }
    } finally {
      setPassSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
  };

  const NavbarComponent = role === 'delivery' ? NavbarDel : Navbar;
  const isAdmin = role === 'admin';
  const displayId = `USR-${userId || '1024'}`;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col">
      <NavbarComponent />
      
      <div className="adm-scope flex-grow">
        <main className="w-full max-w-5xl mx-auto px-6 py-10 adm-space-5">
          <div style={{ marginLeft: '1.5rem' , marginBottom: '1.5rem', marginTop: '1.5rem'}}>
            <h1 className="adm-section-title" style={{ fontWeight: '1200', fontSize: '1.85rem', color: '#111827' }}>My Profile</h1>
            <p className="adm-section-sub">Manage your profile details and security settings.</p>
          </div>

          {/* Card 1: Profile Details */}
          <div className="adm-card" style={{ marginLeft: '3rem', padding: '2rem', width: '110%' }}>
            <div className="adm-settings-icon-row" style={{ marginBottom: '1.5rem' }}>
              <User size={18} style={{ color: "#f59e0b" }} />
              <h2 className="adm-settings-card-title" style={{ fontWeight: '700', fontSize: '1.1rem', color: '#111827' }}>Profile Details</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="adm-space-4">
              
              {/* Header profile photo section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                  <img 
                    src={previewPic} 
                    alt="Profile Avatar" 
                    style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover' }}
                    className="bg-slate-100 shadow-sm border border-slate-200"
                  />
                  <label 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '6px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title="Upload Avatar"
                  >
                    <Camera size={14} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfilePicChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label className="adm-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', borderRadius: '0.5rem' }}>
                    Upload New
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfilePicChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button 
                    type="button" 
                    onClick={handleDeleteAvatar}
                    className="adm-btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
                  >
                    Delete avatar
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="adm-grid-2-sm">
                {/* First Name */}
                <div>
                  <label className="adm-field-label">First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="adm-field-input"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="adm-field-label">Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="adm-field-input"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="adm-field-label">Email</label>
                  <input 
                    type="email" 
                    readOnly
                    placeholder="examples@gmail.com"
                    value={email}
                    className="adm-field-input"
                    style={{ cursor: 'not-allowed', opacity: 0.6 }}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="adm-field-label">Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="+237 690 123 456"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="adm-field-input"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="adm-field-label">Role</label>
                  <select
                    disabled
                    value={role}
                    className="adm-field-input"
                    style={{ cursor: 'not-allowed', opacity: 0.6 }}
                  >
                    <option value="admin">Admin</option>
                    <option value="technician">Technician</option>
                    <option value="delivery">Delivery Agent</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                {/* Specialty */}
                <div>
                  <label className="adm-field-label">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="adm-field-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">None</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Masonry">Masonry</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="adm-field-label">Gender</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className="adm-btn-secondary"
                      style={{
                        flex: 1,
                        borderColor: gender === 'Male' ? '#f59e0b' : '#e5e7eb',
                        backgroundColor: gender === 'Male' ? '#fffbeb' : 'transparent',
                        color: gender === 'Male' ? '#b45309' : '#4b5563'
                      }}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: gender === 'Male' ? '3px solid #f59e0b' : '1px solid #9ca3af',
                        backgroundColor: gender === 'Male' ? '#f59e0b' : 'transparent',
                        display: 'inline-block',
                        marginRight: '6px'
                      }}></span>
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className="adm-btn-secondary"
                      style={{
                        flex: 1,
                        borderColor: gender === 'Female' ? '#f59e0b' : '#e5e7eb',
                        backgroundColor: gender === 'Female' ? '#fffbeb' : 'transparent',
                        color: gender === 'Female' ? '#b45309' : '#4b5563'
                      }}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: gender === 'Female' ? '3px solid #f59e0b' : '1px solid #9ca3af',
                        backgroundColor: gender === 'Female' ? '#f59e0b' : 'transparent',
                        display: 'inline-block',
                        marginRight: '6px'
                      }}></span>
                      Female
                    </button>
                  </div>
                </div>

                {/* ID */}
                <div>
                  <label className="adm-field-label">ID</label>
                  <input 
                    type="text" 
                    readOnly
                    placeholder="USR-1024"
                    value={displayId}
                    className="adm-field-input"
                    style={{ cursor: 'not-allowed', opacity: 0.6 }}
                  />
                </div>

                {/* CNI Number */}
                <div>
                  <label className="adm-field-label">CNI Number</label>
                  <input 
                    type="text" 
                    readOnly={role !== 'admin'}
                    placeholder="National Identity Card Number"
                    value={cniNumber}
                    onChange={(e) => setCniNumber(e.target.value)}
                    className="adm-field-input"
                    style={{
                      cursor: role !== 'admin' ? 'not-allowed' : 'text',
                      opacity: role !== 'admin' ? 0.6 : 1
                    }}
                  />
                </div>

                {/* Empty column */}
                <div></div>

                {/* Residential Address */}
                <div className="adm-col-span-2">
                  <label className="adm-field-label">Residential Address</label>
                  <input 
                    type="text"
                    placeholder="12 Rue Bonanjo, Douala, Cameroon"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="adm-field-input"
                  />
                </div>

                {/* Bio */}
                <div className="adm-col-span-2">
                  <label className="adm-field-label">Bio</label>
                  <textarea 
                    rows="3" 
                    placeholder="Senior electrical technician with 8+ years of field experience."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="adm-field-input"
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Status messages & Submit Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="adm-btn-save"
                  style={{ display: 'inline-flex', gap: '0.5rem', width: 'auto' }}
                >
                  {saving ? (
                    <span className="adm-spinner" />
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                {message && msgType === 'success' && !passSaving && (
                  <span className="adm-saved-toast" style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>Profile updated successfully!</span>
                )}
                {message && msgType === 'error' && !passSaving && (
                  <span className="adm-saved-toast" style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>{message}</span>
                )}
              </div>

            </form>
          </div>

          {/* Card 2: Change Password */}
          <div className="adm-card" style={{ marginLeft: '3rem', padding: '2rem', width: '110%' }}>
            <div className="adm-settings-icon-row" style={{ marginBottom: '1.5rem' }}>
              <Lock size={18} style={{ color: "#f59e0b" }} />
              <h2 className="adm-settings-card-title" style={{ fontWeight: '700', fontSize: '1.1rem', color: '#111827' }}>Change Password</h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
              Use a strong password you do not reuse elsewhere.
            </p>

            <form onSubmit={handlePasswordUpdate} className="adm-space-4">
              
              <div className="adm-grid-2-sm">
                {/* Current Password (ONLY rendered if role is NOT admin) */}
                {!isAdmin && (
                  <div className="adm-col-span-2" style={{ maxWidth: 480 }}>
                    <label className="adm-field-label">Current Password <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type={showCurrent ? 'text' : 'password'}
                        required
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="adm-field-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrent(!showCurrent)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280'
                        }}
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="adm-field-label">New Password <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showNew ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="adm-field-input"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#6b7280'
                      }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="adm-field-label">Confirm New Password <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="adm-field-input"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#6b7280'
                      }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status messages for password & Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={passSaving}
                  className="adm-btn-save"
                  style={{ display: 'inline-flex', gap: '0.5rem', width: 'auto' }}
                >
                  {passSaving ? (
                    <span className="adm-spinner" />
                  ) : (
                    <>
                      <Save size={16} />
                      Update Password
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelPassword}
                  className="adm-btn-secondary"
                >
                  Cancel
                </button>
                {message && passSaving && (
                  <span className="adm-saved-toast" style={{ color: msgType === 'success' ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>{message}</span>
                )}
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
