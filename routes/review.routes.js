const express = require("express");
const router = express.Router();
const { createFoodReview, createRestaurantReview, getFoodReviews, getRestaurantReviews, replyToReview, deleteReview } = require("../controllers/review.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.get("/food/:foodId", getFoodReviews);
router.get("/restaurant", getRestaurantReviews);
router.post("/food/:foodId", protect, createFoodReview);
router.post("/restaurant", protect, createRestaurantReview);
router.patch("/:id/reply", protect, restrictTo("admin"), replyToReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;