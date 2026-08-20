const { runAgentLoop } = require("./lib/agentLoop");
require("dotenv").config({ path: ".env.local" });

async function testRun() {
  console.log("Testing runAgentLoop...");
  try {
    const res = await runAgentLoop("I want a funny upbeat movie");
    console.log("Result type:", res.type);
    console.log("Agent note:", res.agentNote);
    console.log("Movies count:", res.movies ? res.movies.length : 0);
    if (res.movies && res.movies.length > 0) {
      console.log("First movie:", res.movies[0].title);
    }
  } catch (err) {
    console.error("Error in runAgentLoop:", err);
  }
}

testRun();
