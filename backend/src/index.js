// Imports / Dependencies
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Express App
const app = express();
app.use(cors());
app.use(express.json());

// Server Health Check
app.get("/health", (req, res) => {
    res.json({status: 'ok'})
})

// Server PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on PORT : ${PORT}`))
