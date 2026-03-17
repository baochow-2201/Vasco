const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise} Upload result with secure_url
 */
const uploadToCloudinary = async (filePath, folder = 'vasco') => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
    });

    // Delete local file after upload
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Could not delete local file:', filePath);
    }

    return {
      public_id: result.public_id,
      url: result.secure_url,
      type: result.resource_type === 'video' ? 'video' : 'image',
      format: result.format,
    };
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    throw err;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
    throw err;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
