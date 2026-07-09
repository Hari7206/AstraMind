import Razorpay from "razorpay";
import Subscription from "../model/subscription.model.js";
import userModel from "../model/user.model.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Order
export async function createOrder(req, res) {
  try {
    console.log("🔍 createOrder called");
    const userId = req.user.id;
    console.log("👤 User ID:", userId);

    // Check existing subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      plan: "pro",
      status: "active",
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active Pro subscription",
      });
    }

    // Create order - RECEIPT MUST BE 40 CHARACTERS OR LESS
    const options = {
      amount: 5000,
      currency: "INR",
      receipt: `ord_${Date.now().toString().slice(-10)}`, // ✅ Fixed - max 40 chars
      notes: {
        userId: userId,
      },
    };

    console.log("📦 Creating order...");
    const order = await razorpay.orders.create(options);
    console.log("✅ Order created:", order.id);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
}

// 2. Verify Payment
export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.user.id;

    // Verify signature
    const crypto = await import("crypto");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Expire any existing active subscriptions
    await Subscription.updateMany(
      { user: userId, status: "active" },
      { status: "expired" }
    );

    // Calculate end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create new subscription
    const subscription = await Subscription.create({
      user: userId,
      plan: "pro",
      startDate: new Date(),
      endDate: endDate,
      status: "active",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

    // Update user model
    await userModel.findByIdAndUpdate(userId, {
      "subscription.plan": "pro",
      "subscription.startDate": new Date(),
      "subscription.endDate": endDate,
      "subscription.jobSearchesToday": 0,
      "subscription.lastSearchDate": new Date().toISOString().split("T")[0],
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified! You are now a Pro user.",
      plan: "pro",
      endDate: endDate,
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// 3. Get Current Subscription
export async function getSubscription(req, res) {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
    });

    const user = await userModel.findById(userId);

    return res.status(200).json({
      success: true,
      plan: user?.subscription?.plan || "free",
      subscription: subscription || null,
      searchesUsed: user?.subscription?.jobSearchesToday || 0,
      limit: user?.subscription?.plan === "pro" ? "Unlimited" : 2,
    });
  } catch (error) {
    console.error("Get subscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}