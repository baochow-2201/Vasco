const jwt = require("jsonwebtoken");

module.exports = {
  signToken: (payload, expires = "7d") => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expires });
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
};
