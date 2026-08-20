// lib/tmdb.ts
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

const TMDB_BASE = "https://api.tmdb.org/3";

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
 *
 * This also retries on 429 (rate limited) and 5xx responses from TMDB
 * itself, not just network-level failures — bursts of parallel calls
 * (e.g. several MovieCards fetching /providers in quick succession) can
 * trip TMDB's rate limit, and without this those calls failed immediately
 * with no retry at all.
 */
const MAX_RETRIES = 0;
const REQUEST_TIMEOUT = 3000; // 3 seconds

const memoryCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class TmdbHttpError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(status: number, path: string, retryAfterMs?: number) {
    super(`TMDB request failed (${status}): ${path}`);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  attempt = 0
): Promise<T> {
  const cacheKey = `${path}?${new URLSearchParams(params).toString()}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const url = new URL(`https://api.tmdb.org/3${path}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: controller.signal,
      keepalive: false,
    });

    if (!res.ok) {
      throw new TmdbHttpError(res.status, path);
    }
    const data = (await res.json()) as T;
    memoryCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await sleep(300);
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
  fight: 28,
  exciting: 28,
  hero: 28,
  adventure: 12,
  animation: 16,
  anime: 16,
  cartoon: 16,
  animated: 16,
  comedy: 35,
  funny: 35,
  happy: 35,
  hilarious: 35,
  fun: 35,
  chill: 35,
  lighthearted: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  sad: 18,
  emotional: 18,
  tears: 18,
  touching: 18,
  family: 10751,
  kids: 10751,
  fantasy: 14,
  magic: 14,
  history: 36,
  horror: 27,
  scary: 27,
  spooky: 27,
  creepy: 27,
  frightening: 27,
  music: 10402,
  musical: 10402,
  mystery: 9648,
  detective: 9648,
  puzzle: 9648,
  romance: 10749,
  romantic: 10749,
  love: 10749,
  "sci-fi": 878,
  scifi: 878,
  "science fiction": 878,
  space: 878,
  future: 878,
  thriller: 53,
  dark: 53,
  intense: 53,
  suspense: 53,
  war: 10752,
  western: 37,
};

function resolveGenreIds(genres: string[] = [], keywords: string[] = []): number[] {
  const combinedTerms = [...genres, ...keywords];
  const ids = combinedTerms
    .map((g) => GENRE_NAME_TO_ID[g.trim().toLowerCase()])
    .filter((id): id is number => Boolean(id));
  return Array.from(new Set(ids));
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
    "vote_count.gte": "20",
  };
  if (genreIds.length > 0) {
    params.with_genres = genreIds.join(",");
  }
  if (includeRating && minRating) {
    params["vote_average.gte"] = String(minRating);
  }
  if (language) {
    params.with_original_language = language;
    params["vote_count.gte"] = "10";
  }
  return params;
}

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



