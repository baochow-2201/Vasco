// src/controllers/media.controller.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Media } = require("../models");

// Setup multer local storage (uploads/)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = {
  // middleware to use in routes: single/multiple
  upload, // export multer instance for route mounting: router.post('/upload', mediaController.upload.single('file'), handler)

  // upload handler that saves DB record
  uploadHandler: async (req, res) => {
    try {
      if (!req.file && !req.files) return res.status(400).json({ message: "No file uploaded" });

      const saved = [];
      const files = req.files ? req.files : [req.file];
      for (const f of files) {
        const url = `/uploads/${f.filename}`; // serve static in app.js
        const isImage = f.mimetype.startsWith("image");
        const media = await Media.create({
          public_id: f.filename,
          url,
          type: isImage ? "image" : "video",
          format: path.extname(f.originalname).replace(".", ""),
          width: null,
          height: null,
          duration: null,
        });
        saved.push(media);
      }
      return res.status(201).json({ message: "Uploaded", media: saved });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get all media
  getAll: async (req, res) => {
    try {
      const items = await Media.findAll({ order: [["created_at", "DESC"]] });
      return res.json(items);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get one media
  getById: async (req, res) => {
    try {
      const item = await Media.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      return res.json(item);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Update metadata
  update: async (req, res) => {
    try {
      const item = await Media.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      await item.update(req.body);
      return res.json({ message: "Updated", item });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Delete (also remove local file if exists)
  delete: async (req, res) => {
    try {
      const item = await Media.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });

      // remove local file if uploaded locally
      if (item.public_id) {
        const filePath = path.join(UPLOAD_DIR, item.public_id);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }
      }

      await item.destroy();
      return res.json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
