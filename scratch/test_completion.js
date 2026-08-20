const { Groq } = require("groq-sdk");
require("dotenv").config({ path: ".env.local" });

async function testCompletion() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const res = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "You are a movie recommendation assistant." },
        { role: "user", content: "I want a funny movie" }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "search_movies",
            description: "Search movies by genre or keyword",
            parameters: {
              type: "object",
              properties: {
                genres: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      ],
      tool_choice: "auto"
    });
    console.log("Success! Choices:", JSON.stringify(res.choices, null, 2));
  } catch (err) {
    console.error("Completion error:", err);
  }
}

testCompletion();
