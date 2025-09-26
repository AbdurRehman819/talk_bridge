const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");
const path = require("path");
const { convertToWav } = require("../utils/convertAudio");

async function transcribeAudio(fileBuffer, mimeType, language = "en-US") {
  try {
    const wavPath = path.join(__dirname, "../uploads", "converted.wav");

    // Convert input buffer → WAV file
    await convertToWav(fileBuffer, wavPath, mimeType);

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    speechConfig.speechRecognitionLanguage = language;

    // ✅ FIX: Create a stream instead of passing path
    const pushStream = sdk.AudioInputStream.createPushStream();
    const fileStream = fs.createReadStream(wavPath);
    fileStream.on("data", (chunk) => pushStream.write(chunk));
    fileStream.on("end", () => pushStream.close());

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync((result) => {
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve(result.text);
        } else {
          reject(new Error("Speech recognition failed: " + result.reason));
        }
        recognizer.close();
      });
    });
  } catch (error) {
    throw new Error("Audio processing error: " + error.message);
  }
}

module.exports = { transcribeAudio };
