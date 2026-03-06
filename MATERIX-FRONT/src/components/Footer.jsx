import React from 'react';
import './Footer.css';
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaHome,
  FaInfo,
  FaTools,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-section brand">
          <a href="#!welcome"><h3>MATERIX</h3></a>
          <p>Reliable solutions for all your construction needs.</p>
          <div className="social-icons">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaLinkedinIn /></a>
          </div>
        </div>

        <div className="footer-section services">
          <h4>Our Services</h4>
          <ul>
            <li>Building Materials Supply</li>
            <li>Technician Service Provision</li>
            <li>Custom Material Orders</li>
            <li>Delivery Services</li>
          </ul>
        </div>

        <div className="footer-section quick-links">
          <h4>Quick Links</h4>
          <ul>
            <li><FaHome className="icon" /> <a href="#!welcome">Home</a></li>
            <li><FaInfo className="icon" /> <a href="#!about">About</a></li>
            <li><FaTools className="icon" /> <a href="#!ourprods">Products</a></li>
            <li><a href="#!privacy">Privacy Policy</a></li>
            <li><a href="#!terms">Terms of Service</a></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h4>Contact Us</h4>
          <ul>
            <li><FaEnvelope className="icon" /> materix@support.com</li>
            <li><FaPhoneAlt className="icon" /> (+237) 691 08 22 46</li>
            <li><FaMapMarkerAlt className="icon" /> Yaoundé, Cameroon</li>
          </ul>
        </div>

        <div className="footer-section newsletter">
          <h4>Stay Updated</h4>
          <p>Subscribe to get the latest updates from MATERIX.</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Your email address" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 MATERIX. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
