const { Groq } = require("groq-sdk");
require("dotenv").config({ path: ".env.local" });

async function checkModels() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log("GROQ_API_KEY present:", Boolean(apiKey), apiKey ? apiKey.substring(0, 10) + "..." : "");
  const groq = new Groq({ apiKey });

  try {
    const models = await groq.models.list();
    console.log("Available models:");
    models.data.forEach((m) => console.log(" -", m.id));
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

checkModels();
