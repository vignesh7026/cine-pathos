"use client";

import { useState } from "react";

interface MoviePosterProps {
  posterPath: string | null;
  title: string;
  size?: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
}

export default function MoviePoster({ posterPath, title, size = "w500" }: MoviePosterProps) {
  const [error, setError] = useState(false);

  if (!posterPath || error) {
    return (
      <div className="flex h-full items-center justify-center text-white/30 text-sm">
        no poster
      </div>
    );
  }

  // Try HTTPS first; if that fails, the onError will fallback to the placeholder.
  const src = `https://image.tmdb.org/t/p/${size}${posterPath}`;

  return (
    <img
      src={src}
      alt={title}
      className="object-cover w-full h-full"
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
}