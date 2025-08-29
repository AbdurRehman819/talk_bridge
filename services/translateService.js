const axios = require("axios");

async function translateText(text, targetLang, sourceLang = "en") {
  // Ensure text is valid
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.warn("Skipping translation: empty or invalid text");
    return text; // Return original text instead of calling API
  }

  try {
    const res = await axios.post("http://localhost:5000/translate", {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log("Translation Response:", res.data);
    return res.data.translatedText;
  } catch (error) {
    console.error("Translation API Error:", error.response?.data || error.message);
    return text; // Return original text if API fails
  }
}

module.exports = { translateText };
