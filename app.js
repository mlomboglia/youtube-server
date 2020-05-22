const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const youtubeRoutes = require("./routes/youtubeRoutes");

// Create express server
const app = express();

const accessLogSystem = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", {stream:accessLogSystem}));

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/", youtubeRoutes);

// Set server port
app.set("port", process.env.PORT || 5000);

// Start the application!
app.listen(app.get("port"), function () {
  console.log("Node app is running on port", app.get("port"));
});
