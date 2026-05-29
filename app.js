require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./config/database");

const authRoutes        = require("./routes/auth.routes");
const foodRoutes        = require("./routes/food.routes");
const orderRoutes       = require("./routes/order.routes");
const reservationRoutes = require("./routes/reservation.routes");
const reviewRoutes      = require("./routes/review.routes");
const contactRoutes     = require("./routes/contact.routes");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests." },
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/foods",        foodRoutes);
app.use("/api/orders",       orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews",      reviewRoutes);
app.use("/api/contact",      contactRoutes);

// Health check
app.get("/", (req, res) => res.json({ success: true, message: "🍔 food-bite-mysql running" }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || "Server error." });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 MySQL server running on port ${PORT}`));
});

module.exports = app;
