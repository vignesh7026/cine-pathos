import type { Movie } from "@/types/movie";
import PosterCard from "./PosterCard";

interface PosterGridProps {
  movies: Movie[];
  isLoading?: boolean;
}

// Skeleton count is just a reasonable default for the loading state —
// tune to match how many results your agent typically returns.
const SKELETON_COUNT = 8;

export default function PosterGrid({ movies, isLoading }: PosterGridProps) {
  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 pb-24 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[2/3] animate-pulse rounded-lg border border-raised2 bg-raised2/50" />
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-raised2/50" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-raised2/40" />
          </div>
        ))}
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 text-center">
        <p className="font-display text-base italic text-foam/80">
          No picks yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tell it your mood above and the marquee will light up.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 pb-24 sm:grid-cols-3 lg:grid-cols-4">
      {movies.map((movie) => (
        <PosterCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}