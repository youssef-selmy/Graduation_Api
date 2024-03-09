const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const factory = require('./handlersFactoryController');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const Brand = require('../models/brandModel');

// Upload single image
exports.uploadBrandImage = uploadSingleImage('image');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  try {
    // Initialize Cloudinary configuration
    cloudinary.config({
      cloud_name: "dew24xujs",
      api_key: "513942924689786",
      api_secret: "IENaRv4j2OOeIWAPc9v0ayx98Vk",
    });

    if (req.file) {
      const fileBuffer = req.file.buffer;
      const base64str = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
      
      const result = await cloudinary.uploader.upload(base64str, {
        folder: "brands",
        format: "jpg",
        quality: "auto:best",
      });

      // Save image URL into our db
      req.body.image = result.secure_url;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// @desc    Get list of brands
// @route   GET /api/v1/brands
// @access  Public
exports.getBrands = factory.getAll(Brand);

// @desc    Get specific brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = factory.getOne(Brand);

// @desc    Create brand
// @route   POST  /api/v1/brands
// @access  Private
exports.createBrand = factory.createOne(Brand);

// @desc    Update specific brand
// @route   PUT /api/v1/brands/:id
// @access  Private
exports.updateBrand = factory.updateOne(Brand);

// @desc    Delete specific brand
// @route   DELETE /api/v1/brands/:id
// @access  Private
exports.deleteBrand = factory.deleteOne(Brand);