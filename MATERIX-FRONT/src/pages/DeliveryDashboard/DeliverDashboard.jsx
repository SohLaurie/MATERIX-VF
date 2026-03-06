import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DeliverDashboard.css";
import { FaCheckCircle, FaTimesCircle, FaClipboardList, FaEye } from "react-icons/fa";
import NavbarDel from "../../components/Navbar_delivery";

const DeliverDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);

  const token = localStorage.getItem("access"); // Your JWT token

  // Fetch all orders from backend
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/shop/delivery/orders/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const res = await axios.patch(
        `http://localhost:8000/api/shop/delivery/orders/${orderId}/assign/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, assigned_agent: "You", status: "In Progress" }
            : order
        )
      );
    } catch (err) {
      console.error("Error assigning order:", err);
    }
  };

  const handleDelivered = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/shop/delivery/orders/${orderId}/deliver/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "Delivered" } : order
        )
      );
    } catch (err) {
      console.error("Error marking order delivered:", err);
    }
  };

  // Card counts
  const assignedOrders = orders.filter((o) => o.status === "Pending").length;
  const inprogressOrders = orders.filter((o) => o.status === "In Progress").length;
  const completedOrders = orders.filter((o) => o.status === "Delivered").length;

  return (
    <>
      <NavbarDel />
      <div className="deliver-dashboard">
        <h1 className="dashboard-title">DELIVERY AGENT DASHBOARD</h1>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <p className="stat-label">ASSIGNED ORDERS</p>
            <h2>{assignedOrders}</h2>
            <div className="stat-icon total">
              <FaClipboardList />
            </div>
          </div>
          <div className="stat-card">
            <p className="stat-label">IN PROGRESS</p>
            <h2>{inprogressOrders}</h2>
            <div className="stat-icon accepted">
              <FaCheckCircle />
            </div>
          </div>
          <div className="stat-card">
            <p className="stat-label">DELIVERED</p>
            <h2>{completedOrders}</h2>
            <div className="stat-icon rejected">
              <FaTimesCircle />
            </div>
          </div>
        </div>

        <h2 className="deliveries-title">MANAGE DELIVERIES</h2>

        {/* Orders List */}
        <div className="orders-section">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-info">
                <strong>Order ID: {order.id}</strong>
                <p>Customer: {order.customer_username}</p>
              </div>
              <div className="order-actions">
                {!order.assigned_agent && (
                  <button className="btn-accept" onClick={() => handleAccept(order.id)}>
                    Accept
                  </button>
                )}
                {order.assigned_agent && order.assigned_agent !== "You" && (
                  <span className="taken-text">Taken</span>
                )}
                <button className="btn-view" onClick={() => setViewOrder(order)}>
                  <FaEye />
                </button>
                {order.assigned_agent === "You" && order.status !== "Delivered" && (
                  <button className="btn-deliver" onClick={() => handleDelivered(order.id)}>
                    Mark Out for Delivery
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {viewOrder && (
          <div className="modal">
            <div className="modal-content">
              <h3>Order Details</h3>
              <p><strong>ID:</strong> {viewOrder.id}</p>
              <p><strong>Customer:</strong> {viewOrder.customer_username}</p>
              <p><strong>Location:</strong> {viewOrder.customer_address}</p>
              <div>
                <strong>Products:</strong>
                <ul className="order-products-list"> 
                  {viewOrder.items.map((i) => (
                    <li key={i.id}>
                      {i.product_name} ({i.quantity})
                    </li>
                  ))}
                </ul>
              </div>
              <p><strong>Status:</strong> {viewOrder.status}</p>
              <p><strong>Assigned Agent:</strong> {viewOrder.assigned_agent || "None"}</p>
              <button className="close-modal" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeliverDashboard;
