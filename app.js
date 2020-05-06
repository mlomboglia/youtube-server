const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

const yas = require('youtube-audio-server')
yas.setKey(process.env.YOUTUBE_API_KEY);

yas.get('HQmmM_qwG4k', (err, data) => {
    console.log('GOT METADATA for HQmmM_qwG4k:', data || err)
  })

//const bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.urlencoded());

//const urlShortener = require('node-url-shortener');

//app.get('/', function(req, res) {
//    res.sendFile(path.join(__dirname + '/index.html'));
//});

//app.post('/url', function(req, res) {
//    const url = req.body.url;
//
//    urlShortener.short(url, function(err, shortUrl){
//        res.send(shortUrl);
//    });
//});

yas.listen(port, () => console.log(`url-shortener listening on port ${port}!`));