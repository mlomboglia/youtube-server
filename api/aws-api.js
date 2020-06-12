const AWS = require("aws-sdk");
// Set the Region
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();
const { PassThrough } = require("stream");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

exports.uploadAudioInfo = (videoId, info) => {
  const params = {
    TableName: process.env.AWS_TABLENAME,
    Item: {
      videoId: videoId,
      title: info.title,
      length: info.length_seconds,
      media: info.media
    },
  };

  dynamoDb.put(params, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data);
  });
};

exports.getAudio = async (videoId) => {
  console.log("GetAudio");
  const s3params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: videoId + ".mp3",
  };
  
  const headCode = await s3.headObject(s3params).promise();
  const urlParams = {
    ...s3params,
    Expires: 86400
  };

  return (signedUrl = s3.getSignedUrl("getObject", urlParams));
};
