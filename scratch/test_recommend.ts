import { runAgentLoop } from "../lib/agentLoop";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testRun() {
  console.log("Testing runAgentLoop...");
  try {
    const res = await runAgentLoop("I want a funny upbeat movie");
    if (res.type === "results") {
      console.log("Result type:", res.type);
      console.log("Agent note:", res.agentNote);
      console.log("Movies count:", res.movies ? res.movies.length : 0);
      if (res.movies && res.movies.length > 0) {
        console.log("First movie:", res.movies[0].title);
      }
    } else {
      console.log("Clarifying question:", res.question);
    }
  } catch (err) {
    console.error("Error in runAgentLoop:", err);
  }
}

testRun();
