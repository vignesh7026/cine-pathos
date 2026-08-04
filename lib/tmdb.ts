import type {
  Movie,
  StreamingAvailability,
  StreamingProvider,
  Trailer,
} from "@/types/movie";

// Windows + Node's undici (built-in fetch) will often resolve api.themoviedb.org
// to an IPv6 address first. If your network path drops IPv6 mid-connection
// (common on home routers/ISPs/VPNs), you get exactly the symptom seen here:
// TLS reads getting ECONNRESET. Forcing IPv4-first resolution avoids that
// entirely. This is a no-op on platforms where it isn't needed.
if (typeof process !== "undefined" && process.platform === "win32") {
  try {
    // Dynamic require so this file still works fine in edge/non-node runtimes.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dns = require("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // If dns isn't available in this runtime, just skip — not fatal.
  }
}

const TMDB_BASE = "https://api.themoviedb.org/3";

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY is not set. Check your .env.local file.");
  }
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * TMDB connections occasionally drop mid-request (ECONNRESET) — transient
 * network flakiness, not a bad request. Since every TMDB call in this file
 * (search, trailer, providers) goes through this one function, wrapping it
 * here with a short timeout + retry-with-backoff fixes the recurring 500s
 * on /api/movie/[id]/trailer and /providers without touching those routes
 * or every individual caller.
 */
