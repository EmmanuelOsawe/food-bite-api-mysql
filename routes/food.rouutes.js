const express = require("express");
const router = express.Router();
const { addFood, getAllFoods, getSingleFood, toggleAvailability, deleteFood } = require("../controllers/food.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.get("/", getAllFoods);
router.get("/:id", getSingleFood);
router.post("/", protect, restrictTo("admin"), addFood);
router.patch("/:id/availability", protect, restrictTo("admin"), toggleAvailability);
router.delete("/:id", protect, restrictTo("admin"), deleteFood);

module.exports = router;