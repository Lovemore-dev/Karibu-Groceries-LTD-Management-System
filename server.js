// load environment variables from .env file
require('dotenv').config();
// import express
const express = require('express');
// import database connection
const connectDB = require('./config/db');
// initialize express

const app = express();

connectDB();
app.use(express.json());
const port = process.env.PORT;

app.use('/api/procurements', require('./routes/procurementRoute'));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`The server is running on port ${port}`);
});
