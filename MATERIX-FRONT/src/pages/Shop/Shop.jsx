import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./Shop.css";
import "leaflet/dist/leaflet.css";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaShoppingCart,
  FaSearch,
  FaTrash,
  FaMinus,
  FaPlus,
  FaTimes,
  FaStar,
  FaHeart,
  FaArrowRight,
  FaCreditCard,
  FaCheckCircle,
  FaTh,
  FaList,
  FaEye,
  FaEnvelope,
  FaLock,
  FaFilter,
  FaPhoneAlt,
  FaUser,
  FaClock,
  FaExpand,
  FaCompress,
  FaMapMarkerAlt,
  FaTruck,
} from "react-icons/fa";
import { addProduct, deleteProduct, decrease } from "./cart/cart.js";
import L from "leaflet";
import { style } from "framer-motion/client";

// Fix Leaflet default icon paths broken by Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom orange marker icon
const orangeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Store/warehouse location (fixed reference point for distance calculation)
const STORE_LOCATION = { lat: 3.848, lng: 11.502 }; // Yaoundé centre

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcDeliveryFee(distKm) {
  if (distKm <= 3) return 500;
  if (distKm <= 7) return 1000;
  if (distKm <= 15) return 2000;
  if (distKm <= 30) return 3000;
  return 5000;
}

