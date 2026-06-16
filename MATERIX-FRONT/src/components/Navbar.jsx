import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import defaultPic from '../assets/images/default.png';
import { Bell, User, ChevronDown, LogOut, LogIn, UserPlus, Trash2, Menu, X } from 'lucide-react';

const baseSections = [
  { id: 'home', label: 'Home', type: 'hash' },
  { id: 'products-section', label: 'Our Products', type: 'hash' },
  { id: 'services-section', label: 'Our Services', type: 'hash' },
  { id: 'about-section', label: 'About', type: 'hash' },
];

const Navbar = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
  const [profilePic, setProfilePic] = useState(localStorage.getItem('profile_picture') || defaultPic);
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Build sections dynamically based on user role
  const sections = [...baseSections];
  if (role === 'admin') {
    sections.push({ id: '/admindash', label: 'Dashboard', type: 'route' });
  } else if (role === 'technician') {
    sections.push({ id: '/techdash', label: 'Dashboard', type: 'route' });
  }

  // Highlight active section on scroll for home page hash links
  useEffect(() => {
    if (location.pathname !== '/') return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      let current = 'home';
      sections.forEach((section) => {
        if (section.type === 'hash') {
          const element = document.getElementById(section.id);
          if (element && scrollPosition >= element.offsetTop) {
            current = section.id;
          }
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, location.pathname]);

  // Handle smooth scroll on hash changes or direct URL hash loads
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.hash]);

  // Refresh navbar info every second (synchronizes profile updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setUsername(localStorage.getItem('username') || 'Guest');
      setProfilePic(localStorage.getItem('profile_picture') || defaultPic);
      setRole(localStorage.getItem('role') || '');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update active section on route changes
  useEffect(() => {
    const path = location.pathname;
    const hash = location.hash.replace('#', '');
    if (path === '/' && hash) setActiveSection(hash);
    else if (path === '/') setActiveSection('home');
    else {
      const routeSection = sections.find(
        (section) => section.type === 'route' && section.id === path
      );
      if (routeSection) setActiveSection(routeSection.id);
    }
  }, [location, sections]);

  const handleClick = (section) => {
    if (section.type === 'route') {
      navigate(section.id);
    } else {
      if (location.pathname !== '/') {
        navigate(`/#${section.id}`);
      } else {
        window.location.hash = section.id;
        const element = document.getElementById(section.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
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

  // --- Notifications Fetching & Operations ---
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('access');
      if (!token) return;
    
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/notifications/my/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err.response || err);
      }
    };
  
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Mark all notifications as read
  const markAllRead = async () => {
    const token = localStorage.getItem('access');
    if (!token) return;
  
    try {
      await axios.patch(
        'http://127.0.0.1:8000/api/notifications/mark-all-read/',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err.response || err);
    }
  };
  
  // Delete single notification
  const handleDeleteNotification = async (id) => {
    const token = localStorage.getItem('access');
    setNotifications(notifications.filter(n => n.id !== id));
    try {
      await axios.delete(`http://127.0.0.1:8000/api/notifications/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error deleting notification:', err.response || err);
    }
  };
  
  // Clear all notifications
  const handleClearAll = async () => {
    const token = localStorage.getItem('access');
    setNotifications([]);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/notifications/clear/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error clearing notifications:', err.response || err);
    }
  };

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <span className="navbar-logo" onClick={() => navigate('/')}>MATERIX</span>
            <ul className="navbar-links">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    className={activeSection === section.id ? 'active' : ''}
                    onClick={() => handleClick(section)}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="navbar-icons">
            {/* Notification Dropdown */}
            <div className="notification-icon" ref={notifRef}>
              <Bell size={16} onClick={() => setShowNotifDropdown(!showNotifDropdown)} />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}

              {showNotifDropdown && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <button className="mark-all-btn" onClick={markAllRead}>Mark all as read</button>
                    )}
                  </div>
                  <div className="notif-content">
                    {notifications.length === 0 ? (
                      <p className="no-notifs">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                        >
                          <div className="notif-left">
                            {!n.is_read && <span className="notif-dot"></span>}
                            <div className="notif-text">
                              <p className="notif-message">{n.message}</p>
                              <small className="notif-time">{new Date(n.created_at).toLocaleString()}</small>
                            </div>
                          </div>
                          <button className="delete-btn"
                            onClick={() => handleDeleteNotification(n.id)}
                            title="Delete notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Footer with clear all button */}
                  {notifications.length > 0 && (
                    <div className="notif-footer">
                      <button className="clear-all-btn" onClick={handleClearAll}>
                        <Trash2 size={12} /> Clear All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown Chip */}
            <div className="user-chip" ref={userRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
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
                  <li onClick={() => handleDropdownNavigation('/pack')}>
                    <UserPlus size={14} /> Signup
                  </li>
                  <li onClick={() => handleDropdownNavigation('/profile')}>
                    <User size={14} /> Profile
                  </li>
                </ul>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Responsive Navigation Links */}
      {mobileOpen && (
        <div className="mobile-menu">
          {sections.map((section) => (
            <a
              key={section.id}
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => {
                handleClick(section);
                setMobileOpen(false);
              }}
            >
              {section.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;
