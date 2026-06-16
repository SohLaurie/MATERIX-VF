import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';
import defaultPic from '../assets/images/default.png';
import { User, ChevronDown, LogOut, LogIn } from 'lucide-react';

const NavbarDel = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
  const [profilePic, setProfilePic] = useState(localStorage.getItem('profile_picture') || defaultPic);
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  const navigate = useNavigate();
  const userRef = useRef(null);

  // Refresh navbar info when localStorage changes (profile update)
  useEffect(() => {
    const interval = setInterval(() => {
      setUsername(localStorage.getItem('username') || 'Guest');
      setProfilePic(localStorage.getItem('profile_picture') || defaultPic);
      setRole(localStorage.getItem('role') || '');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleDropdownNavigation = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
    localStorage.removeItem('profile_picture');
    localStorage.removeItem('role');
    setUsername('Guest');
    setProfilePic(defaultPic);
    setRole('');
    setDropdownOpen(false);
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo" onClick={() => navigate('/deldash')}>MATERIX</span>
        
        <div className="navbar-icons">
          {/* Profile Dropdown Chip */}
          <div className="user-chip" ref={userRef} onClick={toggleDropdown}>
            <div className="user-avatar">
              {profilePic ? (
                <img src={profilePic} alt="Profile" />
              ) : (
                <User size={14} />
              )}
            </div>
            <span>{username}</span>
            <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />

            {dropdownOpen && (
              <ul className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                {username && username !== 'Guest' ? (
                  <li onClick={handleLogout} className="logout-item">
                    <LogOut size={14} /> Logout
                  </li>
                ) : (
                  <li onClick={() => handleDropdownNavigation('/login')}>
                    <LogIn size={14} /> Login
                  </li>
                )}
                <li onClick={() => handleDropdownNavigation('/profile')}>
                  <User size={14} /> Profile
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarDel;