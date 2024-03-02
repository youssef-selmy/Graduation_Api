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
// Routes
const authRoute = require('./routes/authRoute');
const categoryRoute = require('./routes/categoryRoute');
const subCategoryRoute = require('./routes/subCategoryRoute');

// Connect with db
dbConnection((err) => {
  if (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if unable to connect to MongoDB
  } else {
    // Express app
    const app = express();

    // Enable other domains to access your application
    app.use(cors());
    app.options('*', cors());

    // compress all responses
    app.use(compression());

    // Middlewares
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'uploads')));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
      console.log(`mode: ${process.env.NODE_ENV}`);
    }

    // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message:
        'Too many accounts created from this IP, please try again after an hour',
    });

    // Apply the rate limiting middleware to all requests
    app.use('/api', limiter);

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
    app.use('/api/v1/auth', authRoute);
    app.use('/api/v1/categories', categoryRoute);
    app.use('/api/v1/subcategories', subCategoryRoute);

    app.all('*', (req, res, next) => {
      next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
    });

    // Global error handling middleware for express
    app.use(globalError);

    const PORT = process.env.PORT || 8000;
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
  }
});
