"use client";

import { useMemo, useState } from "react";
import type { Movie } from "@/types/movie";
import MovieCard from "@/components/MovieCard";

interface MovieGridProps {
  movies: Movie[];
  agentNote: string;
}

type SortOrder = "newest" | "oldest";

// Turns an ISO 639-1 code ("en", "ko", "hi") into a display name ("English",
// "Korean", "Hindi"). Falls back to the raw code if Intl.DisplayNames isn't
// available for some reason (very old browsers / unusual runtimes).
function languageLabel(code: string): string {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    return dn.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export default function MovieGrid({ movies, agentNote }: MovieGridProps) {
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Only show languages actually present in this result set, so the
  // dropdown never offers an option that would just empty the grid.
  const availableLanguages = useMemo(() => {
    const codes = new Set(movies.map((m) => m.originalLanguage).filter(Boolean));
    return Array.from(codes).sort((a, b) =>
      languageLabel(a).localeCompare(languageLabel(b))
    );
  }, [movies]);

  const visibleMovies = useMemo(() => {
    let list = movies;

    if (languageFilter !== "all") {
      list = list.filter((m) => m.originalLanguage === languageFilter);
    }

    list = [...list].sort((a, b) => {
      // Movies with no/invalid release date sort to the end regardless of order.
      const aTime = a.releaseDate ? new Date(a.releaseDate).getTime() : NaN;
      const bTime = b.releaseDate ? new Date(b.releaseDate).getTime() : NaN;
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    return list;
  }, [movies, languageFilter, sortOrder]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="mb-8 text-center font-display text-lg italic text-foam/90">
        {agentNote}
      </p>

      {movies.length === 0 ? (
        <p className="text-center text-sm text-muted">
          Nothing matched — try describing the mood a little differently.
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
            <label className="flex items-center gap-2 text-muted">
              language:
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="rounded-lg border border-raised2 bg-raised/60 px-2 py-1 text-foam outline-none transition hover:border-marquee/40 focus:border-marquee/60"
              >
                <option value="all">all</option>
                {availableLanguages.map((code) => (
                  <option key={code} value={code}>
                    {languageLabel(code)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-muted">
              sort:
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="rounded-lg border border-raised2 bg-raised/60 px-2 py-1 text-foam outline-none transition hover:border-marquee/40 focus:border-marquee/60"
              >
                <option value="newest">newest first</option>
                <option value="oldest">oldest first</option>
              </select>
            </label>
          </div>

          {visibleMovies.length === 0 ? (
            <p className="text-center text-sm text-muted">
              No movies match that language filter — try &quot;all&quot;.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {visibleMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}