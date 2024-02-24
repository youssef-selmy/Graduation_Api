const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const Category = require('../models/categoryModel');

// Upload single image
exports.uploadCategoryImage = uploadSingleImage('image');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/categories/${filename}`);

    // Save image into our db
    req.body.image = filename;
  }

  next();
});

// Get list of categories
// GET /api/v1/categories
exports.getCategories = factory.getAll(Category);

//Get specific category by id
//GET /api/v1/categories/:id
exports.getCategory = factory.getOne(Category);

// Create category
// POST /api/v1/categories
exports.createCategory = factory.createOne(Category);

// Update specific category
// PUT /api/v1/categories/:id
exports.updateCategory = factory.updateOne(Category);

// Delete specific category
// DELETE /api/v1/categories/:id
exports.deleteCategory = factory.deleteOne(Category);
