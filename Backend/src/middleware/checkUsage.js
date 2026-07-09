import userModel from "../model/user.model.js";

export async function checkUsage(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    if (user.subscription.plan === "pro") {
      req.userData = user;
      return next();
    }

    // Free user: Check if new day
    if (user.subscription.lastSearchDate !== today) {
  
      user.subscription.jobSearchesToday = 0;
      user.subscription.lastSearchDate = today;
      await user.save();
    }

    if (user.subscription.jobSearchesToday >= 2) {
      return res.status(429).json({
        success: false,
        message: "Daily job search limit reached (2/day). Upgrade to Pro for unlimited searches.",
        limitReached: true,
        plan: "free",
        searchesUsed: user.subscription.jobSearchesToday,
        limit: 2,
      });
    }

    req.userData = user;
    next();

  } catch (error) {
    console.error("Usage check error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}