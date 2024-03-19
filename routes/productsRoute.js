const express = require("express");
const reviewsRoute = require('./reviewRoute');

const productRouter = express.Router();
const {
  addProductToShop,
  updateProductById,
  uploadProductImages,
  resizeProductImages,
  getProductById,
  deleteProductById,
  productQtyCheck,
  getProducts
} = require("../controller/productsController");

const {protect} = require("../controller/authController");
// const subscriptionController = require('../controllers/subscription')

// POST   /products/jkshjhsdjh2332n/reviews
// GET    /products/jkshjhsdjh2332n/reviews
// GET    /products/jkshjhsdjh2332n/reviews/87487sfww3
productRouter.use('/:productId/reviews', reviewsRoute);


productRouter
  .route("/")
  .post(protect,uploadProductImages,resizeProductImages,addProductToShop)
  .get(
    getProducts
  );

productRouter
  .route("/:productId")
  .get(getProductById)
 


  productRouter
  .route("/:id")
  .put(
    protect,
    uploadProductImages,
    resizeProductImages,
    updateProductById
  )
  .delete(
    protect,
    deleteProductById
  );
// productRouter
//   .route("/images/:productId")
//   .put(
//     protect,
//     productController.updateProductImages
//   );



productRouter
  .route("/qtycheck/:productId")
  .post(productQtyCheck);



// productRouter
//   .route("/related/products/:id")
//   .get(productController.relatedProducts);

// productRouter
//   .route("/interest/interest/products/:interest")
//   .get(productController.interestProducts);

// productRouter
//   .route("/channel/products/:channel")
//   .get(productController.channelProducts);
// productRouter
//   .route("/related/products/:id")
//   .get(productController.relatedProducts);


// productRouter.get("/is-subscription-valid", authController.protect, subscriptionController.isSubscriptionValid);

module.exports = productRouter;
