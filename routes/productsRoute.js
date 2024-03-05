const express = require("express");

const productRouter = express.Router();
const multer = require("multer");
const productController = require("../controller/productsController");
const {protect} = require("../controller/authController");
// const subscriptionController = require('../controllers/subscription')


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
};



productRouter
  .route("/:shopId")
  .post( productController.addProductToShop);

productRouter
  .route("/products/:productId")
  .get(protect,productController.getProductById)
  .put(
    protect,
    productController.updateProductById
  )
  .delete(
    protect,
    productController.deleteProductById
  );

productRouter
  .route("/images/:productId")
  .put(
    protect,
    productController.updateProductImages
  );



productRouter
  .route("/product/product/qtycheck/:productId")
  .post(productController.productQtyCheck);

productRouter
  .route("/paginated/allproducts")
  .get(
    productController.getProducts
  );

productRouter
  .route("/related/products/:id")
  .get(productController.relatedProducts);

productRouter
  .route("/interest/interest/products/:interest")
  .get(productController.interestProducts);

productRouter
  .route("/channel/products/:channel")
  .get(productController.channelProducts);
productRouter
  .route("/related/products/:id")
  .get(productController.relatedProducts);

productRouter.route("/review/:id").post(productController.addProductReview);
productRouter.route("/review/:id").get(productController.getProductReviews);
productRouter
  .route("/review/:userId/:id")
  .get(productController.getProductReviewsByUserId);
productRouter
  .route("/review/delete/review/:id")
  .delete(productController.deleteProductReviewsById);
// productRouter.get("/is-subscription-valid", authController.protect, subscriptionController.isSubscriptionValid);

module.exports = productRouter;
