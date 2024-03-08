const mongoose = require("mongoose");



const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const handlersFactory=require('./handlersFactoryController')
const productModel = require("../models/productModel");
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
// const shopModel = require("../models/shopSchema");
// const reviewModel = require("../models/reviews");
// const channelModel = require("../models/channelSchema");




exports.uploadProductImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // console.log(req.files);
  //1- Image processing for imageCover
  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    // Save image into our db
    req.body.imageCover = imageCoverFileName;
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        // Save image into our db
        req.body.images.push(imageName);
      })
    );

    next();
  }
});

exports.channelProducts = async function (req, res) {
  try {
    const channel = await channelModel.findOne({ _id: req.params.channel });
    const products = await productModel
      .find({
        $and: [
          { interest: { $in: channel.interests } },
          { deleted: { $ne: true } },
        ],
      })
      .populate("shopId", [
        "image",
        "open",
        "name",
        "paymentOptions",
        "shippingMethods",
      ])
      .populate("ownerId", [
        "userName",
        "stripeAccountId",
        "fw_subacoount",
        "fw_id",
      ])
      .populate({
        path: "shopId",
        populate: {
          path: "userId",
        },
      })
      .populate("interest")
      .populate("reviews");

    res.json(products);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.interestProducts = async function (req, res) {
  try {
	 
    const products = await productModel
      .find({
        $and: [
          { interest: { $in: req.params.interest } },
          { deleted: { $ne: true } },
        ],
      })
      .populate("shopId", [
        "image",
        "open",
        "name",
        "paymentOptions",
        "shippingMethods",
      ])
      .populate("ownerId", [
        "userName",
        "stripeAccountId",
        "fw_subacoount",
        "fw_id",
      ])
      .populate({
        path: "shopId",
        populate: {
          path: "userId",
        },
      })
      .populate("interest")
      .populate("reviews");

    res.json(products);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.relatedProducts = async function (req, res) {
  try {
    const products = await productModel
      .find({
        $and: [
          { categories: { $in: req.body.categories } },
          { deleted: { $ne: true } },
          { _id: { $ne: req.params.id } },
        ],
      })
      .populate("shopId", [
        "image",
        "open",
        "name",
        "paymentOptions",
        "shippingMethods",
      ])
      .populate("ownerId", [
        "userName",
        "stripeAccountId",
        "fw_subacoount",
        "fw_id",
      ])
      .populate({
        path: "shopId",
        populate: {
          path: "userId",
        },
      })
      .populate("interest")
      .populate("reviews");
    res.json(products);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.getProducts= handlersFactory.getAll(productModel,"product")



exports.productQtyCheck = async (req, res) => {
  let product = await productModel.findById(req.body.productId);
  if (product.quantity < req.body.quantity) {
    return res.send({ status: false, qty: product.quantity });
  }
  return res.send({ status: true, qty: product.quantity });
};
exports.deleteProductReviewsById = async (req, res) => {
  console.log(req.params.id);

  try {
    let deleted = await reviewModel.findOneAndRemove(req.params.id);
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: deleted });
  } catch (error) {
    console.log(error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};


exports.addProductToShop = async (req, res) => {
  const newProduct = {
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity,
    images: req.body.images,
    imageCover:req.body.imageCover,
    // shopId: mongoose.mongo.ObjectId(req.params.shopId),
    ownerId: req.user.id,
    description: req.body.description,
    variations: req.body.variations.split(","),
    category: req.body.category,
    subcategories:req.body.subcategories,
    brand:req.body.brand,
    interest: req.body.interest,
    discountedPrice: req.body.discountedPrice,
  };

  try {
    let newProd = await productModel.create(newProduct);
    // let product = await productModel
    //   .findById(newProd._id)
    //   .populate({
    //     path: "ownerId",
    //     populate: {
    //       path: "shopId",
    //     },
    //   })
      // .populate("reviews")
      // .populate("interest");

    // newProd.shopId = null;
    // newProd.ownerId = null;

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: newProd });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};



exports.getProductById = async (req, res) => {
	console.log("getProductById",req.params.productId)
  try {
    let product = await productModel
      .findById(req.params.productId)
      // .populate("shopId")
      // .populate("interest")
      // .populate("reviews")
      // .populate({
      //   path: "ownerId",
      //   populate: {
      //     path: "payoutmethod",
      //   },
      // });
    console.log(product)
    res.status(200).setHeader("Content-Type", "application/json").json(product);
  } catch (error) {
    res 
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.updateProductById = handlersFactory.updateOne(productModel)

exports.updateProductImages = async (req, res) => {
  let newObj = {
    images: req.body.images,
  };
  try {
    let newProduct = await productModel
      .findByIdAndUpdate(
        req.params.productId,
        { $set: newObj },
        { runValidators: true, new: true }
      )
      

    //     newProduct.shopId = null;
    //     newProduct.ownerId = null;

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: newProduct });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, message: error + " " });
  }
};

exports.deleteProductById = handlersFactory.deleteOne(productModel)
