const mongoose = require("mongoose");

const { Schema, model } = mongoose;
// const decode = require("../shared/base64");

const value = {
  type: String,
  required: [true, "This field is required"],
};

const productSchema = new Schema(
  {
    name: value,
    // wcid: { type: Number },
    // spId: { type: Number },
    price: {
      type: Number,
      required: "Price field is required",
    },
    discountedPrice: {
      type: Number,
      default: 0.0,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    //  reviews: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Review",
    //   },
    //  ],
    deleted: {
      type: Boolean,
      default: false,
    },

    available: {
      type: Boolean,
      default: true,
    },
    feature: {
      type: Boolean,
      default: false,
    },
    imageCover: {
      type: String,
      required: [true, 'Product Image cover is required'],
    },
    images: [String],
    colors: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Product must be belong to category'],
    },
    subcategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory',
      },
    ],
    // interest: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "interest",
    //   },
    // ],
    description: {
      type: String,
    },
    // shopId: {
    //   type: mongoose.Types.ObjectId,
    //   required: true,
    //   ref: "shop",
    // },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
   
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: 'Brand',
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above or equal 1.0'],
      max: [5, 'Rating must be below or equal 5.0'],
      // set: (val) => Math.round(val * 10) / 10, // 3.3333 * 10 => 33.333 => 33 => 3.3
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: "tokshop",
    },
    
  },

  
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }}
);

 productSchema.virtual('reviews', {
   ref: 'Review',
   foreignField: 'product',
  localField: '_id',
 });

// Mongoose query middleware
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name -_id',
  });
  next();
});

const setImageURL = (doc) => {
  if (doc.imageCover) {
    const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
    doc.imageCover = imageUrl;
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      const imageUrl = `${process.env.BASE_URL}/products/${image}`;
      imagesList.push(imageUrl);
    });
    doc.images = imagesList;
  }
};
// findOne, findAll and update
// productSchema.post('init', (doc) => {
//   setImageURL(doc);
// });

// create
// productSchema.post('save', (doc) => {
//   setImageURL(doc);
// });


const products = model("product", productSchema);

module.exports = products;
