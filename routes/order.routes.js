const express = require("express");
const router = express.Router();
const { placeOrder, getMyOrders, getAllOrders, updateOrderStatus } = require("../controllers/order.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.post("/", protect, placeOrder);
router.get("/my", protect, getMyOrders);
router.get("/", protect, restrictTo("admin"), getAllOrders);
router.patch("/:id/status", protect, restrictTo("admin"), updateOrderStatus);

module.exports = router;