export const MOCK_MOVIES: Movie[] = [
  {
    id: 27205,
    title: "Inception",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life.",
    posterPath: "/o0lgWQCr66DwURYyD8tZ89dfihc.jpg",
    releaseDate: "2010-07-15",
    voteAverage: 8.4,
    genreIds: [28, 878, 53],
    originalLanguage: "en"
  },
  {
    id: 157336,
    title: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    posterPath: "/gEU2QUn2w2mcu2fvjxlv36akXw0.jpg",
    releaseDate: "2014-11-05",
    voteAverage: 8.4,
    genreIds: [12, 18, 878],
    originalLanguage: "en"
  },
  {
    id: 155,
    title: "The Dark Knight",
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    posterPath: "/qJ2tWMB2CxwX3o9uVUNy2XBrEXt.jpg",
    releaseDate: "2008-07-16",
    voteAverage: 8.5,
    genreIds: [28, 80, 18, 53],
    originalLanguage: "en"
  },
  {
    id: 680,
    title: "Pulp Fiction",
    overview: "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper.",
    posterPath: "/d5i21o0jhqnS36JccieoR7wvmX8.jpg",
    releaseDate: "1994-09-10",
    voteAverage: 8.5,
    genreIds: [53, 80],
    originalLanguage: "en"
  },
  {
    id: 496243,
    title: "Parasite",
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    posterPath: "/71g04bH7w0W6X5222Z6f2v1qZ9V.jpg",
    releaseDate: "2019-05-30",
    voteAverage: 8.5,
    genreIds: [35, 53, 18],
    originalLanguage: "ko"
  },
  {
    id: 129,
    title: "Spirited Away",
    overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
    posterPath: "/393mh1e064FiyKs8mEN2cJe3I1Y.jpg",
    releaseDate: "2001-07-20",
    voteAverage: 8.5,
    genreIds: [16, 14, 10751],
    originalLanguage: "ja"
  },
  {
    id: 244786,
    title: "Whiplash",
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    posterPath: "/7oWV9caS2m6r4z9tCuasB0FNi7A.jpg",
    releaseDate: "2014-10-10",
    voteAverage: 8.4,
    genreIds: [18, 10402],
    originalLanguage: "en"
  },
  {
    id: 324857,
    title: "Spider-Man: Into the Spider-Verse",
    overview: "Miles Morales is juggling his life between being a high school student and being a spider-man. When Wilson \"Kingpin\" Fisk uses a super collider, others from across the Spider-Verse are transported to this dimension.",
    posterPath: "/iiIKc2185RrkDG4HY297s4w8ZIB.jpg",
    releaseDate: "2018-12-06",
    voteAverage: 8.4,
    genreIds: [16, 28, 12, 878],
    originalLanguage: "en"
  },
  {
    id: 603,
    title: "The Matrix",
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents who fight the vast and powerful computers who now rule the earth.",
    posterPath: "/f89U3wzqrEiwmqj0LiZSRNu27gn.jpg",
    releaseDate: "1999-03-30",
    voteAverage: 8.2,
    genreIds: [28, 878],
    originalLanguage: "en"
  },
  {
    id: 550,
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel male aggression into a shocking new form of therapy. Their concept catches on, with underground \"fight clubs\" forming in every town.",
    posterPath: "/pB8BM7m155o9t8xwG5ISu7763Uu.jpg",
    releaseDate: "1999-10-15",
    voteAverage: 8.4,
    genreIds: [18, 53],
    originalLanguage: "en"
  },
  {
    id: 13,
    title: "Forrest Gump",
    overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.",
    posterPath: "/arw2ee1w58gdfo51m5a1A6jFAbe.jpg",
    releaseDate: "1994-06-23",
    voteAverage: 8.5,
    genreIds: [35, 18, 10749],
    originalLanguage: "en"
  },
  {
    id: 238,
    title: "The Godfather",
    overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone survives a murderous attack, his youngest son, Michael steps in.",
    posterPath: "/3bhkrj6PjOqabNm5pq4BB8719u0.jpg",
    releaseDate: "1972-03-14",
    voteAverage: 8.7,
    genreIds: [18, 80],
    originalLanguage: "en"
  }
];

