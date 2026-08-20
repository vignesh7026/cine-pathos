import dotenv from "dotenv";

import dns from "node:dns";
if (process.platform === "win32") {
  dns.setDefaultResultOrder("ipv4first");
}
dotenv.config({ path: ".env.local" });

async function testRawTmdb() {
  const key = process.env.TMDB_API_KEY;
  console.log("TMDB_API_KEY present:", Boolean(key), key ? key.substring(0, 8) + "..." : "");
  
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&sort_by=popularity.desc`;
  try {
    const res = await fetch(url);
    console.log("HTTP status:", res.status);
    const text = await res.text();
    console.log("Raw response snippet:", text.substring(0, 300));
  } catch (err: any) {
    console.error("Fetch failed completely:", err);
  }
}

testRawTmdb();
