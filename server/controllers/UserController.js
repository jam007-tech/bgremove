import { Webhook } from "svix";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";


// ================= CLERK WEBHOOK =================

const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created":
        await userModel.create({
          clerkId: data.id,
          email: data.email_addresses[0].email_address,
          photo: data.profile_image_url,
          firstName: data.first_name,
          lastName: data.last_name,
          creditBalance: 0,
        });
        break;

      case "user.updated":
        await userModel.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0].email_address,
            photo: data.profile_image_url,
            firstName: data.first_name,
            lastName: data.last_name,
          }
        );
        break;

      case "user.deleted":
        await userModel.findOneAndDelete({ clerkId: data.id });
        break;
    }

    res.json({ success: true });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// ================= USER CREDITS =================

const userCredits = async (req, res) => {
  try {
    const { clerkId } = req.body;

    const userData = await userModel.findOne({ clerkId });

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      credits: userData.creditBalance,
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// ================= CREATE ORDER =================

const paymentRazorpay = async (req, res) => {
  try {

    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { clerkId, planId } = req.body;

    const userData = await userModel.findOne({ clerkId });

    if (!userData || !planId) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    let credits, plan, amount;

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;

      default:
        return res.json({ success: false, message: "Invalid Plan" });
    }

    // Save transaction (pending)
    const newTransaction = await transactionModel.create({
      clerkId,
      plan,
      amount,
      credits,
      payment: false,
      date: Date.now(),
    });

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id.toString(),
    });

    res.json({
      success: true,
      order,
    });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// ================= VERIFY PAYMENT =================

const verifyRazorpay = async (req, res) => {
  try {

    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    const transactionData = await transactionModel.findById(orderInfo.receipt);

    if (!transactionData) {
      return res.json({ success: false, message: "Transaction not found" });
    }

    if (transactionData.payment) {
      return res.json({ success: false, message: "Payment already processed" });
    }

    // 🔥 Update credits
    const userData = await userModel.findOne({ clerkId: transactionData.clerkId });

    const newBalance = userData.creditBalance + transactionData.credits;

    await userModel.findByIdAndUpdate(userData._id, {
      creditBalance: newBalance
    });

    // Mark transaction as paid
    await transactionModel.findByIdAndUpdate(transactionData._id, {
      payment: true
    });

    // 🔥 RETURN UPDATED BALANCE
    return res.json({
      success: true,
      creditBalance: newBalance
    });

  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export {
  clerkWebhooks,
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
};