async function fetchMoviesForLanguage(
  genreIds: number[],
  keywords: string[],
  minRating: number | undefined,
  langCode: string | undefined
): Promise<TmdbMovieResult[]> {
  const results: TmdbMovieResult[] = [];
  const existingIds = new Set<number>();

  const append = (list: TmdbMovieResult[] = []) => {
    for (const item of list) {
      if (item && item.id && !existingIds.has(item.id)) {
        if (langCode && item.original_language !== langCode) {
          continue;
        }
        existingIds.add(item.id);
        results.push(item);
      }
    }
  };

  // 1. Text Search if keywords are provided
  if (keywords.length > 0) {
    const queryStr = keywords.slice(0, 3).join(" ").trim();
    if (queryStr.length > 0) {
      const searchData = await tmdbFetch<{ results: TmdbMovieResult[] }>(
        "/search/movie",
        { query: queryStr, include_adult: "false" }
      ).catch(() => ({ results: [] as TmdbMovieResult[] }));
      append(searchData.results);
    }
  }

  // 2. Discover page 1
  const discoverData1 = await tmdbFetch<{ results: TmdbMovieResult[] }>(
    "/discover/movie",
    buildDiscoverParams(genreIds, minRating, false, langCode)
  ).catch(() => ({ results: [] as TmdbMovieResult[] }));
  append(discoverData1.results);

  // 3. Discover page 2
  const params2 = buildDiscoverParams(genreIds, minRating, false, langCode);
  params2.page = "2";
  const discoverData2 = await tmdbFetch<{ results: TmdbMovieResult[] }>(
    "/discover/movie",
    params2
  ).catch(() => ({ results: [] as TmdbMovieResult[] }));
  append(discoverData2.results);

  // 4. Guaranteed Popular Fallback page 1 & 2 if results are low (< 30)
  if (results.length < 30) {
    const fallbackParams1: Record<string, string> = {
      sort_by: "popularity.desc",
      "vote_count.gte": "20",
    };
    if (langCode) {
      fallbackParams1.with_original_language = langCode;
    }
    const popularData1 = await tmdbFetch<{ results: TmdbMovieResult[] }>(
      "/discover/movie",
      fallbackParams1
    ).catch(() => ({ results: [] as TmdbMovieResult[] }));
    append(popularData1.results);

    if (results.length < 30) {
      const fallbackParams2 = { ...fallbackParams1, page: "2" };
      const popularData2 = await tmdbFetch<{ results: TmdbMovieResult[] }>(
        "/discover/movie",
        fallbackParams2
      ).catch(() => ({ results: [] as TmdbMovieResult[] }));
      append(popularData2.results);
    }
  }

  return results;
}

export async function searchMovies(args: {
  genres?: string[];
  keywords?: string[];
  minRating?: number;
  language?: string;
}): Promise<Movie[]> {
  const genreIds = resolveGenreIds(args.genres, args.keywords);
  const languageCode = resolveLanguageCode(args.language);

  if (languageCode) {
    // Specific language requested
    const rawMovies = await fetchMoviesForLanguage(
      genreIds,
      args.keywords || [],
      args.minRating,
      languageCode
    );
    if (rawMovies.length === 0) {
      const matched = MOCK_MOVIES.filter((m) => m.originalLanguage === languageCode);
      return matched.length > 0 ? matched : MOCK_MOVIES;
    }
    return rawMovies.slice(0, 50).map(mapMovie);
  }

  // Interleave results from English, Tamil, Hindi, Malayalam, and Telugu
  const targetLanguages = ["en", "ta", "hi", "ml", "te"];
  const promises = targetLanguages.map((lang) =>
    fetchMoviesForLanguage(
      genreIds,
      args.keywords || [],
      args.minRating,
      lang
    )
  );

  const lists = await Promise.all(promises);

  const combined: TmdbMovieResult[] = [];
  const maxLen = Math.max(...lists.map((l) => l.length));

  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) {
        combined.push(list[i]);
      }
    }
  }

  if (combined.length === 0) {
    console.warn("[tmdb] Network returned zero results. Loading mock movies fallback.");
    const matched = MOCK_MOVIES.filter((m) => {
      const hasGenre = genreIds.some((id) => m.genreIds.includes(id));
      const hasKeyword = args.keywords?.some((kw) =>
        m.title.toLowerCase().includes(kw.toLowerCase()) ||
        m.overview.toLowerCase().includes(kw.toLowerCase())
      );
      return hasGenre || hasKeyword;
    });
    return matched.length > 0 ? matched : MOCK_MOVIES;
  }

  return combined.slice(0, 150).map(mapMovie);
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

export async function getMovieDetails(movieId: number) {
  const data = await tmdbFetch<{
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    release_date: string;
    runtime: number;
    vote_average: number;
    genres: { id: number; name: string }[];
    original_language: string;
    videos?: {
      results: { key: string; name: string; site: string; type: string }[];
    };
    "watch/providers"?: {
      results: Record<
        string,
        {
          link?: string;
          flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
          rent?: { provider_id: number; provider_name: string; logo_path: string }[];
          buy?: { provider_id: number; provider_name: string; logo_path: string }[];
        }
      >;
    };
  }>(`/movie/${movieId}`, { append_to_response: "videos,watch/providers" });
  return data;
}