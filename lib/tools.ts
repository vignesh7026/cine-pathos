import { searchMovies, getTrailer, getStreamingAvailability } from "@/lib/tmdb";
import type {
  AskClarifyingArgs,
  CheckStreamingArgs,
  GetTrailerArgs,
  SearchMoviesArgs,
  ToolName,
} from "@/types/movie";

/**
 * Tool schemas passed to Gemini's function-calling config. Keep descriptions
 * written for the model: explicit about when to use each tool and what
 * "empty result" should make it do next.
 */
export const TOOL_DEFINITIONS = [
  {
    name: "search_movies",
    description:
      "Search for movies matching inferred genres, keywords, and a minimum rating. Call this first once you've interpreted the user's mood. If results come back empty, retry once with broader or different genres/keywords before asking the user anything.",
    parameters: {
      type: "object",
      properties: {
        genres: {
          type: "array",
          items: { type: "string" },
          description:
            "Genre names such as comedy, drama, sci-fi, horror, romance.",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description:
            "Free-text mood/theme keywords, e.g. 'feel-good', 'slow burn', 'underdog'.",
        },
        min_rating: {
          type: "number",
          description: "Minimum TMDB vote average, 0-10. Optional.",
        },
        language: {
          type: "string",
          description: "Target language/regional film language (e.g. 'tamil', 'hindi', 'malayalam', 'telugu'). Optional.",
        },
      },
    },
  },
  {
    name: "check_streaming_availability",
    description:
      "Look up where a specific movie can be streamed, rented, or bought in a given region. Only call this for a movie you already found via search_movies.",
    parameters: {
      type: "object",
      properties: {
        movie_id: { type: "number" },
        region: {
          type: "string",
          description: "ISO 3166-1 region code, e.g. US, IN, GB. Default US.",
        },
      },
      required: ["movie_id"],
    },
  },
  {
    name: "get_trailer",
    description:
      "Get the YouTube trailer key for a specific movie you already found via search_movies.",
    parameters: {
      type: "object",
      properties: {
        movie_id: { type: "number" },
      },
      required: ["movie_id"],
    },
  },
  {
    name: "ask_clarifying_question",
    description:
      "Use only when the user's mood is too ambiguous to search on confidently (e.g. 'something good'). Pauses the loop and surfaces a single question back to the user instead of guessing.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      required: ["question"],
    },
  },
] as const;

export interface ToolResult {
  toolName: ToolName;
  output: unknown;
}

/**
 * Executes a single tool call by name. Thrown errors are caught by the
 * agent loop and fed back to the model as a tool error so it can retry
 * with different arguments rather than crashing the whole request.
 */
export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "search_movies": {
      const a = args as SearchMoviesArgs;
      const movies = await searchMovies({
        genres: a.genres,
        keywords: a.keywords,
        minRating: a.min_rating,
        language: a.language,
      });
      return { toolName: name, output: { movies } };
    }

    case "check_streaming_availability": {
      const a = args as unknown as CheckStreamingArgs;
      const availability = await getStreamingAvailability(
        a.movie_id,
        a.region ?? "US"
      );
      return { toolName: name, output: availability };
    }

    case "get_trailer": {
      const a = args as unknown as GetTrailerArgs;
      const trailer = await getTrailer(a.movie_id);
      return { toolName: name, output: { trailer } };
    }

    case "ask_clarifying_question": {
      const a = args as unknown as AskClarifyingArgs;
      return { toolName: name, output: { question: a.question } };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
