// import React, { useState, useEffect } from 'react';
// import './Navbar.css';
// import { useNavigate, useLocation } from 'react-router-dom';
// import defaultPic from '../assets/images/default.png';


// const baseSections = [
//   { id: 'home', label: 'Home', type: 'hash' },
//   { id: 'products-section', label: 'Our Products', type: 'hash' },
//   { id: 'services-section', label: 'Our Services', type: 'hash' },
//   { id: 'about-section', label: 'About', type: 'hash' },
//   // Dashboard will be added dynamically if technician
// ];

// const Navbar = () => {
//   const [activeSection, setActiveSection] = useState('home');
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
//   const [profilePic, setProfilePic] = useState(localStorage.getItem('profile_picture') || defaultPic);
//   const [role, setRole] = useState(localStorage.getItem('role') || '');

//   const navigate = useNavigate();
//   const location = useLocation();

//   // Build final sections depending on role
//   const sections = [...baseSections];
//   if (role === 'technician') {
//     sections.push({ id: '/techdash', label: 'Dashboard', type: 'route' });
//   }

//   // Highlight active section on scroll (for hash sections)
//   useEffect(() => {
//     const handleScroll = () => {
//       const scrollPosition = window.scrollY + 150;
//       let current = 'home';
//       sections.forEach((section) => {
//         if (section.type === 'hash') {
//           const element = document.getElementById(section.id);
//           if (element && scrollPosition >= element.offsetTop) {
//             current = section.id;
//           }
//         }
//       });
//       setActiveSection(current);
//     };

//     window.addEventListener('scroll', handleScroll, { passive: true });
//     handleScroll();
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [sections]);

//   // Refresh navbar info when localStorage changes (profile update)
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setUsername(localStorage.getItem('username') || 'Guest');
//       setProfilePic(localStorage.getItem('profile_picture') || defaultPic);
//       setRole(localStorage.getItem('role') || '');
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   // Update active section based on current URL (hash or route)
//   useEffect(() => {
//     const path = location.pathname;
//     const hash = location.hash.replace('#', '');

//     if (path === '/' && hash) {
//       setActiveSection(hash); // hash-based section
//     } else if (path === '/') {
//       setActiveSection('home'); // default home
//     } else {
//       const routeSection = sections.find(
//         (section) => section.type === 'route' && section.id === path
//       );
//       if (routeSection) setActiveSection(routeSection.id);
//     }
//   }, [location, sections]);

//   const handleClick = (section) => {
//     if (section.type === 'route') {
//       navigate(section.id);
//     } else {
//       if (location.pathname !== '/') {
//         navigate(`/#${section.id}`);
//       } else {
//         window.location.hash = section.id;
//       }
//     }
//   };

//   const toggleDropdown = () => {
//     setDropdownOpen(!dropdownOpen);
//   };

//   const handleDropdownNavigation = (path) => {
//     navigate(path);
//     setDropdownOpen(false);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('username');
//     localStorage.removeItem('profile_picture');
//     localStorage.removeItem('role');
//     setUsername('Guest');
//     setProfilePic(defaultPic);
//     setRole('');
//     setDropdownOpen(false);
//     navigate('/login');
//   };

//   return (
//     <nav className="navbar">
//       <div className="navbar-logo">MATERIX</div>
//       <ul className="navbar-links">
//         {sections.map((section) => (
//           <li key={section.id}>
//             <a
//               href={section.type === 'hash' ? `#${section.id}` : section.id}
//               className={activeSection === section.id ? 'active' : ''}
//               onClick={(e) => {
//                 e.preventDefault();
//                 handleClick(section);
//               }}
//             >
//               {section.label}
//             </a>
//           </li>
//         ))}
//       </ul>
//       <div className="navbar-icons">
//         <div className="admin-profile">
//           <img
//             src={profilePic && profilePic !== "" ? profilePic : defaultPic}
//             alt="Profile"
//             className="profile-pic"
//           />
//           <span className="admin-name">{username}</span>
//         </div>

//         <div className="user-dropdown">
//           <i className="fas fa-user" onClick={toggleDropdown}></i>
//           {dropdownOpen && (
//             <ul className="dropdown-menu">
//               {username && username !== 'Guest' ? (
//                 <li onClick={handleLogout}>
//                   <i className="fas fa-sign-out-alt"></i> Logout
//                 </li>
//               ) : (
//                 <li onClick={() => handleDropdownNavigation('/login')}>
//                   <i className="fas fa-sign-in-alt"></i> Login
//                 </li>
//               )}
//               <li onClick={() => handleDropdownNavigation('/pack')}>
//                 <i className="fas fa-user-plus"></i> Signup
//               </li>
//               <li onClick={() => handleDropdownNavigation('/profile')}>
//                 <i className="fas fa-user"></i> Profile
//               </li>
//             </ul>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import defaultPic from '../assets/images/default.png';

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

  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  // Build sections dynamically
  const sections = [...baseSections];
  if (role === 'technician') {
    sections.push({ id: '/techdash', label: 'Dashboard', type: 'route' });
  }

  // Highlight active section on scroll
  useEffect(() => {
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
  }, [sections]);

  // Refresh navbar info every second (profile updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setUsername(localStorage.getItem('username') || 'Guest');
      setProfilePic(localStorage.getItem('profile_picture') || defaultPic);
      setRole(localStorage.getItem('role') || '');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update active section on route change
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
    if (section.type === 'route') navigate(section.id);
    else {
      if (location.pathname !== '/') navigate(`/#${section.id}`);
      else window.location.hash = section.id;
    }
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleDropdownNavigation = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('profile_picture');
    localStorage.removeItem('role');
    setUsername('Guest');
    setProfilePic(defaultPic);
    setRole('');
    setDropdownOpen(false);
    navigate('/login');
  };

  // --- Notifications ---
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
  
  // Mark all as read (persist to backend)
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




  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">MATERIX</div>
      <ul className="navbar-links">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={section.type === 'hash' ? `#${section.id}` : section.id}
              className={activeSection === section.id ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleClick(section); }}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="navbar-icons">
        {/* Notification Dropdown */}
        <div className="notification-icon" ref={notifRef}>
          <i className="fas fa-bell" onClick={() => setShowNotifDropdown(!showNotifDropdown)}></i>
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
                      <p className="notif-message">{n.message}</p>
                      <small className="notif-time">{new Date(n.created_at).toLocaleString()}</small>
                      <button className="delete-btn"
                        onClick={() => handleDeleteNotification(n.id)}
                        title="Delete notification"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* Footer with clear all button */}
              {notifications.length > 0 && (
                <div className="notif-footer">
                  <button className="clear-all-btn" onClick={handleClearAll}>
                    <i className="fas fa-trash-alt"></i> Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        

        {/* Profile Dropdown */}
        <div className="admin-profile">
          <img src={profilePic && profilePic !== "" ? profilePic : defaultPic} alt="Profile" className="profile-pic" />
          <span className="admin-name">{username}</span>
        </div>

        <div className="user-dropdown">
          <i className="fas fa-user" onClick={toggleDropdown}></i>
          {dropdownOpen && (
            <ul className="dropdown-menu">
              {username && username !== 'Guest' ? (
                <li onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</li>
              ) : (
                <li onClick={() => handleDropdownNavigation('/login')}><i className="fas fa-sign-in-alt"></i> Login</li>
              )}
              <li onClick={() => handleDropdownNavigation('/pack')}><i className="fas fa-user-plus"></i> Signup</li>
              <li onClick={() => handleDropdownNavigation('/profile')}><i className="fas fa-user"></i> Profile</li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
