// controllers/contact.controller.js
const { ContactMessage } = require("../models");

exports.sendMessage = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email and message are required." });
    }
    const contact = await ContactMessage.create({ name, phone, email, message });
    res.status(201).json({ success: true, message: "Message received!", contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: messages } = await ContactMessage.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    const unread = await ContactMessage.count({ where: { isRead: false } });

    res.status(200).json({ success: true, total: count, unread, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found." });
    await msg.update({ isRead: true });
    res.status(200).json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found." });
    await msg.destroy();
    res.status(200).json({ success: true, message: "Deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};