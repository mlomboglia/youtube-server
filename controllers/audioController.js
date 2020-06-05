const ytdl = require("ytdl-core");
const FFmpeg = require("fluent-ffmpeg");

const axios = require("../api/youtube-axios");
const youtubeAPI = require("../api/youtube-api");
const awsAPI = require("../api/aws-api");

const YOUTUBE_URL_PREFIX = "https://www.youtube.com/watch?v=";

const audioOptions = {
  videoFormat: "mp4",
  quality: "lowest",
  audioFormat: "mp3",
  filter(format) {
    return format.container === audioOptions.videoFormat && format.audioBitrate;
  },
};

exports.searchVideos = async (req, res, next) => {
  const metadata = await searchForVideos(
    req.params.query,
    req.params.nextPageToken,
    10
  );
  if (metadata == null) {
    res.status(200).send({
      state: "error",
      message: "No results found",
    });
    return;
  }
  res.status(200).json(metadata);
};

exports.playVideo = async (req, res) => {
  console.log("playVideo");
  const videoId = req.params.videoId;
  if (videoId == null) {
    console.log("No video Id found");
    res.status(200).send({
      state: "error",
      message: "No video Id found",
    });
    return;
  }
  console.log(videoId);

  try {
    //Look in cache
    const signedUrl = await awsAPI.getAudio(videoId);
    console.log("Video found in cache");
    res.status(200).send({
      state: "success",
      url: signedUrl,
    });
  } catch (headErr) {
    if (headErr.code === "NotFound") {
      console.log("Video not found in cache");
      const videoInfo = await uploadAudio(videoId);
      res.status(200).send({
        state: "success",
        url: videoInfo.url,
        title: videoInfo.info.title,
      });
    }
  }
  return;
};

exports.listPlaylistItems = async (req, res) => {
  console.log("listPlaylistItems");
  const playlistId = req.params.playlistId;
  if (playlistId == null) {
    console.log("No playlistId found");
    res.status(200).send({
      state: "error",
      message: "No playlistId found",
    });
    return;
  }
  console.log(playlistId);

  //List audio from playlist
  const metadata = await getPlaylist(playlistId);
  res.status(200).json(metadata);
};

/*
Auxiliary functions
*/

const uploadAudio = async (videoId) => {
  uploadYoutubeStream(videoId);
  const videoInfo = await getVideoInfo(videoId);
  awsAPI.uploadAudioInfo(videoInfo.videoId, videoInfo.info);
  return videoInfo;
};

const getVideoInfo = async (videoId) => {
  return (info = await ytdl.getInfo(videoId, (err, info) => {
    if (err) {
      console.log(err);
      return callback("https://google.com", "error getting info");
    }
    //console.log(info);
    //let title = info.title;
    let format = ytdl.chooseFormat(info.formats, { quality: "140" });
    if (format) {
      return {
        videoId: videoId,
        url: format.url,
        info: info,
      };
    }
  }));
};

const uploadYoutubeStream = (videoId) => {
  try {
    const url = YOUTUBE_URL_PREFIX + videoId;
    const { writeStream, promise } = awsAPI.uploadAudioStream(videoId);
    const video = ytdl(url, audioOptions);
    const ffmpeg = new FFmpeg(video);

    process.nextTick(() => {
      const output = ffmpeg.format(audioOptions.audioFormat).pipe(writeStream);
      ffmpeg.on("error", (error) => console.log(error));
      ffmpeg.on("progress", (prog) => console.log(prog));
      ffmpeg.on("end", (end) => {
        console.log("Transcoding succeeded !");
        ffmpeg.kill();
      });
      output.on("error", (error) => {
        video.end();
        console.log(error);
      });
      return output;
    });
  } catch (err) {
    throw err;
  }
};

const searchForVideos = async (searchQuery, nextPageToken, amount) => {
  const config = youtubeAPI.buildSearchRequest(
    searchQuery,
    nextPageToken,
    amount
  );
  return axios
    .request(config)
    .then((response) => {
      const results = youtubeAPI.reduceSearchForVideos(
        response.data,
        searchQuery
      );
      return results;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};

const getPlaylist = async (playlistId, nextPageToken, amount) => {
  const config = youtubeAPI.buildListPlaylistItemsRequest(
    playlistId,
    nextPageToken,
    amount
  );
  return axios
    .request(config)
    .then((response) => {
      return youtubeAPI.reducePlaylist(response.data, playlistId);
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};
