// load environment variables from .env file
require('dotenv').config();

// import express
const express = require('express');
// import cors for cross-origin requests
const cors = require('cors');
// import swagger tools
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
// import database connection
const connectDB = require('./config/db');

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
  process.exit(1); // Stop the server immediately
}

// initialize express
const app = express();
// initialize database connection

connectDB();

// Global Middleware
// middleware to parse JSON bodies
app.use(express.json());
// middleware to enable CORS
app.use(cors());
// Helps with EJS form submissions
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 5000;
// Router 1: Procurement (/api/procurements)
app.use('/api/procurements', require('./routes/procurementRoute'));

// Router 2: Sales (/api/sales)
// For cash and credit transactions
app.use('/api/sales', require('./routes/saleRoute'));

// Router 3: Users & Authentication (/api/user)
app.use('/api/user', require('./routes/userRoute'));

// API Documentation using Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Karibu Groceries LTD API',
    version: '1.0.0',
    description: 'API documentation for Karibu Groceries LTD',
  },
  servers: [
    { url: `process.env.BASE_URL || http://localhost:${port}`, description: 'Development server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  // Applying security
  security: [{ bearerAuth: [] }],
};

// Options for swaager jsdocs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API routes for documentation
};

// create swagger specification
const swaggerSpec = swaggerJsDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 catch-all route (for api testing with postman or frontend)
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found on this server` });
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);

  const numericStatus = err.statusCode || 500;
  res.status(numericStatus).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`The server is running on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`API documentation available at http://localhost:${port}/api-docs`);
});
