const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const factory = require('./handlersFactoryController');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const Category = require('../models/categoryModel');

// Upload single image
exports.uploadCategoryImage = uploadSingleImage('image');



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
          folder: "category",
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
//  Get list of categories
// GET /api/v1/categories
exports.getCategories = factory.getAll(Category);

// Get specific category by id
// GET /api/v1/categories/:id
exports.getCategory = factory.getOne(Category);

// Create category
// POST  /api/v1/categories
exports.createCategory = factory.createOne(Category);

// Update specific category
// PUT /api/v1/categories/:id
exports.updateCategory = factory.updateOne(Category);

//  Delete specific category
//  DELETE /api/v1/categories/:id

exports.deleteCategory = factory.deleteOne(Category);
