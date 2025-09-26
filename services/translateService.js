const axios = require("axios");

const key = process.env.AZURE_TRANSLATOR_KEY;
const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
const region = process.env.AZURE_TRANSLATOR_REGION;

async function translateText(text, toLang) {
  try {
    const response = await axios.post(
      `${endpoint}/translate?api-version=3.0&to=${toLang}`,
      [{ text }],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Ocp-Apim-Subscription-Region": region,
          "Content-type": "application/json",
        },
      }
    );

    return response.data[0].translations[0].text;
  } catch (err) {
    console.error("Translation API Error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { translateText };














// const axios = require("axios");

// async function translateText(text, targetLang, sourceLang) {
//   function normalizeLang(lang) {
//   const map = {
//     "en-US": "en",
//     "en-UK": "en",
//     "ur-IN": "ur",
//     "ar-SA": "ar",
//     "ar-AE": "ar"
//   };
//   return map[lang.toLowerCase()] || lang.split("-")[0]; 
// }

// // Example:
// sourceLang = normalizeLang(sourceLang);
// targetLang = normalizeLang(targetLang);

//   // Ensure text is valid
//   if (!text || typeof text !== "string" || text.trim().length === 0) {
//     console.warn("Skipping translation: empty or invalid text");
//     return text; // Return original text instead of calling API
//   }

//   try {
//     const res = await axios.post("http://localhost:5000/translate", {
//       q: text,
//       source: sourceLang || 'auto',
//       target: targetLang,
//       format: "text",
//     }, {
//       headers: { 'Content-Type': 'application/json' }
//     });

//     console.log("Translation Response:", res.data);
//     return res.data.translatedText;
//   } catch (error) {
//     console.error("Translation API Error:", error.response?.data || error.message);
//     return text; // Return original text if API fails
//   }
// }

// module.exports = { translateText };
