import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Errorpage from './pages/Errorpage';
import Ourservis from './components/Ourservis';
import About from './pages/About';
// import Footer from './components/Footer';
import Shop from './pages/Shop/Shop';
import Portal from './pages/Portal/Portal';
import View from './pages/Shop/3DView/View';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Ourprods from './components/Ourprods'; 
import Pack from './pages/Auth/Pack';
import Register from './pages/Auth/Register';
import Payment from './pages/Payment';
import TechDashboard from './pages/TechDashboard/TechDashboard';
import DeliverDashboard from './pages/DeliveryDashboard/DeliverDashboard';
import Profile from './components/Profile';
import AdminDashboard from './pages/AdminDashboard';


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

function App() {
  // 👇 Access cart state globally from Redux
  const cart = useSelector((state) => state.cart);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/shop" 
            element={<Shop cart={cart} />}  // 👈 Pass cart down as prop
          />
          <Route path="/products" element={<Ourprods />} />
          <Route path="/services" element={<Ourservis />} />
          <Route path="/about" element={<About />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/error" element={<Errorpage />} />
          <Route path="/view" element={<View />} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/pack" element={<Pack />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/techdash" element={<TechDashboard />} />
          <Route path="/deldash" element={<DeliverDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admindash" element={<AdminDashboard />} />
        </Routes>
        {/* <Footer />   */}
      </div>
    </Router>
  );
}

export default App;

