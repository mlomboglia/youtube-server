const express = require('express');
const youtubeController = require('../controllers/youtubeController');
const router = express.Router();

router.get('/search/:query', youtubeController.searchVideos);

router.get('/play/:videoId', youtubeController.playVideo);

router.get('/', (req, res) => {
    res.status(200).send({ message: 'OK'});
});

//router.get('/cache/:videoId', youtubeController.cacheVideo);

module.exports = router;