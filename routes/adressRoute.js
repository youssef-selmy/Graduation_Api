const express = require('express');

const authService = require('../controller/authController');

const {
  addAddress,
  removeAddress,
  getLoggedUserAddresses,
  updateAddress,
  getAddressById
} = require('../controller/adressController');

const router = express.Router();

router.use(authService.protect, authService.allowedTo('user'));

router.route('/').post(addAddress).get(getLoggedUserAddresses);

router.delete('/:addressId', removeAddress);
router.put('/:addressId',updateAddress);
router.get('/:addressId',getAddressById);

module.exports = router;