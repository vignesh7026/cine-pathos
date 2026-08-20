import { searchMovies } from "../lib/tmdb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testSearch() {
  console.log("Testing searchMovies directly...");
  try {
    const res = await searchMovies({ keywords: ["funny", "upbeat"] });
    console.log("Direct search returned count:", res.length);
    if (res.length > 0) {
      console.log("First movie returned:", res[0].title);
    }
  } catch (err) {
    console.error("searchMovies error:", err);
  }
}

testSearch();
