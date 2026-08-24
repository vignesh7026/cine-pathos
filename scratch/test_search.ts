import { getMovieReviews } from "../lib/tmdb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
try { require("node:dns").setDefaultResultOrder("ipv4first"); } catch {}

async function testReviews() {
  console.log("Testing getMovieReviews...");
  const reviews = await getMovieReviews(337167, {
    title: "Fifty Shades of Grey",
    genres: [{ id: 10749, name: "Romance" }, { id: 18, name: "Drama" }],
    vote_average: 7.4,
  });
  console.log(`Retrieved ${reviews.length} reviews:`);
  reviews.forEach((r, i) => {
    console.log(`\nReview ${i + 1} by ${r.author} (★ ${r.rating}/10):`);
    console.log(` - Emotion Matched: ${r.emotionMatched ? "YES" : "NO"} (${r.matchScore}%)`);
    console.log(` - Genre Fit: ${r.genreFit}`);
    console.log(` - Content: ${r.content.substring(0, 100)}...`);
  });
}

testReviews();
