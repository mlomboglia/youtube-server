const express = require('express');
const audioController = require('../controllers/audioController');
const router = express.Router();

router.get('/search/:query/:nextPageToken?', audioController.searchVideos);

router.get('/play/:videoId', audioController.playVideo);

router.get('/', (req, res) => {
    res.status(200).send({ message: 'OK'});
});

module.exports = router;