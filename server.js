const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

dotenv.config({ path: 'config.env' });
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');
const { webhookCheckout } = require('./controller/orderController');
// Routes
const userRoute = require('./routes/userRoute');
const authRoute=require('./routes/authRoute')
const categoryRoute=require('./routes/categoryRoute')
const subCategoryRoute=require('./routes/subCategoryRoute')
const productsRoute=require('./routes/productsRoute')
const brandRoute=require('./routes/brandRoute')
const reviewRoute=require('./routes/reviewRoute')
const cartRoute=require('./routes/cartRoute')
const orderRoute=require('./routes/orderRoute')
const adressRoute=require('./routes/adressRoute')
const wishlistRoute = require('./routes/wishlistRoute');
const couponRoute = require('./routes/couponRoute');
const roomRoute = require('./routes/roomsRoute');
const auctionRoute = require('./routes/auctionRoute');


// Connect with db
 dbConnection();

// express app
const app = express();


//////////////////////////


// Enable other domains to access your application
app.use(cors());
app.options('*', cors());

// compress all responses
app.use(compression());

// Checkout webhook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);
// Middlewares
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Limit each IP to 100 requests per `window` (here, per 15 minutes)
//const limiter = rateLimit({
//  windowMs: 15 * 60 * 1000, // 15 minutes
//  max: 100,
//  message:
//    'Too many accounts created from this IP, please try again after an hour',
//});

// Apply the rate limiting middleware to all requests
//app.use('/api', limiter);

// Middleware to protect against HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: [
      'price',
      'sold',
      'quantity',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  })
);

// Mount Routes
app.use('/api/v1/auth',authRoute)
app.use('/api/v1/users', userRoute);
app.use('/api/v1/category',categoryRoute)
app.use('/api/v1/subcategory',subCategoryRoute)
app.use('/api/v1/products',productsRoute)
app.use('/api/v1/brands',brandRoute)
app.use('/api/v1/reviews',reviewRoute)
app.use('/api/v1/cart',cartRoute)
app.use('/api/v1/orders',orderRoute)
app.use('/api/v1/adress',adressRoute)
app.use('/api/v1/wishlist', wishlistRoute);
app.use('/api/v1/coupons', couponRoute);
app.use('/api/v1/rooms', roomRoute);
app.use('/api/v1/auctions', auctionRoute);





app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

////////////////////////////

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`);
});

// Handle rejection outside express
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
