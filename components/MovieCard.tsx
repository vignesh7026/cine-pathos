"use client";

import Link from "next/link";
import type { Movie } from "@/types/movie";
import { useState } from "react";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const match = Math.floor(70 + Math.random() * 25);
  const runtime = movie.runtime ?? 120;
  const [imgError, setImgError] = useState(false);

  const posterPath = movie.posterPath;
  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w342${posterPath}`
    : null;

  const httpImageUrl = posterPath
    ? `http://image.tmdb.org/t/p/w342${posterPath}`
    : null;

  const proxyUrl = posterPath
    ? `https://images.weserv.nl/?url=image.tmdb.org/t/p/w342${posterPath}`
    : null;

  const [useHttp, setUseHttp] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  let currentSrc = imageUrl;
  if (useProxy && proxyUrl) currentSrc = proxyUrl;
  else if (useHttp && httpImageUrl) currentSrc = httpImageUrl;

  const handleImageError = () => {
    if (!useHttp && httpImageUrl) {
      setUseHttp(true);
    } else if (!useProxy && proxyUrl) {
      setUseProxy(true);
    } else {
      setImgError(true);
    }
  };

  const showImage = currentSrc && !imgError;

  return (
    <Link href={`/movie/${movie.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-[#1a1a2e] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-b from-[#2a2a4a] to-[#0d0d1a]">
          {showImage ? (
            <img
              src={currentSrc!}
              alt={movie.title}
              className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <span className="text-sm font-semibold text-white/80 line-clamp-3">
                {movie.title}
              </span>
              <span className="mt-1 text-xs text-white/40">
                {movie.releaseDate?.slice(0, 4) || 'TBA'}
              </span>
            </div>
          )}

          {movie.voteAverage && movie.voteAverage > 7 && (
            <div className="absolute left-2 top-2 rounded bg-[#e50914] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg">
              TOP 10
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/70 px-2 py-1 text-xs font-medium backdrop-blur-sm">
            <span className="text-[#46d369]">{match}% match</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>
              {runtime >= 60
                ? `${Math.floor(runtime / 60)}h${runtime % 60}m`
                : `${runtime}m`}
            </span>
            <span className="rounded border border-white/20 px-1 text-[10px] uppercase">
              HD
            </span>
          </div>
        </div>

        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-white/90 group-hover:text-white">
            {movie.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-white/50">
            {movie.genres?.slice(0, 3).map((genre) => (
              <span key={genre} className="rounded bg-white/5 px-2 py-0.5">
                {genre}
              </span>
            ))}
            {movie.genres && movie.genres.length > 3 && (
              <span className="text-white/30">+{movie.genres.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}