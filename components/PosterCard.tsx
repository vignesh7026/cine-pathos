"use client";

import { useRef, useState } from "react";
import type { Movie, Trailer, StreamingAvailability } from "@/types/movie";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface PosterCardProps {
  movie: Movie;
}

export default function PosterCard({ movie }: PosterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const [trailer, setTrailer] = useState<Trailer | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [availability, setAvailability] =
    useState<StreamingAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - py) * 3;
    const rotateY = (px - 0.5) * 3;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  };

  async function handleWatchTrailer() {
    if (trailer) {
      window.open(
        `https://www.youtube.com/watch?v=${trailer.key}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    setTrailerLoading(true);
    try {
      const res = await fetch(`/api/movie/${movie.id}/trailer`);
      const data = await res.json();
      const t = data?.trailer;
      setTrailer(t);
      if (t?.key) {
        window.open(
          `https://www.youtube.com/watch?v=${t.key}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch {
      // Silent fail is acceptable here — worst case the link just doesn't open
    } finally {
      setTrailerLoading(false);
    }
  }

  async function handleWhereToWatch() {
    if (availability) {
      setShowAvailability((v) => !v);
      return;
    }
    setAvailabilityLoading(true);
    try {
      const res = await fetch(`/api/movie/${movie.id}/providers`);
      const data: StreamingAvailability = await res.json();
      setAvailability(data);
      setShowAvailability(true);
    } catch {
      setAvailability(null);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  const year = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  return (
    <div className="flex flex-col">
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="poster-tilt will-change-transform relative overflow-hidden rounded-lg border border-raised2 bg-raised shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
      >
        {movie.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
            alt={movie.title}
            className="block h-auto w-full"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center bg-raised2 text-xs text-muted">
            No poster
          </div>
        )}
        <div className="poster-glare pointer-events-none absolute inset-0" />

        <div className="absolute right-2 top-2 rounded-md border border-marquee/30 bg-void/80 px-2 py-1 font-mono text-xs font-medium text-marquee backdrop-blur-sm">
          {movie.voteAverage.toFixed(1)}
        </div>
      </div>

      <div className="pt-3">
        <p className="font-display text-base text-foam">{movie.title}</p>
        {year && <p className="mt-0.5 font-mono text-xs text-muted">{year}</p>}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
          {movie.overview}
        </p>

        <div className="mt-3 flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleWatchTrailer}
            disabled={trailerLoading}
            className="text-marquee transition hover:text-marquee2 disabled:opacity-50"
          >
            {trailerLoading ? "Loading…" : "Watch trailer"}
          </button>
          <button
            onClick={handleWhereToWatch}
            disabled={availabilityLoading}
            className="text-muted transition hover:text-foam disabled:opacity-50"
          >
            {availabilityLoading ? "Loading…" : "Where to watch"}
          </button>
        </div>

        {showAvailability && availability && (
          <div className="mt-2 rounded-lg border border-raised2 bg-raised p-2.5">
            {availability.flatrate.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availability.flatrate.map((p) => (
                  <span
                    key={p.providerId}
                    className="rounded-full border border-raised2 px-2 py-1 text-[11px] text-muted"
                  >
                    {p.providerName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted">
                Not available to stream in your region.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}