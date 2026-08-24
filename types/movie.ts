export interface MovieReview {
  id: string;
  author: string;
  content: string;
  rating?: number;
  createdAt?: string;
  avatarPath?: string;
  emotionMatched?: boolean;
  genreFit?: string;
  matchScore?: number;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount?: number;
  genreIds: number[];
  originalLanguage: string;
  runtime?: number;
  genres?: string[];
  matchPercentage?: number;
  reviews?: MovieReview[];
}

export interface StreamingProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
}

export interface StreamingAvailability {
  region: string;
  flatrate: StreamingProvider[];
  rent: StreamingProvider[];
  buy: StreamingProvider[];
  link?: string;
}

export interface Trailer {
  key: string;
  name: string;
  site: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export type RecommendResponse =
  | {
      type: "clarifying_question";
      question: string;
    }
  | {
      type: "results";
      movies: Movie[];
      agentNote: string;
    };

export type ToolName =
  | "search_movies"
  | "check_streaming_availability"
  | "get_trailer"
  | "ask_clarifying_question";

export interface SearchMoviesArgs {
  genres?: string[];
  keywords?: string[];
  min_rating?: number;
  language?: string;
}

export interface CheckStreamingArgs {
  movie_id: number;
  region?: string;
}

export interface GetTrailerArgs {
  movie_id: number;
}

export interface AskClarifyingArgs {
  question: string;
}