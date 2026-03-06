// import React, { useState, useEffect } from 'react';
// import './Navbar.css';
// import { useNavigate, useLocation } from 'react-router-dom';

// const sections = [
//   { id: 'home', label: 'Home', type: 'hash' },
//   { id: 'products-section', label: 'Our Products', type: 'hash' },
//   { id: 'services-section', label: 'Our Services', type: 'hash' },
//   { id: 'about-section', label: 'About', type: 'hash' },
//   { id: '/techdash', label: 'Dashboard', type: 'route' }
// ];

// const NavbarDel = () => {
//   const [activeSection, setActiveSection] = useState('home');
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();

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
//   }, []);

//   const handleClick = (section) => {
//     if (section.type === 'route') {
//       navigate(section.id); // Navigate to /techdash
//     } else {
//       if (location.pathname !== '/') {
//         navigate(`/#${section.id}`);
//       } else {
//         window.location.hash = section.id;
//       }
//     }
//     setActiveSection(section.id);
//   };

//   const toggleDropdown = () => {
//     setDropdownOpen(!dropdownOpen);
//   };

//   const handleDropdownNavigation = (path) => {
//     navigate(path);
//     setDropdownOpen(false);
//   };

//   return (
//     <nav className="navbar">
//       <div className="navbar-logo">MATERIX</div>
      
//       <div className="navbar-icons">
//       <div className="admin-profile">
//         <img 
//           src="../assets/man1.jpg"
//           alt="Admin Profile" 
//           className="profile-pic" 
//           // onError={(e) => e.target.src = lifelineLogo}
//         />
//         <span className="admin-name">Laura Mayer</span>
//       </div>
  
//         <div className="user-dropdown">
//           <i className="fas fa-user" onClick={toggleDropdown}></i>
//           {dropdownOpen && (
//             <ul className="dropdown-menu">
//               <li onClick={() => handleDropdownNavigation('/login')}>
//                 <i className="fas fa-sign-out-alt"></i> Logout
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

// export default NavbarDel;




import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate} from 'react-router-dom';
import defaultPic from '../assets/images/default.png';


const NavbarDel = () => {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
  const [profilePic, setProfilePic] = useState(localStorage.getItem('profile_picture') || defaultPic);
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  const navigate = useNavigate();


  

  // Refresh navbar info when localStorage changes (profile update)
  useEffect(() => {
    const interval = setInterval(() => {
      setUsername(localStorage.getItem('username') || 'Guest');
      setProfilePic(localStorage.getItem('profile_picture') || defaultPic);
      setRole(localStorage.getItem('role') || '');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (section) => {
    if (section.type === 'route') {
      navigate(section.id);
    } else {
      if (location.pathname !== '/') {
        navigate(`/#${section.id}`);
      } else {
        window.location.hash = section.id;
      }
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

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

  return (
    <nav className="navbar">
      <a href="/deldash">
        <div className="navbar-logo">MATERIX</div>
      </a>        
        
      <div className="navbar-icons">
        <div className="admin-profile">
          <img
            src={profilePic && profilePic !== "" ? profilePic : defaultPic}
            alt="Profile"
            className="profile-pic"
          />
          <span className="admin-name">{username}</span>
        </div>

        <div className="user-dropdown">
          <i className="fas fa-user" onClick={toggleDropdown}></i>
          {dropdownOpen && (
            <ul className="dropdown-menu">
              {username && username !== 'Guest' ? (
                <li onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </li>
              ) : (
                <li onClick={() => handleDropdownNavigation('/login')}>
                  <i className="fas fa-sign-in-alt"></i> Login
                </li>
              )}
              <li onClick={() => handleDropdownNavigation('/profile')}>
                <i className="fas fa-user"></i> Profile
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarDel;