import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  loadRazorpayScript,
  createOrder,
  verifyPayment,
  openRazorpayCheckout,
  getSubscription,
} from "../service/razorpay.service.js";
import { useDispatch } from "react-redux";
import { setPlan } from "../../chat/chat.slice.js";
import "../style/Pricing.css";

export default function Pricing() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("free");

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const data = await getSubscription();
      setCurrentPlan(data.plan);
      dispatch(setPlan(data.plan));
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      const orderData = await createOrder();
      if (!orderData.success) {
        alert(orderData.message || "Failed to create order");
        setLoading(false);
        return;
      }

      openRazorpayCheckout(
        orderData,
        async (paymentResponse) => {
          try {
            const verifyData = await verifyPayment({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyData.success) {
              setCurrentPlan("pro");
              dispatch(setPlan("pro"));
              alert("🎉 Payment successful! You are now a Pro user.");
              navigate("/");
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
          setLoading(false);
        },
        (error) => {
          console.error("Payment failed:", error);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      {/* Ambient glow */}
      <div className="ambient-glow-container">
        <div className="ambient-glow orb-1"></div>
        <div className="ambient-glow orb-2"></div>
      </div>

      <div className="pricing-content">
        {/* Header */}
        <div className="pricing-header">
          <span className="brand-text">
            ASTRA<span className="brand-highlight">MIND</span>
          </span>
          <h1 className="page-title">Choose Your Plan</h1>
          <p className="page-subtitle">Upgrade to Pro for unlimited job searches</p>
        </div>

        {/* Plans Grid */}
        <div className="plans-grid">
          {/* Free Plan */}
          <div className="plan-card plan-free">
            <div className="card-shimmer"></div>
            <div className="plan-content">
              <div className="plan-header">
                <h2 className="plan-name">Free</h2>
                <p className="plan-price">₹0</p>
                <p className="plan-duration">Forever free</p>
              </div>

              <div className="plan-features">
                <div className="feature-item">
                  <span className="feature-icon active">✓</span>
                  <span>2 job searches per day</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon active">✓</span>
                  <span>Basic job recommendations</span>
                </div>
                <div className="feature-item disabled">
                  <span className="feature-icon inactive">✗</span>
                  <span>No saved jobs</span>
                </div>
                <div className="feature-item disabled">
                  <span className="feature-icon inactive">✗</span>
                  <span>No priority support</span>
                </div>
              </div>

              <button className="plan-btn plan-btn-free" disabled>
                {currentPlan === "free" ? "✓ Current Plan" : "Free"}
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="plan-card plan-pro">
            <div className="card-shimmer"></div>
            
            {/* Popular badge */}
            <div className="popular-badge-wrapper">
              <div className="popular-badge">POPULAR</div>
            </div>

            <div className="plan-content">
              <div className="plan-header">
                <h2 className="plan-name">Pro</h2>
                <p className="plan-price">₹50</p>
                <p className="plan-duration">Per month</p>
              </div>

              <div className="plan-features">
                <div className="feature-item">
                  <span className="feature-icon active">✓</span>
                  <span>Unlimited job searches</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon active">✓</span>
                  <span>Save jobs for later</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon active">✓</span>
                  <span>Priority support</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon active">✓</span>
                  <span>Email job alerts</span>
                </div>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading || currentPlan === "pro"}
                className={`plan-btn plan-btn-pro ${currentPlan === "pro" ? "plan-btn-current" : ""}`}
              >
                {loading ? (
                  <span className="btn-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Processing...
                  </span>
                ) : currentPlan === "pro" ? (
                  "✓ Already Pro"
                ) : (
                  "Upgrade Now"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="back-button">
          <button onClick={() => navigate("/")} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}