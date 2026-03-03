import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import imageRouter from "./routes/imageRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Hello World")
});
app.use("/api/user", userRouter);
app.use('/api/image',imageRouter)

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});