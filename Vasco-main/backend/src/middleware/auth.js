// src/middleware/auth.js

const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = {
  // ----------------------------------------------------
  // 1. VERIFY TOKEN - kiểm tra JWT
  // ----------------------------------------------------
  verifyToken: async (req, res, next) => {
    try {
      let token = req.headers["authorization"];

      if (!token)
        return res.status(401).json({ message: "Token missing" });

      // token dạng: Bearer abcxyz
      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.userId = decoded.id;
      req.role = decoded.role;

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token", error: err.message });
    }
  },

  // ----------------------------------------------------
  // 2. CHỈ USER THƯỜNG MỚI ĐƯỢC TRUY CẬP
  // ----------------------------------------------------
  isUser: (req, res, next) => {
    if (req.role === "user" || req.role === "admin") return next();
    return res.status(403).json({ message: "User access only" });
  },

  // ----------------------------------------------------
  // 3. CHỈ ADMIN MỚI ĐƯỢC TRUY CẬP
  // ----------------------------------------------------
  isAdmin: (req, res, next) => {
    if (req.role === "admin") return next();
    return res.status(403).json({ message: "Admin access only" });
  },

  // ----------------------------------------------------
  // 4. GẮN THÔNG TIN USER VÀO req.user
  // ----------------------------------------------------
  attachUser: async (req, res, next) => {
    try {
      if (!req.userId) return next();

      const user = await User.findByPk(req.userId, {
        attributes: ["id", "username", "full_name", "email", "role", "status"]
      });

      if (!user) {
        console.warn('User not found for id:', req.userId);
        return next(); // Continue anyway, let controller handle missing user
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('Error attaching user:', err);
      return res.status(500).json({ message: "Cannot attach user", error: err.message });
    }
  },
};
