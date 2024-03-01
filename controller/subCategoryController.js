const factory = require('./handlersFactoryController');
const SubCategory = require('../models/subCategoryModel');

exports.setCategoryIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

// Nested route
// GET /api/v1/categories/:categoryId/subcategories
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObj = filterObject;
  next();
};

//  Get list of subcategories
//  GET /api/v1/subcategories

exports.getSubCategories = factory.getAll(SubCategory);

//  Get specific subcategory by id
//  GET /api/v1/subcategories/:id

exports.getSubCategory = factory.getOne(SubCategory);

//  Create subCategory
//  POST  /api/v1/subcategories

exports.createSubCategory = factory.createOne(SubCategory);

//  Update specific subcategory
//  PUT /api/v1/subcategories/:id

exports.updateSubCategory = factory.updateOne(SubCategory);

// Delete specific subCategory
//  DELETE /api/v1/subcategories/:id

exports.deleteSubCategory = factory.deleteOne(SubCategory);
