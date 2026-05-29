// controllers/review.controller.js
const { Review, User, Food } = require("../models");
const { Op } = require("sequelize");

// ─── CUSTOMER: Create food review ─────────────────────────────────────────────
exports.createFoodReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required." });
    }

    const food = await Food.findByPk(req.params.foodId);
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });

    // Check if already reviewed — MySQL: findOne with WHERE
    const existing = await Review.findOne({
      where: { customerId: req.user.id, foodId: req.params.foodId, type: "food" },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "You already reviewed this item." });
    }

    const review = await Review.create({
      customerId: req.user.id,
      type: "food",
      foodId: req.params.foodId,
      rating: Number(rating),
      title,
      comment,
    });

    // Update food average rating
    const allRatings = await Review.findAll({
      where: { foodId: req.params.foodId, type: "food" },
      attributes: ["rating"],
    });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await food.update({ averageRating: Math.round(avg * 10) / 10, totalRatings: allRatings.length });

    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: "customer", attributes: ["name", "avatar"] }],
    });

    res.status(201).json({ success: true, review: full });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CUSTOMER: Create restaurant review ───────────────────────────────────────
exports.createRestaurantReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required." });
    }

    const existing = await Review.findOne({
      where: { customerId: req.user.id, type: "restaurant" },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "You already reviewed the restaurant." });
    }

    const review = await Review.create({
      customerId: req.user.id,
      type: "restaurant",
      rating: Number(rating),
      title,
      comment,
    });

    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: "customer", attributes: ["name", "avatar"] }],
    });

    res.status(201).json({ success: true, review: full });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUBLIC: Get food reviews ──────────────────────────────────────────────────
exports.getFoodReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { type: "food", foodId: req.params.foodId },
      include: [{ model: User, as: "customer", attributes: ["name", "avatar"] }],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    const allRatings = await Review.findAll({
      where: { type: "food", foodId: req.params.foodId },
      attributes: ["rating"],
    });
    const avg = allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length) * 10) / 10
      : 0;

    res.status(200).json({ success: true, total: count, averageRating: avg, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUBLIC: Get restaurant reviews ───────────────────────────────────────────
exports.getRestaurantReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { type: "restaurant" },
      include: [{ model: User, as: "customer", attributes: ["name", "avatar"] }],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    const allRatings = await Review.findAll({
      where: { type: "restaurant" },
      attributes: ["rating"],
    });
    const avg = allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length) * 10) / 10
      : 0;

    res.status(200).json({ success: true, total: count, averageRating: avg, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Reply to review ────────────────────────────────────────────────────
exports.replyToReview = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Reply message required." });

    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    await review.update({ replyMessage: message, repliedAt: new Date() });

    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CUSTOMER/ADMIN: Delete review ────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    const isOwner = review.customerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Access denied." });

    await review.destroy();
    res.status(200).json({ success: true, message: "Review deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};