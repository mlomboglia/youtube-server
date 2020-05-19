const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const youtubeRoutes = require('./routes/youtubeRoutes');

// Create express server
const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

// Set express static folder
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/', youtubeRoutes);

// Set server port
app.set('port', (process.env.PORT || 5000));

// Start the application!
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});