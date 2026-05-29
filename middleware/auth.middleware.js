// middleware/auth.middleware.js
// Same logic as MongoDB version — JWT verification
// Only difference: we query MySQL instead of MongoDB

const jwt = require("jsonwebtoken");
const { User } = require("../models");

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // MySQL: findByPk (find by Primary Key) = MongoDB: findById
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }, // don't return password
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired." });
    }
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    next();
  };
};

module.exports = { protect, restrictTo };