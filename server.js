const express = require('express');
const dotenv = require("dotenv").config()
const app = express();
const port = process.env.PORT;

app.use("/api/procurements",require("./routes/procurementRoute.js"))

app.listen(port,()=>{
    console.log(`The server is running on port ${port}`);
    
})
