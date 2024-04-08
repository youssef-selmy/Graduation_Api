const factory = require('./handlersFactoryController');
const Coupon = require('../models/couponModel');

//   Get list of coupons
//  GET /api/v1/coupons
//  Private/Admin-Manager
exports.getCoupons = factory.getAll(Coupon);

//   Get specific coupon by id
//   GET /api/v1/coupons/:id
//  Private/Admin-Manager
exports.getCoupon = factory.getOne(Coupon);

//   Create coupon
//   POST  /api/v1/coupons
//   Private/Admin-Manager
exports.createCoupon = factory.createOne(Coupon);

//   Update specific coupon
//   PUT /api/v1/coupons/:id
//   Private/Admin-Manager
exports.updateCoupon = factory.updateOne(Coupon);

//    Delete specific coupon
//  DELETE /api/v1/coupons/:id
//  Private/Admin-Manager
exports.deleteCoupon = factory.deleteOne(Coupon);
