import React from 'react';
import './Ourprods.css';
import { useNavigate } from 'react-router-dom';

import img1 from '../assets/steel.png';
import img2 from '../assets/hammer.png';
import img3 from '../assets/cement.png';
import img4 from '../assets/tape.png';

const Ourprods = () => {
  const navigate = useNavigate();

  const handleShop = () => {
    navigate('/shop');
  };

  const products = [
    { name: 'Cement', image: img1 },
    { name: 'Bricks', image: img2 },
    { name: 'Steel Rods', image: img3 },
    { name: 'Concrete Mixers', image: img4 }
  ];

  return (
    
    <div className="products-section" id='products-section'>
      <h2 className="prods-title">Our Products</h2>
      <p className="prods-subtitle">
        Browse top-quality construction materials, handpicked for strength and reliability.
      </p>

      <div className="prods-grid">
        {products.map((item, index) => (
          <div key={index} className="prod-card">
            <img src={item.image} alt={item.name} className="prod-image" />
            <h3 className="prod-name">{item.name}</h3>
            <button className="prod-button" onClick={handleShop}>View in Store</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ourprods;
