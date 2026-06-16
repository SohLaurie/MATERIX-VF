import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Lock, Eye, EyeOff, Save } from 'lucide-react';
import Navbar from './Navbar';
import NavbarDel from './Navbar_delivery';
import previewFallback from '../assets/images/man1.jpg';

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
      
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Card 1: Profile Details */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            
            {/* Header profile photo section */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <img 
                  src={previewPic} 
                  alt="Profile Avatar" 
                  className="w-24 h-24 rounded-full object-cover bg-slate-100 shadow-sm border border-slate-200"
                />
                <label className="absolute bottom-0 right-0 bg-amber-500 hover:bg-amber-600 text-white p-1.5 rounded-full shadow-md cursor-pointer flex items-center justify-center border border-white transition-colors duration-200">
                  <Camera size={14} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePicChange} 
                    className="hidden" 
                  />
                </label>
              </div>
              
              <div className="flex gap-3">
                <label className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer shadow-sm transition-all duration-200 border-0 flex items-center justify-center">
                  Upload New
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePicChange} 
                    className="hidden" 
                  />
                </label>
                <button 
                  type="button" 
                  onClick={handleDeleteAvatar}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all duration-200 border-0 cursor-pointer"
                >
                  Delete avatar
                </button>
              </div>
            </div>

            {/* Form Input fields */}
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">First Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Last Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Email</label>
                  <input 
                    type="email" 
                    readOnly
                    placeholder="examples@gmail.com"
                    value={email}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-400 py-2.5 px-4 rounded-lg cursor-not-allowed w-full outline-none"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="+237 690 123 456"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Role</label>
                  <div className="relative">
                    <select
                      disabled
                      value={role}
                      className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-400 py-2.5 px-4 rounded-lg w-full outline-none appearance-none cursor-not-allowed"
                    >
                      <option value="admin">Admin</option>
                      <option value="technician">Technician</option>
                      <option value="delivery">Delivery Agent</option>
                      <option value="client">Client</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Specialty</label>
                  <div className="relative">
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none cursor-pointer appearance-none"
                    >
                      <option value="">None</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Masonry">Masonry</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Gender</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-all duration-200 text-sm cursor-pointer ${
                        gender === 'Male'
                          ? 'border-amber-500 bg-amber-50/20 text-amber-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        gender === 'Male' ? 'border-amber-500' : 'border-slate-300'
                      }`}>
                        {gender === 'Male' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      </span>
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-all duration-200 text-sm cursor-pointer ${
                        gender === 'Female'
                          ? 'border-amber-500 bg-amber-50/20 text-amber-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        gender === 'Female' ? 'border-amber-500' : 'border-slate-300'
                      }`}>
                        {gender === 'Female' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      </span>
                      Female
                    </button>
                  </div>
                </div>

                {/* ID */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">ID</label>
                  <input 
                    type="text" 
                    readOnly
                    placeholder="USR-1024"
                    value={displayId}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-400 py-2.5 px-4 rounded-lg cursor-not-allowed w-full outline-none"
                  />
                </div>

                {/* Residential Address */}
                <div className="md:col-span-2">
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Residential Address</label>
                  <input 
                    type="text"
                    placeholder="12 Rue Bonanjo, Douala, Cameroon"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                  />
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Bio</label>
                  <textarea 
                    rows="3" 
                    placeholder="Senior electrical technician with 8+ years of field experience."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Status messages */}
            {message && msgType === 'success' && !passSaving && (
              <div className="p-4 rounded-xl text-sm font-medium border bg-emerald-50 border-emerald-200 text-emerald-800">
                {message}
              </div>
            )}
            {message && msgType === 'error' && !passSaving && (
              <div className="p-4 rounded-xl text-sm font-medium border bg-rose-50 border-rose-200 text-rose-800">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-start pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Card 2: Change Password */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
            </div>
            <p className="text-xs text-slate-500 -mt-4">Use a strong password you do not reuse elsewhere.</p>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Password (ONLY rendered if role is NOT admin) */}
                {!isAdmin && (
                  <div className="md:col-span-2 max-w-md">
                    <label className="block text-slate-800 text-sm font-semibold mb-1.5">Current Password <span className="text-red-500">*</span></label>
                    <div className="relative flex items-center">
                      <input 
                        type={showCurrent ? "text" : "password"}
                        required
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">New Password <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <input 
                      type={showNew ? "text" : "password"}
                      required
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-slate-800 text-sm font-semibold mb-1.5">Confirm New Password <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <input 
                      type={showConfirm ? "text" : "password"}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[#f3f4f6]/80 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-full outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status messages for password */}
              {message && passSaving && (
                <div className={`p-4 rounded-xl text-sm font-medium border ${
                  msgType === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {message}
                </div>
              )}

              {/* Password Buttons */}
              <div className="flex gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={passSaving}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  {passSaving ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-5 rounded-lg transition-colors border-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
