// src/app.js
const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Static file cho uploads (ảnh/video)
app.use("/uploads", express.static("uploads"));

// Routes prefix
app.use("/api", routes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Vasco API running..." });
});

// Error handler - capture uncaught errors and return json
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  return res.status(500).json({ message: err.message, stack: err.stack });
});

module.exports = app;
