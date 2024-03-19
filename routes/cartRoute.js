const express = require('express');

const {
  addProductToCart,
  getLoggedUserCart,
  removeSpecificCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
} = require('../controller/cartConteroller');
const authService = require('../controller/authController');

const router = express.Router();

router.use(authService.protect, authService.allowedTo('user'));
router
  .route('/')
  .post(addProductToCart)
  .get(getLoggedUserCart)
  .delete(clearCart);

router.put('/applyCoupon', applyCoupon);

router
  .route('/:itemId')
  .put(updateCartItemQuantity)
  .delete(removeSpecificCartItem);

module.exports = router;