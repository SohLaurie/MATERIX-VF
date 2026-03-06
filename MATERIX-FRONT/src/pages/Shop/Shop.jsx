import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Shop.css";
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

} from "react-icons/fa";
import { addProduct, deleteProduct, decrease } from "./cart/cart.js";
import { style } from "framer-motion/client";

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
  const [selectedProduct, setSelectedProduct] = useState(null);

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
        return;
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/shop/orders/",
        {
          items: productsCart.map((item) => ({
            product: item.product.id,            // ✅ use nested product id
            quantity: item.quantity,
            price_at_purchase: getDiscountedPrice(item.product.price, item.product.discount), // ✅ discounted price
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Order created:", response.data);
    } catch (error) {
      console.error("❌ Error creating order:", error.response?.data || error);
      if (error.response?.status === 403) {
        alert("🚫 Order failed: Unauthorized. Please log in again.");
      } else if (error.response?.status === 400) {
        alert("⚠️ Order failed: " + JSON.stringify(error.response.data));
      }
    }
  };



  const simulatePayment = (amount, method, phoneNumber = "") =>{
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Generate a fake transaction ID
        const transactionId = "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase();
        const newPaymentCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        setPaymentCode(newPaymentCode);
        // For demo purposes, we'll always return success
        resolve({ success: true, transactionId, paymentCode: newPaymentCode, message: "Payment successful" });
      }, 2000);
    });
    };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentDetails.phone || !paymentDetails.name) return;
    setIsProcessing(true);
    try {
      // Simulate payment processing
      const result = await simulatePayment(getTotalPrice(), paymentMethod, paymentDetails.phone);
      setIsProcessing(false);
      if (result.success) {
        setPaymentStep("confirmation");
        // ✅ send order to Django after payment success
        await createOrder();
        // Clear cart after showing success message
        setTimeout(() => {
          setShowPayment(false);
          setPaymentStep("method");
        // Clear payment details
          setPaymentDetails({ phone: "", email: "", name: "" });
        // Clear cart items  
          productsCart.forEach((item) => dispatch(deleteProduct(item.product.id)));
        }, 2000);
      }else { 
        // Show error message 
            alert(result.error); 
        }
    } catch (err) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      alert("An error occurred while processing your payment, please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------- LOADING / ERROR -------------------
  if (loading) return <p className="loading">Loading products, please wait...</p>;
  if (error) return <p className="error">{error}</p>;

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
              <span className="amount">{getTotalPrice().toLocaleString()} FCFA</span>
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
                    <span className="amount"> {getTotalPrice().toLocaleString()} FCFA </span> 
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
              <div className="payment-actions"> 
                <button type="button" className="back-btn" onClick={() => setPaymentStep("method")} disabled={isProcessing} > Back </button> 
                <button type="submit" className="pay-now-btn" disabled={ isProcessing || !paymentDetails.phone || !paymentDetails.name } > 
                    {isProcessing ? ( <> 
                    <span className="spinner"></span> Processing... </> 
                    ) : 
                    ( `Pay ${getTotalPrice().toLocaleString()} FCFA `)} 
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
            <button className="wishlist-btn" onClick={() => toggleWishlist(selectedProduct)} > 
                <FaHeart /> 
                {wishlist.length > 0 && ( 
                <span className="count">{wishlist.length}</span> 
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
                            <span>Shipping</span> 
                            <span>Calculated at checkout</span> 
                        </div> 
                        <div className="summary-row total"> 
                            <span>Total</span> 
                            <span>{getTotalPrice().toLocaleString()} FCFA</span> 
                        </div> 
                    </div>

                    <div className="cart-footer"> 
                        <button className="continue-shopping" onClick={() => setShowCart(false)} > Continue Shopping 
                        </button> 
                        <button className="checkout-btn" onClick={(e) => { 
                            e.stopPropagation(); setShowPayment(true); setShowCart(false); }} disabled={productsCart.length === 0} > 
                            Proceed to Checkout 
                            <FaArrowRight className="btn-icon" /> 
                        </button> 
                    </div> 
                </>
                )} 
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
