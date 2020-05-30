const AWS = require("aws-sdk");
// Set the Region
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();
const { PassThrough } = require("stream");

exports.uploadAudioStream = (videoId) => {
  const pass = new PassThrough();
  return {
    writeStream: pass,
    promise: s3
      .upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: videoId + ".mp3",
        Body: pass,
        ContentType: "audio/mp3",
      })
      .promise(),
  };
};

exports.getAudio = async (videoId) => {
  const s3params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: videoId + ".mp3",
  };

  const headCode = await s3.headObject(s3params).promise();
  return (signedUrl = s3.getSignedUrl("getObject", s3params));
};
