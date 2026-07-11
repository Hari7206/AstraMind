import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Load Razorpay script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create Razorpay order (₹50)
export const createOrder = async () => {
  const response = await api.post("/api/payment/create-order");
  return response.data;
};

// Verify payment
export const verifyPayment = async (data) => {
  const response = await api.post("/api/payment/verify", data);
  return response.data;
};

// Get subscription status
export const getSubscription = async () => {
  const response = await api.get("/api/payment/subscription");
  return response.data;
};

// Open Razorpay Checkout
export const openRazorpayCheckout = (orderData, onSuccess, onFailure) => {
  const options = {
    key: orderData.key,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "AstraMind",
    description: "Pro Plan - Unlimited Job Searches",
    order_id: orderData.orderId,
    prefill: {
      name: "User",
      email: "user@example.com",
      contact: "9999999999",
    },
    theme: {
      color: "#7c3aed",
    },
    modal: {
      ondismiss: function () {
        if (onFailure) onFailure("Payment cancelled");
      },
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      }
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};