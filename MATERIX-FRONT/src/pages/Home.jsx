import React, { useState, useEffect } from "react";
import "./Home.css";
import Ourservis from "../components/Ourservis";
import Ourprods from "../components/Ourprods";
import About from "./About";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const images = [
  "/src/assets/images/1.jpg",
  "/src/assets/images/2.jpg",
  "/src/assets/images/3.jpg",
  "/src/assets/images/4.jpg",
];

const Home = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Navbar />

      <section id="home" className="home-container" name="home">
        <div
          className="carousel"
          style={{ backgroundImage: `url(${images[index]})` }}
        >
          <div className="carousel-overlay">
            <h1>
              Build your dreams with <span className="brand">MATERIX</span>
            </h1>
            <Link to="/shop" className="logo-link">
              <button className="shop-now">Shop Now →</button>
            </Link>
          </div>
        </div>
      </section>

      <section id="products-section">
        {/* Render Our Products section */}
        <Ourprods />
      </section>

      <section id="services-section">
        {/* Render Our Services section */}
        <Ourservis />
      </section>

      <section id="services-section">
        {/* Render About Us section */}
        <About />
      </section>

      <Footer />
    </>
  );
};

export default Home;
