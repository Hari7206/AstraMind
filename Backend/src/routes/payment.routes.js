import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import {createOrder, verifyPayment,getSubscription} from "../controller/payment.controller.js";

const paymentRouter = Router();

// Create Razorpay order (₹50)
paymentRouter.post("/create-order", authUser, createOrder);

// Verify payment after user pays
paymentRouter.post("/verify", authUser, verifyPayment);

// Get current subscription status
paymentRouter.get("/subscription", authUser, getSubscription);

export default paymentRouter;