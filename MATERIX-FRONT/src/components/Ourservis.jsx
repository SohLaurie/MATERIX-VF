import React from 'react';
import './Ourservis.css';
import { useNavigate } from 'react-router-dom';


// Import service images (make sure these image files exist in your assets/images folder)
import img1 from '../assets/images/man3.jpg';
import img2 from '../assets/images/man7.jpg';
import img3 from '../assets/images/man12.jpg';
import img4 from '../assets/images/man8.jpg';

const Ourservis = () => {
  const navigate = useNavigate();

  // Function to navigate to the contact page when button is clicked
  const handleContact = () => {
    navigate('/portal'); // Change to your actual contact route
  };

  // List of services offered with their images
  const services = [
    { name: 'Masons', image: img1 },
    { name: 'Electrician', image: img2 },
    { name: 'Plumber', image: img3 },
    { name: 'Carpenter', image: img4 }
  ];

  return (
    <>
    
    <div className="services-section" id='services-section'>
      {/* Section Title */}
      <h2 className="services-title">Our Services</h2>
      
      {/* Section Description */}
      <p className="services-subtitle">
        Connect with top-rated professionals ready to bring your construction vision to life.
      </p>

      {/* Services Card Grid */}
      <div className="services-grid">
        {services.map((item, index) => (
          <div key={index} className="service-card">
            {/* Image of the service provider */}
            <img src={item.image} alt={item.name} className="service-image" />
            
            {/* Service Name */}
            <h3 className="service-name">{item.name}</h3>

            {/* Call to Action Button */}
            <button className="service-button" onClick={handleContact}>Get in Touch</button>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Ourservis;
