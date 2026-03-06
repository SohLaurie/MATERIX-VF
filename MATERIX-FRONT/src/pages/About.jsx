import React from 'react';
import './About.css';
import { motion } from 'framer-motion';
import aboutImg from '../assets/images/woman.jpg'; // You can change this image

const About = () => {
  return (
    <>
    
    <div className="about-section-container" id="about-section" name="about-section">
      <div className="about-hero-banner">
        <motion.h1
          className="about-title"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          About Us
        </motion.h1>
      </div>

      <div className="about-content">
        <motion.div
          className="about-text"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2>We Build More Than Structures</h2>
          <p>
            At MATERIX, we’re dedicated to providing top-notch construction materials and services that meet your project needs. From expert advice to reliable deliveries, we exist to help you build safely, efficiently, and confidently.
          </p>
        </motion.div>

        <motion.div
          className="about-image"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src={aboutImg} alt="About Materix" />
        </motion.div>
      </div>

        <motion.div
            className="mission-section"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, amount: 0.4 }}
        >
        <h2 className="mission-title">Our Mission</h2>
        <p className="mission-text">
        At MATERIX, our mission is to simplify construction by providing a seamless and reliable supply chain 
        for quality materials. We aim to empower builders, contractors, and DIYers with the tools and resources 
        they need to create strong, lasting structures on time and within budget.
        </p>
        </motion.div>
    </div>
  </>
  );
};

export default About;
