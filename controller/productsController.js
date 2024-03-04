const mongoose = require("mongoose");
const productModel = require("../models/productModel");
// const shopModel = require("../models/shopSchema");
// const reviewModel = require("../models/reviews");
// const channelModel = require("../models/channelSchema");

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

exports.getProducts= async (req, res) => {
	
  try {
    const { title, interest, price, page, limit, userid, featured, channel,shopId } = req.query;

    const queryObject = {};

    let sortPrice;

    if (title) {
      queryObject.$or = [{ name: { $regex: `${title}`, $options: "i" } }];
    }

    if (userid) {
      queryObject.$or = [{ ownerId: { $eq: userid } }];
    }
    if (shopId) {
      queryObject.$or = [{ shopId: { $eq: shopId } }];
    }
    if (interest) {
      queryObject.$and = [{ interest: { $in: [interest] } }];
    }
    if (channel) {
	  const channeldata = await channelModel.findOne({ _id: channel })
      queryObject.$and = [{ interest: { $in: channeldata.interests } }];
    }

    if (price === "Low") {
      sortPrice = 1; 
    } else if (price === "High") { 
      sortPrice = -1;
    }

    if (featured == "true") {
      queryObject.feature = { $eq: true };
    }
    queryObject.deleted = { $ne: true };
    const pages = Number(page);
    const limits = Number(limit);
    const skip = (pages - 1) * limits;

    console.log(queryObject);
    try {
      const totalDoc = await productModel.countDocuments(queryObject);
      const products = await productModel
        .find(queryObject)
        .sort(price ? { price: sortPrice } : { _id: -1 })
        .skip(skip)
        .populate("shopId", [
          "image",
          "open",
          "paymentOptions",
          "shippingMethods",
          "name",
        ])
        .populate("ownerId", [
          "userName"
        ])
        .populate("interest")
        .populate("reviews")
        .limit(limits);

      res.send({
        products,
        totalDoc,
        limits,
        pages,
      });
    } catch (err) {
      res.status(500).send({
        message: err.message,
      });
    }
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};






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
exports.getProductReviewsByUserId = async (req, res) => {
  try {
    let reviewresponse = await reviewModel
      .find({ userId: req.params.userId, product: req.params.id })
      .populate({
        path: "product",
      })
      .populate({
        path: "userId",
      })
      .populate("reviews");
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: reviewresponse });
  } catch (error) {
    console.log(error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.getProductReviews = async (req, res) => {
  try {
    let reviewresponse = await reviewModel
      .find({ product: req.params.id })
      .populate({
        path: "product",
      })
      .populate({
        path: "userId",
      })
      .populate("reviews");
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: reviewresponse });
  } catch (error) {
    console.log(error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.addProductReview = async (req, res) => {
  console.log("addProductReview");
  const review = {
    product: req.params.id,
    userId: req.body.userId,
    review: req.body.review,
    rating: req.body.rating,
  };

  try {
    let reviewresponse = await reviewModel.find({
      userId: req.body.userId,
      product: req.params.id,
    });
    if (reviewresponse.length > 0) {
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({
          success: false,
          message: "You have already left a review for this product",
        });
    } else {
      let response = await reviewModel.create(review);
      let data = await reviewModel
        .findById(response._id)
        .populate("reviews")
        .populate({
          path: "userId",
        });
      await productModel.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { reviews: response._id },
        },
        { runValidators: true, new: true, upsert: false }
      );
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: true, data });
    }
  } catch (error) {
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
    shopId: mongoose.mongo.ObjectId(req.params.shopId),
    ownerId: req.body.ownerId,
    description: req.body.description,
    variations: req.body.variations.split(","),
    categories: req.body.categories,
    interest: req.body.interest,
    discountedPrice: req.body.discountedPrice,
  };

  try {
    let newProd = await productModel.create(newProduct);
    let product = await productModel
      .findById(newProd._id)
      .populate({
        path: "ownerId",
        populate: {
          path: "shopId",
        },
      })
      .populate("reviews")
      .populate("interest");

    newProd.shopId = null;
    newProd.ownerId = null;

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: product });
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
      .populate("shopId")
      .populate("interest")
      .populate("reviews")
      .populate({
        path: "ownerId",
        populate: {
          path: "payoutmethod",
        },
      });
    console.log(product)
    res.status(200).setHeader("Content-Type", "application/json").json(product);
  } catch (error) {
    res 
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.updateProductById = async (req, res) => {
  if (req.body.variations) {
    req.body.variations = req.body.variations.split(",");
  }

  let newObj = req.body;
  try {
    let newProduct = await productModel
      .findByIdAndUpdate(mongoose.Types.ObjectId(req.params.productId), {
        $set: newObj,
      })
      .populate("shopId", [
        "name",
        "email",
        "location", 
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId",
        "paymentOptions",
        "shippingMethods",
      ])
      .populate("interest")
      .populate("reviews")
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "stripeAccountId",
      ]);

    if (req.body.deleted == true && newProduct.type == "WC") {
      let updatedShop = await shopModel.findByIdAndUpdate(
        newProduct.shopId._id,
        {
          $pullAll: { wcIDs: [newProduct.wcid] },
        },
        { new: true, runValidators: true }
      );
    }

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: newProduct });
  } catch (error) {
    console.log(error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

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
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId",
        "paymentOptions",
        "shippingMethods",
      ])
      .populate("interest")
      .populate("reviews")
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "stripeAccountId",
        "fw_subacoount",
        "fw_id",
      ]);

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

exports.deleteProductById = async (req, res) => {
	console.log(req.params.productId);
  try {
    let deleted = await productModel.findOneAndRemove({
      _id: mongoose.mongo.ObjectId(req.params.productId),
    });
    res.status(200).setHeader("Content-Type", "application/json").json(deleted);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