const MAX_RETRIES = 2;

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  attempt = 0
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: controller.signal,
      // Avoid reusing a pooled keep-alive socket that may have gone stale —
      // a secondary defense against ECONNRESET on flaky connections.
      keepalive: false,
    });
    if (!res.ok) {
      throw new Error(`TMDB request failed (${res.status}): ${path}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    const isRetryable =
      err instanceof Error &&
      (err.name === "AbortError" ||
        err.message.includes("fetch failed") ||
        err.message.includes("terminated") ||
        ("cause" in err &&
          typeof err.cause === "object" &&
          err.cause !== null &&
          "code" in err.cause &&
          (err.cause as { code?: string }).code === "ECONNRESET"));

    if (isRetryable && attempt < MAX_RETRIES) {
      // Exponential backoff with jitter: ~300ms, ~700ms, ...
      const delay = 300 * Math.pow(2, attempt) + Math.random() * 150;
      console.warn(
        `[tmdb] transient failure on ${path}, retrying in ${Math.round(
          delay
        )}ms (attempt ${attempt + 1}/${MAX_RETRIES})…`,
        err
      );
      await sleep(delay);
      return tmdbFetch<T>(path, params, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// A small static map so the agent can pass human genre names ("comedy",
// "sci-fi") instead of memorizing TMDB's numeric genre ids.
export const GENRE_NAME_TO_ID: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "sci-fi": 878,
  scifi: 878,
  "science fiction": 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

function resolveGenreIds(genres: string[] = []): number[] {
  return genres
    .map((g) => GENRE_NAME_TO_ID[g.trim().toLowerCase()])
    .filter((id): id is number => Boolean(id));
}

interface TmdbMovieResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
}

function mapMovie(raw: TmdbMovieResult): Movie {
  return {
    id: raw.id,
    title: raw.title,
    overview: raw.overview,
    posterPath: raw.poster_path,
    releaseDate: raw.release_date,
    voteAverage: raw.vote_average,
    genreIds: raw.genre_ids,
    originalLanguage: raw.original_language,
  };
}

function buildDiscoverParams(
  genreIds: number[],
  minRating: number | undefined,
  includeRating: boolean,
  language?: string
): Record<string, string> {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": "50",
  };
  if (genreIds.length > 0) {
    params.with_genres = genreIds.join(",");
  }
  if (includeRating && minRating) {
    params["vote_average.gte"] = String(minRating);
  }
  if (language) {
    // TMDB's with_original_language filters by the movie's original
    // production language (ISO 639-1), e.g. "hi", "ta", "te", "kn", "ml".
    // Lower vote_count floor for regional-language searches below, since
    // regional titles get far fewer TMDB votes than Hollywood releases —
    // "vote_count.gte": "50" would wipe out most Tamil/Telugu/Kannada
    // results otherwise.
    params.with_original_language = language;
    params["vote_count.gte"] = "10";
  }
  return params;
}

// Common Indian regional language names the agent or UI might pass in,
// mapped to TMDB's ISO 639-1 codes. Extend as needed.
export const INDIAN_LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  hindi: "hi",
  tamil: "ta",
  telugu: "te",
  malayalam: "ml",
  kannada: "kn",
  bengali: "bn",
  marathi: "mr",
  punjabi: "pa",
  gujarati: "gu",
};

function resolveLanguageCode(language?: string): string | undefined {
  if (!language) return undefined;
  const trimmed = language.trim().toLowerCase();
  return INDIAN_LANGUAGE_NAME_TO_CODE[trimmed] ?? trimmed;
}

// Language buckets pulled in to diversify results beyond English/Hollywood.
// Mix of Indian regional languages (relevant for this app's primary
// audience) plus a few major international cinemas, so "language: all"
// actually has real variety to filter across.
const DIVERSITY_LANGUAGE_CODES = [
  "hi", // Hindi
  "ta", // Tamil
  "te", // Telugu
  "ml", // Malayalam
  "kn", // Kannada
  "ko", // Korean
  "ja", // Japanese
  "es", // Spanish
  "fr", // French
];

/**
 * Searches TMDB's "discover" endpoint using resolved genre ids and a
 * minimum rating floor. This backs the agent's `search_movies` tool.
 *
 * IMPORTANT: `keywords` (free-text mood/theme words like "feel-good",
 * "slow burn") are intentionally NOT sent to TMDB as a query filter.
 * TMDB's `with_keywords` param requires its own internal numeric keyword
 * IDs, not arbitrary text — passing strings there filters results down to
 * effectively nothing. Genres + rating are what actually drive the mood
 * match; keywords exist for the model's own reasoning about *why* a movie
 * fits, not as a database query term. (Previously this fell back to a
 * literal `/search/movie?query=<keyword>` title search when discover came
 * back empty, which is why moods like "feeling low" could match movies
 * with "Feeling" in the title — that fallback has been removed.)
 */
export async function searchMovies(args: {
  genres?: string[];
  keywords?: string[];
  minRating?: number;
  language?: string;
}): Promise<Movie[]> {
  const genreIds = resolveGenreIds(args.genres);
  const languageCode = resolveLanguageCode(args.language);

  let data = await tmdbFetch<{ results: TmdbMovieResult[] }>(
    "/discover/movie",
    buildDiscoverParams(genreIds, args.minRating, true, languageCode)
  );

  // Broaden by dropping the rating floor before giving up — still genre
  // (and language, if specified) filtered, so results stay mood-relevant
  // even when relaxed.
  if (data.results.length === 0 && args.minRating) {
    data = await tmdbFetch<{ results: TmdbMovieResult[] }>(
      "/discover/movie",
      buildDiscoverParams(genreIds, undefined, false, languageCode)
    );
  }

  let combined = data.results;

  // The primary query above skews English/Hollywood by default (TMDB sorts
  // by global popularity), so unless the user/agent already asked for a
  // specific language, pull in a slice from several other language buckets
  // too — otherwise non-English cinema never surfaces and "language: all"
  // in the UI has nothing to actually filter across.
  //
  // Each language is queried in parallel with Promise.allSettled rather
  // than sequentially: TMDB connections can be flaky (transient
  // ECONNRESET-type failures even after tmdbFetch's own retries), and with
  // allSettled a couple of failed language buckets don't take down the
  // others — you still get partial diversity instead of falling back to
  // English-only every time one request has trouble.
  if (!languageCode) {
    const existingIds = new Set(combined.map((m) => m.id));

    const results = await Promise.allSettled(
      DIVERSITY_LANGUAGE_CODES.map(async (code) => {
        const params = buildDiscoverParams(genreIds, undefined, false);
        params.with_original_language = code;
        // Non-English/non-Hollywood titles get far fewer TMDB votes —
        // the default vote_count.gte:50 would exclude almost all of them.
        params["vote_count.gte"] = "5";

        const langData = await tmdbFetch<{ results: TmdbMovieResult[] }>(
          "/discover/movie",
          params
        );
        return langData.results;
      })
    );

    for (const result of results) {
      if (result.status !== "fulfilled") {
        console.warn(
          "[tmdb] a language diversity query failed, skipping that bucket",
          result.reason
        );
        continue;
      }
      // Take a small slice per language so no single language dominates,
      // and dedupe against everything gathered so far.
      const newTitles = result.value
        .filter((m) => !existingIds.has(m.id))
        .slice(0, 3);
      newTitles.forEach((m) => existingIds.add(m.id));
      combined = [...combined, ...newTitles];
    }
  }

  return combined.slice(0, 28).map(mapMovie);
}

export async function getTrailer(movieId: number): Promise<Trailer | null> {
  const data = await tmdbFetch<{
    results: { key: string; name: string; site: string; type: string }[];
  }>(`/movie/${movieId}/videos`);

  const trailer =
    data.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    data.results.find((v) => v.site === "YouTube");

  return trailer
    ? { key: trailer.key, name: trailer.name, site: trailer.site }
    : null;
}

export async function getStreamingAvailability(
  movieId: number,
  region = "IN"
): Promise<StreamingAvailability> {
  const data = await tmdbFetch<{
    results: Record<
      string,
      {
        link?: string;
        flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
        rent?: { provider_id: number; provider_name: string; logo_path: string }[];
        buy?: { provider_id: number; provider_name: string; logo_path: string }[];
      }
    >;
  }>(`/movie/${movieId}/watch/providers`);

  const regionData = data.results[region];

  const mapProviders = (
    list?: { provider_id: number; provider_name: string; logo_path: string }[]
  ): StreamingProvider[] =>
    (list ?? []).map((p) => ({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
    }));

  return {
    region,
    flatrate: mapProviders(regionData?.flatrate),
    rent: mapProviders(regionData?.rent),
    buy: mapProviders(regionData?.buy),
    link: regionData?.link,
  };
}