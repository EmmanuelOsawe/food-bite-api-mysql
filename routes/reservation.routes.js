const express = require("express");
const router = express.Router();
const { createReservation, getMyReservations, cancelReservation, getAllReservations, updateReservationStatus } = require("../controllers/reservation.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.post("/", protect, createReservation);
router.get("/my", protect, getMyReservations);
router.patch("/:id/cancel", protect, cancelReservation);
router.get("/", protect, restrictTo("admin"), getAllReservations);
router.patch("/:id/status", protect, restrictTo("admin"), updateReservationStatus);

module.exports = router;