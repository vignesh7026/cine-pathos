import Groq from "groq-sdk";
import type { ChatCompletionTool } from "groq-sdk/resources/chat/completions";
import { TOOL_DEFINITIONS } from "@/lib/tools";

export function getGroqClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set. Check your .env.local file.");
  }
  return new Groq({ apiKey: key });
}

// TOOL_DEFINITIONS is plain JSON schema — { name, description, parameters }[]
// (see lib/tools.ts). Groq's API is OpenAI-compatible, which expects each
// tool wrapped in a { type: "function", function: {...} } envelope, so we
// reshape it here rather than changing the shared tools.ts format that
// other parts of the app may also rely on.
export const groqTools: ChatCompletionTool[] = TOOL_DEFINITIONS.map((def) => ({
  type: "function",
  function: {
    name: def.name,
    description: def.description,
    parameters: def.parameters,
  },
}));

export const SYSTEM_INSTRUCTION = `You are the recommendation agent for MoodMovies.
A user describes their mood in free text. Your job is to translate that mood
into movie search parameters and return a short, well-reasoned set of
recommendations.

CRITICAL: You have no reliable knowledge of current movies, ratings, or
availability. You must NEVER name specific movie titles from your own
training knowledge. The only movies you are allowed to mention are ones
returned by the search_movies tool. Your first action, every time, must be
to call search_movies — do not respond with plain text before calling it.

Rules:
- Always call search_movies first. Only call ask_clarifying_question instead
  if the mood genuinely gives you nothing to search on (e.g. "something
  good", "idk").
- If search_movies returns an empty list, retry once with broader or
  different genres/keywords before giving up.
- Do not call check_streaming_availability or get_trailer for every result —
  those are lazy-loaded by the UI on demand, not part of the initial search.
- Once you have search results, your final reply must be plain text only
  (one or two sentences on why these results fit the mood) — do not restate
  or list the movie titles yourself, the UI already displays them as cards.`;

// openai/gpt-oss-120b has noticeably more reliable structured tool-calling
// on Groq than llama-3.3-70b-versatile, which occasionally emits malformed
// pseudo-XML function-call text (<function=name(...)>) that Groq's server
// rejects with a 400 tool_use_failed error instead of returning it as a
// normal response. If you hit that error again even on gpt-oss-120b, see
// the retry wrapper in agentLoop.ts.
export const GROQ_MODEL = "openai/gpt-oss-120b";