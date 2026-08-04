"use client";

import { useState } from "react";
import Image from "next/image";
import type { Movie, StreamingAvailability, Trailer } from "@/types/movie";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export default function MovieCard({ movie }: { movie: Movie }) {
  const [trailer, setTrailer] = useState<Trailer | null | "loading">(null);
  const [providers, setProviders] = useState<
    StreamingAvailability | "loading" | null
  >(null);

  async function loadTrailer() {
    if (trailer) return; // already loaded or loading
    setTrailer("loading");
    try {
      const res = await fetch(`/api/movie/${movie.id}/trailer`);
      const data = await res.json();
      setTrailer(data.trailer ?? null);
    } catch {
      setTrailer(null);
    }
  }

  async function loadProviders() {
    if (providers) return;
    setProviders("loading");
    try {
      const res = await fetch(`/api/movie/${movie.id}/providers`);
      const data = await res.json();
      setProviders(data);
    } catch {
      setProviders(null);
    }
  }

  const year = movie.releaseDate ? movie.releaseDate.slice(0, 4) : "—";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-raised2 bg-raised/60 transition hover:border-marquee/40">
      <div className="relative aspect-[2/3] w-full bg-raised2">
        {movie.posterPath ? (
          <Image
            src={`${POSTER_BASE}${movie.posterPath}`}
            alt={`${movie.title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, 220px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center font-mono text-xs text-muted">
            no poster available
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-void/80 px-2 py-0.5 font-mono text-[11px] text-marquee">
          {movie.voteAverage.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-display text-base leading-snug text-foam">
            {movie.title}
          </h3>
          <p className="font-mono text-xs text-muted">{year}</p>
        </div>

        <p className="line-clamp-3 text-xs text-muted">{movie.overview}</p>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {trailer === null && (
            <button
              onClick={loadTrailer}
              className="rounded-lg border border-raised2 px-3 py-1.5 text-xs text-foam transition hover:border-marquee/50"
            >
              Watch trailer
            </button>
          )}
          {trailer === "loading" && (
            <p className="font-mono text-xs text-muted">loading trailer…</p>
          )}
          {trailer && trailer !== "loading" && (
            <a
              href={`https://www.youtube.com/watch?v=${trailer.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-marquee px-3 py-1.5 text-center text-xs font-semibold text-void transition hover:bg-marquee2"
            >
              Play trailer ↗
            </a>
          )}

          {providers === null && (
            <button
              onClick={loadProviders}
              className="rounded-lg border border-raised2 px-3 py-1.5 text-xs text-foam transition hover:border-plum/60"
            >
              Where to watch
            </button>
          )}
          {providers === "loading" && (
            <p className="font-mono text-xs text-muted">checking…</p>
          )}
          {providers && providers !== "loading" && (
            <div className="text-xs text-muted">
              {providers.flatrate.length > 0 ? (
                <p>
                  Streaming:{" "}
                  <span className="text-foam">
                    {providers.flatrate.map((p) => p.providerName).join(", ")}
                  </span>
                </p>
              ) : providers.rent.length > 0 || providers.buy.length > 0 ? (
                <p>
                  Rent/buy:{" "}
                  <span className="text-foam">
                    {[...providers.rent, ...providers.buy]
                      .map((p) => p.providerName)
                      .slice(0, 3)
                      .join(", ")}
                  </span>
                </p>
              ) : (
                <p>Not available to stream in this region.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
