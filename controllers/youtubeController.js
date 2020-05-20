const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const FFmpeg = require("fluent-ffmpeg");
const request = require("request");

const axios = require("../api/youtube-axios");
const api = require("../api/youtube-api");

const AWS = require("aws-sdk");
// Set the Region
AWS.config.update({ region: "eu-west-1" });
const s3 = new AWS.S3();
const { PassThrough } = require("stream");

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
  const metadata = await searchForVideos(req.params.query, null, 10);
  if (metadata == null) {
    res.status(200).send({
      state: "error",
      message: "No results found",
    });
    return;
  }
  res.status(200).json(metadata);
};

exports.cacheVideo = async (req, res) => {
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

  const s3params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: videoId + ".mp3",
  };

  try {
    const headCode = await s3.headObject(s3params).promise();
    res.status(200).send({
      state: "success",
      message: "Audio found in cache",
    });
    return;
  } catch (headErr) {
    if (headErr.code === "NotFound") {
      //if not Download from Youtube, store in S3
      try {
        uploadYoutubeStream(s3params, videoId);
        res.status(200).send({
          state: "success",
          message: "Audio uploading to cache",
        });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).send({
          state: "error",
          message: e,
        });
      }
    }
  }
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

  const s3params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: videoId + ".mp3",
  };

  try {
    const headCode = await s3.headObject(s3params).promise();
    const signedUrl = s3.getSignedUrl('getObject', s3params);
    console.log("Video found in cache");
    res.status(200).send({
      state: "success",
      url: signedUrl,
    });
  } catch (headErr) {
    if (headErr.code === "NotFound") {
      console.log("Video not found in cache");
      getURLAndTitle(videoId, (url, title) => {
        res.status(200).send({
          state: "success",
          url: url,
        });
      })
      //getYoutubeStream(res, videoId);
    }
  }
  return;
};

/*
Auxiliary functions
*/


const getYoutubeURL = (res, videoId) => {
  try {
    const url = YOUTUBE_URL_PREFIX + videoId;
    const video = ytdl(url, audioOptions);
    const ffmpeg = new FFmpeg(video);

    process.nextTick(() => {
      const output = ffmpeg.format(audioOptions.audioFormat).pipe(res);
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
      //return output;
    });
  } catch (err) {
    throw err;
  }
};

async function getURLAndTitle(videoID, callback) {
  let info = await ytdl.getInfo(videoID, (err, info) => {
      if (err) {
          console.log(err)
          return callback('https://google.com','error getting info')
      }
      let title = info.title
      let format = ytdl.chooseFormat(info.formats, { quality: '140' });
      if (format) {
          let url = format.url;
          callback(url, title);
      }
  });
}

const uploadYoutubeStream = (s3params, videoId) => {
  try {
    const url = YOUTUBE_URL_PREFIX + videoId;
    const { writeStream, promise } = uploadStream(s3params);
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

const uploadStream = ({ Bucket, Key }) => {
  const pass = new PassThrough();
  return {
    writeStream: pass,
    promise: s3.upload({ Bucket, Key, Body: pass, ContentType: "audio/mp3" }).promise(),
  };
};

const searchForVideos = async (searchQuery, nextPageToken, amount) => {
  const config = api.buildSearchRequest(searchQuery, nextPageToken, amount);
  return axios
    .request(config)
    .then((response) => {
      const results = api.reduceSearchForVideos(response.data, searchQuery);
      return results;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};