const Shop = () => {
  const dispatch = useDispatch();
  const productsCart = useSelector((state) => state.cart);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({ phone: "", email: "", name: "" });
  const [paymentStep, setPaymentStep] = useState("method");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [wishlist, setWishlist] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Delivery location state ──────────────────────────────────
  const [requestDelivery, setRequestDelivery] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState(null); // { lat, lng }
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  // ─────────────────────────────────────────────────────────────

  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);

  // ------------------- FETCH ORDERS -------------------
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return;
      const response = await axios.get("http://127.0.0.1:8000/api/shop/orders/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to remove this order from history?")) return;
    try {
      const token = localStorage.getItem("access");
      if (!token) return;
      await axios.delete(`http://127.0.0.1:8000/api/shop/orders/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to remove order from history.");
    }
  };

  const toggleExpandOrder = (id) => {
    if (expandedOrderIds.includes(id)) {
      setExpandedOrderIds((prev) => prev.filter((x) => x !== id));
    } else {
      setExpandedOrderIds((prev) => [...prev, id]);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = orderStatusFilter === "All" || order.status === orderStatusFilter;
    const matchesSearch = 
      order.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.items?.some(item => (item.product_name || "").toLowerCase().includes(orderSearchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // ------------------- FETCH PRODUCTS -------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/shop/products/");
        setProducts(Array.isArray(response.data) ? response.data : response.data.results || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Unable to load products. Please try again later.");
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  // ------------------- FILTER & SORT -------------------
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "rating":
          return b.rating - a.rating;
        case "likes":
          return b.likes - a.likes;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // ------------------- CART LOGIC -------------------
  const handleAddToCart = (product) => {
    dispatch(addProduct(product));
    setShowCart(true);
  };

  const handleDeleteFromCart = (id) => dispatch(deleteProduct(id));

  const updateQuantity = (id, change) => {
    if (change === -1) dispatch(decrease(id));
    else {
      const productToIncrease = products.find((p) => p.id === id);
      if (productToIncrease) dispatch(addProduct(productToIncrease));
    }
  };

  const getTotalPrice = () =>
      productsCart.reduce((total, item) => total + getDiscountedPrice(item.product.price, item.product.discount) * item.quantity, 0);

  const getGrandTotal = () => getTotalPrice() + (requestDelivery ? deliveryFee : 0);
      
  const getCartItemCount = () => { 
    return productsCart.reduce((count, item) => count + item.quantity, 0); 
    };

  const getDiscountedPrice = (price, discount) =>
    discount > 0 ? price - (price * discount) / 100 : price;

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`star ${i < Math.floor(rating) ? "filled" : i < rating ? "half-filled" : "empty"}`}
      />
    ));

  const toggleWishlist = (product) => {
    if (wishlist.includes(product.id)) setWishlist((prev) => prev.filter((id) => id !== product.id));
    else setWishlist((prev) => [...prev, product.id]);
  };

 
    
  // ------------------- CREATE ORDER API CALL -------------------
  const createOrder = async () => {
    try {
      const token = localStorage.getItem("access"); // assumes JWT stored at login
      console.log("🔑 Token found in localStorage:", token);

      if (!token) {
        alert("⚠️ You must be logged in to place an order.");
        return null;
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/shop/orders/",
        {
          items: productsCart.map((item) => ({
            product: item.product.id,            // ✅ use nested product id
            quantity: item.quantity,
            price_at_purchase: getDiscountedPrice(item.product.price, item.product.discount), // ✅ discounted price
          })),
          gps_location: deliveryPin,
          customer_address: deliveryAddress,
          customer_phone: paymentDetails.phone,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Order created:", response.data);
      await fetchOrders();
      return response.data;
    } catch (error) {
      console.error("❌ Error creating order:", error.response?.data || error);
      if (error.response?.status === 403) {
        alert("🚫 Order failed: Unauthorized. Please log in again.");
      } else if (error.response?.status === 400) {
        alert("⚠️ Order failed: " + JSON.stringify(error.response.data));
      }
      return null;
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentDetails.phone || !paymentDetails.name) return;
    setIsProcessing(true);
    setProcessingMessage("Initiating payment request...");

    try {
      // 1. Create order first on backend
      const order = await createOrder();
      if (!order || !order.id) {
        setIsProcessing(false);
        setProcessingMessage("");
        return;
      }

      // 2. Call backend InitiatePaymentView
      const token = localStorage.getItem("access");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/payments/initiate/",
        {
          phone_number: paymentDetails.phone,
          amount: getGrandTotal(),
          payment_type: "order",
          order_id: order.id
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const { transaction_id, campay_reference, is_mock } = response.data;
      setPaymentCode(transaction_id);

      if (is_mock) {
        setProcessingMessage("Simulation: Initiated. Simulating phone PIN authorization (takes 4 seconds)...");
      } else {
        setProcessingMessage("Payment initiated! Check your phone for MTN Mobile Money or Orange Money prompt and enter your PIN.");
      }

      // 3. Start status polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `http://127.0.0.1:8000/api/auth/payments/status/${transaction_id}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const payStatus = statusRes.data.status;
          if (payStatus === "success") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingMessage("");
            setPaymentStep("confirmation");

            // Clear cart
            productsCart.forEach((item) => dispatch(deleteProduct(item.product.id)));
          } else if (payStatus === "failed") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingMessage("");
            alert("Payment failed. Please verify your mobile money balance or pin and try again.");
          }
        } catch (pollErr) {
          console.error("Error polling payment status:", pollErr);
        }
      }, 3000);

    } catch (err) {
      console.error("Payment submission error:", err);
      setIsProcessing(false);
      setProcessingMessage("");
      alert("An error occurred while initiating the payment. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------- LOADING / ERROR -------------------
  if (loading) return <p className="loading">Loading products, please wait...</p>;
  if (error) return <p className="error">{error}</p>;

  // ------------------- DELIVERY MAP INIT -------------------
  // Initialise Leaflet map imperatively (avoids react-leaflet peer-dep issues)
  const initMap = (container) => {
    if (!container || mapInstanceRef.current) return;
    const map = L.map(container, {
      center: [3.848, 11.502],
      zoom: 13,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    mapInstanceRef.current = map;
    map.on("click", handleMapClick);
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    setDeliveryPin({ lat, lng });
    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: orangeIcon }).addTo(mapInstanceRef.current);
    }
    // Calc distance
    const dist = haversineDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, lat, lng);
    setDeliveryDistance(dist);
    setDeliveryFee(calcDeliveryFee(dist));
    // Reverse geocode via Nominatim (free)
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.display_name
        ? data.display_name.split(",").slice(0, 3).join(", ")
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setDeliveryAddress(addr);
    } catch {
      setDeliveryAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setGeocoding(false);
    }
  };

  // ------------------- PAYMENT MODAL -------------------
  const PaymentModal = () => (
    <div className={`payment-modal-overlay ${showPayment ? "show" : ""}`}>
      <div className="payment-modal">
        <button className="close-payment" onClick={() => setShowPayment(false)}><FaTimes /></button>
        <h2>Complete Your Purchase</h2>
        {paymentStep === "method"? (
          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="payment-options">
              <button className={`payment-option ${paymentMethod === "mtn" ? "selected" : ""}`} onClick={() => setPaymentMethod("mtn")}>
                <div className="payment-option-content">
                    <FaCreditCard className="payment-icon"/>
                    <span>MTN Mobile Money</span>
                    <div className="payment-desc"> Pay with your MTN Mobile Money account </div>
                </div> 
                <div className="payment-fee">No fees</div>
              </button>
              <button className={`payment-option ${paymentMethod === "orange" ? "selected" : ""}`} onClick={() => setPaymentMethod("orange")}>
                <div className="payment-option-content">    
                    <FaCreditCard className="payment-icon"/>
                    <span>Orange Money</span> 
                    <div className="payment-desc"> Pay with your Orange Money account </div>
                </div>
                <div className="payment-fee">No fees</div>
              </button>
            </div>
            <div className="payment-total">
              <span>Total to pay:</span> 
              <span className="amount">{getGrandTotal().toLocaleString()} FCFA</span>
            </div>
            <button className="next-btn" onClick={() => paymentMethod && setPaymentStep("details")}  disabled={!paymentMethod}>
              Continue to Payment <FaArrowRight />
            </button>
          </div>
        )
        :( paymentStep === "details" ?(
          <div className="payment-details">
            <div className="payment-header">
                <div className="payment-method-selected"> 
                    {paymentMethod === "mtn" ? ( 
                        <FaCreditCard className="payment-icon" /> 
                    ) : ( 
                        <FaCreditCard className="payment-icon" /> 
                    )}
                    <span> {paymentMethod === "mtn" ? "MTN Mobile Money" : "Orange Money"} </span>
                </div>
                <div className="payment-amount"> 
                    <span>Amount:</span> 
                    <span className="amount"> {getGrandTotal().toLocaleString()} FCFA </span> 
                </div>
            </div>
            <form className="payment-form" onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                    <label>Phone Number</label> 
                    <div className="input-with-icon"> 
                        <FaPhoneAlt className="input-icon" /> 
                        <input type="tel" name="phone" placeholder={`e.g. 6${ paymentMethod === "mtn" ? "7" : "9" }XXXXXXX`} 
                        value={paymentDetails.phone} onChange={handleInputChange} required /> 
                    </div>
                    <div className="input-hint"> Enter your {paymentMethod === "mtn" ? "MTN" : "Orange"} mobile money number </div>
                </div>
                <div className="form-group">
                    <label>Full Name</label> 
                    <div className="input-with-icon"> 
                        <FaUser className="input-icon" />
                        <input type="text" name="name" placeholder="Your full name as on ID" 
                        value={paymentDetails.name} onChange={handleInputChange} required /> 
                    </div>
                </div>
                <div className="form-group"> 
                    <label>Email (Optional)</label> 
                    <div className="input-with-icon"> 
                        <FaEnvelope className="input-icon" /> 
                        <input type="email" name="email" placeholder="your.email@example.com" 
                        value={paymentDetails.email} onChange={handleInputChange} /> 
                    </div> 
                    <div className="input-hint"> For order confirmation and receipt </div> 
                </div>
                <div className="security-notice"> 
                    <FaLock className="lock-icon" /> 
                    <span>Your payment is secure and encrypted</span> 
                </div>
               {isProcessing && processingMessage && (
                   <div style={{ margin: "0 0 15px 0", color: "#ff8000", fontSize: "0.875rem", fontWeight: "600", textAlign: "center", backgroundColor: "#fff5eb", padding: "10px", borderRadius: "8px", border: "1px solid #ffe3cb" }}>
                       {processingMessage}
                   </div>
               )}
               <div className="payment-actions"> 
                <button type="button" className="back-btn" onClick={() => setPaymentStep("method")} disabled={isProcessing} > Back </button> 
                <button type="submit" className="pay-now-btn" disabled={ isProcessing || !paymentDetails.phone || !paymentDetails.name } > 
                    {isProcessing ? ( <> 
                    <span className="spinner"></span> Processing... </> 
                    ) : 
                    ( `Pay ${getGrandTotal().toLocaleString()} FCFA `)} 
                </button> 
               </div>
                
              <div className="payment-terms"> By proceeding, you agree to our{" "} 
                <a href="/terms">Terms of Service</a> and{" "} 
                <a href="/privacy">Privacy Policy</a>. 
              </div>
            </form>
          </div>
        ):(
        <div className="payment-confirmation"> 
            <div className="success-icon"> 
                <FaCheckCircle /> 
            </div> 
            <h3>Payment Successful!</h3> 
            <p>Your order has been placed successfully.</p> 
            {paymentCode && ( 
                <div className="payment-code"> 
                <span>Transaction ID:</span> 
                <strong>{paymentCode}</strong> 
            </div> 
            )} 
            <p className="success-message"> A confirmation has been sent to{" "} {paymentDetails.email || "your phone number"}. Our team will contact you shortly for delivery details. </p> 
            <button className="continue-shopping-btn" onClick={() => { setShowPayment(false); setPaymentStep("method"); setPaymentDetails({ phone: "", email: "", name: "" }); setPaymentMethod(""); }} > Continue Shopping </button> 
            </div> 
            ))}   
      </div>
    </div>
  );

  return (
    <div className="enhanced-shop">
      {/* --- HEADER --- */}
      <header className="shop-header">
        <div className="header-content">
            <Link to="/" className="logo-link"> 
                <div className="navbar-logo">MATERIX</div> 
            </Link>
        </div>

        <div className="header-actions"> 
            <div className="search-container"> 
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" /> 
                <FaSearch className="search-icon" /> 
            </div>
            <button className="history-btn" onClick={() => setShowOrders(true)} title="Order History"> 
                <FaClock /> 
                {orders.length > 0 && ( 
                <span className="count">{orders.length}</span> 
                )} 
            </button> 
            <button className="cart-btn" onClick={() => setShowCart(true)}>
                <FaShoppingCart /> 
                {productsCart.length > 0 && ( 
                <span className="count">{productsCart.length}</span> 
                )}
            </button> 
            </div>
      </header>

        {/* Filters Bar */}

        <div className="filters-bar"> 
            <div className="filters-content"> 
                <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)} > 
                    <FaFilter /> Filters 
                </button>

                <div className="quick-filters"> 
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} 
                    className="category-select" > {categories.map((cat, i) => ( 
                    <option key={i} value={cat}> {cat} </option> 
                    ))} 
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                      <option value="name">Sort by Name</option>
                      <option value="price">Sort by Price</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="likes">Sort by Likes</option>
                    </select>
                </div>
               
                <div className="view-controls"> 
                    <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} 
                    onClick={() => setViewMode("grid")} > 
                    <FaTh /> 
                    </button> 
                    <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} 
                    onClick={() => setViewMode("list")} > 
                    <FaList /> 
                    </button> 
                </div>
            </div> 
        </div>

      {/* --- PRODUCTS --- */}
      <main className="products-conatiner">
      <div className={`products ${viewMode}`}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className={`product-card ${ !product.in_stock ? "out-of-stock" : "" }`}>
              {product.discount > 0 && ( 
                <div className="discount-badge">-{product.discount}%
                </div> 
              )}
              <div className="product-image">
                <img src={`${product.image}?t=${Date.now()}`} alt={product.name} />
                <div className="product-overlay"> 
                   <button className="quick-view" 
                   onClick={() => setSelectedProduct(product)} 
                   >  
                     <FaEye /> Quick View 
                   </button> 
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className={`wishlist-btn ${wishlist.includes(product.id) ? "active" : ""}`} onClick={() => toggleWishlist(product)}><FaHeart/></div>
                <p className="product-description">{product.description}</p>
                <p className="product-category">{product.category}</p>
                <div className="product-meta">
                    <div className="rating">{renderStars(product.rating)}<span className="rating-value">({product.rating})</span></div>
                    <div className="likes"> <FaHeart className="likes-icon" /> <span>{product.likes}</span> </div>
                </div>
                <div className="price-section">
                    {product.discount > 0?
                    (
                        <>
                        <span className="original-price">{product.price.toLocaleString()} FCFA</span>
                        <span className="discounted-price"> {getDiscountedPrice( product.price, product.discount ).toLocaleString()}{" "} FCFA </span>
                        </>
                    ):(
                        <span className="price"> {product.price.toLocaleString()} FCFA </span>
                    )}
                </div>
                        
                <div className="product-actions">
                    <button className={`add-to-cart ${ !product.in_stock ? "disabled" : "" }`} onClick={() => product.in_stock && handleAddToCart(product) } disabled={!product.in_stock}>
                        {product.in_stock ? "Add to Cart" : "Out of Stock"}
                    </button>
                    {/* <Link className={`view-3d-btn ${ !product.in_stock ? "disabled" : "" }`} disabled={!product.in_stock}>
                        3D View 
                    </Link> */}
                    {product.three_d_path? ( 
                        <Link to={`/View?obj=${product.three_d_path}&mtl=${product.mtl_file}`} className={`view-3d-btn ${ !product.in_stock ? "disabled" : "" }`} disabled={!product.in_stock}> 
                        3D View 
                        </Link> 
                    ):(
                        <Link to={`/shop`} className="view-3d-btn" > 
                        3D View 
                        </Link> 
                    )}
                </div>
              </div>
            </div>
          ))
        ) :(
            <div className="no-results"> 
                <h3>No products found</h3> 
                <p>Try adjusting your search or filters</p> 
            </div>
        )}
        </div>
       </main>

      {/* --- CART SIDEBAR --- */}

    <div className={`cart-overlay ${showCart ? "open" : ""}`} 
    onClick={() => setShowCart(false)} >
        <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}> 
            <div className="cart-header"> 
                <h3>Your Cart ({getCartItemCount()})</h3> 
                <button className="close-cart" onClick={() => setShowCart(false)}> 
                    <FaTimes /> 
                </button> 
            </div>
            <div className="cart-content"> 
                {productsCart.length === 0 ? ( 
                    <div className="empty-cart"> 
                        <FaShoppingCart className="empty-icon" /> 
                        <p>Your cart is empty</p> 
                        <button className="continue-shopping" onClick={() => setShowCart(false)} >
                             Continue Shopping 
                        </button>
                    </div> 
                ) : (
                <> 
                    <div className="cart-items"> 
                        {productsCart.map((item) => ( 
                            <div key={`${item.product.id}`} className="cart-item" > 
                            <div className="item-image"> 
                                <img src={item.product.image} alt={item.product.name} /> 
                            </div>

                            <div className="item-details"> 
                                <h4>{item.product.name}</h4> 
                                <p className="item-price">
                                  {getDiscountedPrice(item.product.price, item.product.discount).toLocaleString()} FCFA
                                </p>
                                {item.product.discount > 0 && ( 
                                    <span className="discount-badge"> Save {item.product.discount}% 
                                    </span> 
                                )} 
                            </div>

                            <div className="quantity-controls"> 
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, -1); }} disabled={item.quantity <= 1} > 
                                    <FaMinus /> 
                                </button> 
                                <span>{item.quantity}</span> 
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, 1); }} > 
                                    <FaPlus /> 
                                </button> 
                            </div> 
                            
                            
                            <div className="item-total">
                              {(getDiscountedPrice(item.product.price, item.product.discount) * item.quantity).toLocaleString()} FCFA
                            </div>
                            <button className="remove-item" onClick={(e) => { e.stopPropagation(); handleDeleteFromCart(item.product.id); }} aria-label="Remove item" > 
                                <FaTrash /> 
                            </button> 
                        </div>
                        ))} 
                    </div>

                    <div className="cart-summary"> 
                        <div className="summary-row"> 
                            <span>Subtotal</span> 
                            <span>{getTotalPrice().toLocaleString()} FCFA</span> 
                        </div> 
                        <div className="summary-row"> 
                            <span>Delivery Fee</span> 
                            <span>{requestDelivery && deliveryFee > 0 ? `${deliveryFee.toLocaleString()} FCFA` : "—"}</span> 
                        </div> 
                        <div className="summary-row total"> 
                            <span>Total</span> 
                            <span>{getGrandTotal().toLocaleString()} FCFA</span> 
                        </div> 
                    </div>

                    {/* ── DELIVERY SERVICE CHECKBOX + MAP ─────────── */}
                    <div className="delivery-section">
                      <label className="delivery-checkbox-label">
                        <input
                          type="checkbox"
                          id="request-delivery"
                          className="delivery-checkbox-input"
                          checked={requestDelivery}
                          onChange={(e) => {
                            setRequestDelivery(e.target.checked);
                            if (!e.target.checked) {
                              setDeliveryPin(null);
                              setDeliveryAddress("");
                              setDeliveryDistance(null);
                              setDeliveryFee(0);
                              setMapFullscreen(false);
                              if (markerRef.current && mapInstanceRef.current) {
                                mapInstanceRef.current.removeLayer(markerRef.current);
                                markerRef.current = null;
                              }
                            }
                          }}
                        />
                        <span className="delivery-checkbox-custom"></span>
                        <div className="delivery-label-text">
                          <span className="delivery-label-title">Request Delivery Service</span>
                          <span className="delivery-label-subtitle">Select if you want materials delivered to your location.</span>
                        </div>
                      </label>

                      {requestDelivery && (
                        <div className={`delivery-map-wrapper${mapFullscreen ? " fullscreen" : ""}`}>
                          <p className="delivery-map-hint">Click on the map to select your delivery location</p>
                          <div className="delivery-map-container">
                            <div
                              id="leaflet-delivery-map"
                              className="leaflet-map-box"
                              ref={(el) => {
                                if (el && !mapInstanceRef.current) {
                                  initMap(el);
                                } else if (el && mapInstanceRef.current) {
                                  // Ensure map click handler is up-to-date
                                  mapInstanceRef.current.off("click");
                                  mapInstanceRef.current.on("click", handleMapClick);
                                  setTimeout(() => mapInstanceRef.current.invalidateSize(), 50);
                                }
                              }}
                            />

                            {/* ── Fullscreen toggle ── */}
                            <button
                              className="map-fullscreen-btn"
                              onClick={() => {
                                setMapFullscreen((v) => !v);
                                setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
                              }}
                              title={mapFullscreen ? "Exit fullscreen" : "Expand map"}
                            >
                              {mapFullscreen ? <FaCompress /> : <FaExpand />}
                            </button>

                            {/* ── Tap hint when no pin ── */}
                            {!deliveryPin && (
                              <div className="map-tap-hint">
                                <FaMapMarkerAlt className="map-hint-icon" />
                                <span>Tap to pin delivery spot</span>
                              </div>
                            )}
                          </div>

                          {/* ── Info card after pin ── */}
                          {deliveryPin && (
                            <div className="delivery-info-card">
                              <div className="delivery-info-row">
                                <span className="info-label">Address</span>
                                <span className="info-value">
                                  {geocoding ? "Locating..." : deliveryAddress || "—"}
                                </span>
                              </div>
                              <div className="delivery-info-row">
                                <span className="info-label">Coordinates</span>
                                <span className="info-value">
                                  {deliveryPin.lat.toFixed(4)}, {deliveryPin.lng.toFixed(4)}
                                </span>
                              </div>
                              <div className="delivery-info-row">
                                <span className="info-label">Est. Distance</span>
                                <span className="info-value">
                                  {deliveryDistance ? `${deliveryDistance.toFixed(1)} km` : "—"}
                                </span>
                              </div>
                              <div className="delivery-info-row delivery-fee-row">
                                <span className="info-label"><strong>Delivery Fee</strong></span>
                                <span className="info-value delivery-fee-amount">
                                  {deliveryFee.toLocaleString()} FCFA
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* ─────────────────────────────────────────────── */}
                </>
                )} 
            </div>

            {/* ── Footer: pinned at bottom, outside scroll area ── */}
            {productsCart.length > 0 && (
                <div className="cart-footer"> 
                    <button className="continue-shopping" onClick={() => setShowCart(false)}>Continue Shopping</button> 
                    <button className="checkout-btn" onClick={(e) => { 
                        e.stopPropagation(); setShowPayment(true); setShowCart(false);
                    }} disabled={productsCart.length === 0}> 
                        Proceed to Checkout 
                        <FaArrowRight className="btn-icon" /> 
                    </button> 
                </div>
            )}
        </div> 
    </div>

    {/* --- ORDER HISTORY SIDEBAR --- */}
    <div className={`orders-overlay ${showOrders ? "open" : ""}`} onClick={() => setShowOrders(false)}>
      <div className="orders-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="orders-header">
          <div className="orders-title-row">
            <FaClock className="history-header-icon" />
            <div>
              <h3>Order History</h3>
              <p className="orders-subtitle">View all your previous orders</p>
            </div>
          </div>
          <button className="close-orders" onClick={() => setShowOrders(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="orders-controls">
          <div className="orders-search-wrap">
            <FaSearch className="orders-search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="orders-search-input"
            />
          </div>
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="orders-status-select"
          >
            <option value="All">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="orders-content">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <FaClock className="empty-icon" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderIds.includes(order.id);
                const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                });
                const totalItemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

                return (
                  <div key={order.id} className="order-card">
                    {/* Header: Order ID & Status */}
                    <div className="order-card-header">
                      <div className="order-id-wrap">
                        <span className="order-id-label">ORDER #{order.id.slice(-6).toUpperCase()}</span>
                        <span className={`order-status-badge ${order.status?.toLowerCase().replace(" ", "-")}`}>
                          {order.status}
                        </span>
                      </div>
                      <button 
                        className="order-trash-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                        aria-label="Remove order from history"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {/* Metadata lines */}
                    <div className="order-meta-info">
                      <div className="meta-line">
                        <FaClock size={12} className="meta-icon" />
                        <span>{orderDate}</span>
                      </div>
                      {order.customer_address && (
                        <div className="meta-line">
                          <FaUser size={12} className="meta-icon" />
                          <span>{order.customer_address}</span>
                        </div>
                      )}
                      <div className="meta-line">
                        <FaShoppingCart size={12} className="meta-icon" />
                        <span>{totalItemsCount} Product{totalItemsCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="order-card-footer">
                      <button 
                        className="view-details-btn" 
                        onClick={() => toggleExpandOrder(order.id)}
                      >
                        {isExpanded ? "Hide Details" : "View Details"} <span>{isExpanded ? "▲" : "▶"}</span>
                      </button>
                      <div className="order-total-price">
                        {parseFloat(order.total_price).toLocaleString()} FCFA
                      </div>
                    </div>

                    {/* Expanded Items details */}
                    {isExpanded && (
                      <div className="order-expanded-details animate-fade-in">
                        <div className="expanded-divider" />
                        <div className="expanded-items-list">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="expanded-item-row">
                              <span className="item-name-qty">
                                {item.quantity} × {item.product_name || "Product"}
                              </span>
                              <span className="item-price-sub">
                                {parseFloat(item.price_at_purchase).toLocaleString()} FCFA
                              </span>
                            </div>
                          ))}
                        </div>
                        {order.transaction_id && (
                          <div className="order-txn-id">
                            <span>Txn: {order.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="orders-footer">
          <button className="view-all-history-btn" onClick={() => setShowOrders(false)}>
            View Full Order History
          </button>
        </div>
      </div>
    </div>

    {/* Product Quick View Modal */} 
    {selectedProduct && ( 
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}> 
            <div className="product-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedProduct(null)} > 
                    <FaTimes /> 
                </button>
                <div className="modal-content"> 
                    <div className="modal-image"> 
                        <img src={selectedProduct.image} alt={selectedProduct.name} />
                        {" "} {/* Use actual image */} 
                    </div>
                    <div className="modal-info"> 
                        <h2>{selectedProduct.name}</h2> 
                        <p>{selectedProduct.description}</p> 
                        <div className="modal-rating"> 
                            {renderStars(selectedProduct.rating)} 
                            <span>({selectedProduct.rating})</span> 
                        </div>
                        <div className="modal-price"> 
                            {selectedProduct.discount > 0 ? ( 
                                <> 
                                <span className="original"> {selectedProduct.price.toLocaleString()} FCFA </span> 
                                <span className="discounted"> {getDiscountedPrice( selectedProduct.price, selectedProduct.discount ).toLocaleString()}{" "} FCFA </span> 
                                </>
                            ) : (
                            <span>{selectedProduct.price.toLocaleString()} FCFA</span> )} 
                        </div>
                        <button className="modal-add-cart" onClick={() => { handleAddToCart(selectedProduct); 
                        setSelectedProduct(null); }} disabled={!selectedProduct.in_stock} > 
                        {selectedProduct.in_stock ? "Add to Cart" : "Out of Stock"} 
                        </button>
                    </div>
                </div>
            </div>
        </div>
        )}

      {/* --- PAYMENT MODAL --- */}
      {showPayment && <PaymentModal />}
    </div>
  );
};

export default Shop;

