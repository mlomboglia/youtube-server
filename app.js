const port = process.env.PORT || 3000;

const yas = require('youtube-audio-server')
yas.setKey(process.env.YOUTUBE_API_KEY);

yas.listen(port, () => console.log(`server listening on port ${port}!`));