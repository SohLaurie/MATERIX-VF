import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';
import Navbar from './Navbar';
import NavbarDel from './Navbar_delivery';
import previewFallback from '../assets/images/man1.jpg';

const baseUrl = "http://127.0.0.1:8000";

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(previewFallback);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access');
      if (!token) return;

      try {
        const res = await axios.get(`${baseUrl}/api/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Profile API response:', res.data);

        setName(res.data.username);
        setEmail(res.data.email);
        setAddress(res.data.address || '');  // ✅ set address

        if (res.data.profile_picture) {
          const profilePicUrl = res.data.profile_picture.startsWith('http')
            ? res.data.profile_picture
            : `${baseUrl}${res.data.profile_picture}`;
          setPreviewPic(profilePicUrl);
          localStorage.setItem('profile_picture', profilePicUrl);
        }

        localStorage.setItem('username', res.data.username);
        localStorage.setItem('role', res.data.role); // save role
        setRole(res.data.role || '');
        console.log('Fetched role:', res.data.role); // debug log
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');

    const token = localStorage.getItem('access');
    if (!token) return alert('You must be logged in');

    const formData = new FormData();
    formData.append('username', name);
    formData.append('email', email);
    formData.append('address', address);  // ✅ append address
    if (profilePic) formData.append('profile_picture', profilePic);

    try {
      const res = await axios.put(`${baseUrl}/api/profile/update/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      localStorage.setItem('username', res.data.username);
      if (res.data.profile_picture) {
        const profilePicUrl = res.data.profile_picture.startsWith('http')
          ? res.data.profile_picture
          : `${baseUrl}${res.data.profile_picture}`;
        localStorage.setItem('profile_picture', profilePicUrl);
        setPreviewPic(profilePicUrl);
      }

      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage('Failed to update profile.');
    }
  };

  // Decide navbar based on role
  const NavbarComponent = role === 'delivery' ? NavbarDel : Navbar;

  return (
    <>
      <NavbarComponent />
      <div className="settings-container full-width">
        <h2 className="settings-title">Settings</h2>
        <form className="profile-form full-width" onSubmit={handleProfileUpdate}>
          <h3>Update Profile</h3>

          <div className="profile-pic-preview">
            <img src={previewPic} alt="Preview" />
          </div>

          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            // onChange={(e) => setEmail(e.target.value)}
            readOnly   // ✅ make email read-only
            required
          />

          <label>Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <label>Change Profile Picture</label>
          <input type="file" accept="image/*" onChange={handleProfilePicChange} />

          <button type="submit" className="update-btn">Update Profile</button>

          {message && <p className="update-message">{message}</p>}
        </form>
      </div>
    </>
  );
};

export default Profile;
