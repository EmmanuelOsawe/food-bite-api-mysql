const { Reservation, User } = require("../models");
const { Op } = require("sequelize");

exports.createReservation = async (req, res) => {
  try {
    const { date, time, guests, phone, name } = req.body;
    if (!date || !time || !guests) {
      return res.status(400).json({ success: false, message: "Date, time and guests are required." });
    }

    const today = new Date(); today.setHours(0,0,0,0);
    if (new Date(date) < today) {
      return res.status(400).json({ success: false, message: "Date cannot be in the past." });
    }

    const reservation = await Reservation.create({
      customerId: req.user.id,
      date, time,
      guests: Number(guests),
      phone: phone || req.user.phone || null,
    });

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { customerId: req.user.id },
      order: [["date", "DESC"]],
    });
    res.status(200).json({ success: true, total: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    const where = {};
    if (status) where.status = status;

    // MySQL date range query
    if (date) {
      where.date = { [Op.eq]: date }; // exact date match
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where,
      include: [{ model: User, as: "customer", attributes: ["name", "email"] }],
      order: [["date", "ASC"]],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({ success: true, total: count, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Reservation.update({ status }, { where: { id: req.params.id } });
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: User, as: "customer", attributes: ["name", "email"] }],
    });
    if (!reservation) return res.status(404).json({ success: false, message: "Not found." });
    res.status(200).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: "Not found." });
    if (reservation.customerId !== req.user.id) return res.status(403).json({ success: false, message: "Access denied." });
    if (["cancelled","completed"].includes(reservation.status)) {
      return res.status(400).json({ success: false, message: `Already ${reservation.status}.` });
    }
    reservation.status = "cancelled";
    await reservation.save();
    res.status(200).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};