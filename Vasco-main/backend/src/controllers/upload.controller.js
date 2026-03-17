// src/controllers/upload.controller.js
const cloudinary = require('cloudinary').v2;
const { UserProfile } = require('../models');

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc0slglxh',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
  uploadAvatar: async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      // Check if image is base64
      if (!image.startsWith('data:')) {
        return res.status(400).json({ error: 'Invalid image format' });
      }

      console.log('🖼️ Uploading avatar to Cloudinary...');
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'avatars',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });

      console.log('✅ Avatar uploaded to Cloudinary:', result.secure_url);

      return res.json({
        message: 'Avatar uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error('❌ Avatar upload error:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  uploadCover: async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('🎨 Uploading cover to Cloudinary...');
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'covers',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });

      console.log('✅ Cover uploaded to Cloudinary:', result.secure_url);

      return res.json({
        message: 'Cover uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error('❌ Cover upload error:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  uploadPost: async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('📸 Uploading post image to Cloudinary...');
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'posts',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });

      console.log('✅ Post image uploaded to Cloudinary:', result.secure_url);

      return res.json({
        message: 'Post image uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error('❌ Post upload error:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  uploadMessage: async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('📤 Uploading message image to Cloudinary...');
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'messages',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });

      console.log('✅ Message image uploaded to Cloudinary:', result.secure_url);

      return res.json({
        message: 'Message image uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error('❌ Message upload error:', err);
      return res.status(500).json({ error: err.message });
    }
  },
};
