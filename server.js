// load environment variables from .env file
require('dotenv').config();
// import express
const express = require('express');
// import swagger tools
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
// import database connection
const connectDB = require('./config/db');

// initialize express
const app = express();
// initialize database connection

connectDB();

// middleware to parse JSON bodies
app.use(express.json());

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
  servers: [{ url: `http://localhost:${port}`, description: 'Development server' }],
};

// Options for swaager jsdocs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API routes for documentation
};

// create swagger specification
const swaggerSpec = swaggerJsDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`The server is running on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`API documentation available at http://localhost:${port}/api-docs`);
});
