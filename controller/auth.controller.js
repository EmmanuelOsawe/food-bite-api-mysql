// controllers/auth.controller.js
// Compare with MongoDB version to see the differences:
// MongoDB: User.create()          → MySQL: User.create() (same with Sequelize!)
// MongoDB: User.findOne({email})  → MySQL: User.findOne({ where: { email } })
// MongoDB: user.toObject()        → MySQL: user.toJSON()

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user.id); // MySQL uses .id not ._id
  const userObj = user.toJSON();
  delete userObj.password;
  res.status(statusCode).json({ success: true, token, user: userObj });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }

    // MySQL: findOne with WHERE clause
    // MongoDB equivalent: User.findOne({ email })
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // MySQL: create works same as MongoDB
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "customer",
      phone: phone || null,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // findOne with WHERE — MySQL equivalent of MongoDB's findOne({ email })
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};