// utils/convertAudio.js
const ffmpeg = require("fluent-ffmpeg");

function convertToWav(inputBuffer, outputPath, mimeType) {
  return new Promise((resolve, reject) => {
    // Create a stream from the input buffer
    const { Readable } = require("stream");
    const inputStream = new Readable();
    inputStream.push(inputBuffer);
    inputStream.push(null);

    ffmpeg(inputStream)
      .inputFormat(mimeType.split("/")[1]) // e.g. "mp3", "ogg", "opus"
      .audioCodec("pcm_s16le")             // ✅ 16-bit signed PCM
      .audioChannels(1)                    // ✅ mono
      .audioFrequency(16000)               // ✅ 16kHz
      .format("wav")
      .on("error", (err) => {
        reject(new Error("ffmpeg error: " + err.message));
      })
      .on("end", () => {
        resolve(outputPath);
      })
      .save(outputPath);
  });
}

module.exports = { convertToWav };
