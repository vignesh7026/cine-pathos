"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import type { Movie } from "@/types/movie";
import Link from "next/link";

interface MovieGridProps {
  movies: Movie[];
  agentNote: string;
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  ml: "Malayalam",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  zh: "Chinese",
};

function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code.toUpperCase();
}

function MoviePosterCard({ movie }: { movie: Movie }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const match = useMemo(() => Math.floor(70 + Math.random() * 25), []);

  const posterUrl = movie.posterPath && !imgError
    ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
    : null;

  return (
    <Link href={`/movie/${movie.id}`} className="scroll-card-link">
      <div
        className={`scroll-card ${hovered ? "scroll-card-hovered" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Poster */}
        <div className="scroll-card-poster">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="scroll-card-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="scroll-card-fallback">
              <span>{movie.title.slice(0, 2).toUpperCase()}</span>
            </div>
          )}

          {/* TOP 10 badge */}
          {movie.voteAverage && movie.voteAverage > 7.5 && (
            <div className="scroll-card-badge">TOP 10</div>
          )}

          {/* Hover overlay */}
          <div className={`scroll-card-overlay ${hovered ? "scroll-card-overlay-show" : ""}`}>
            <div className="scroll-card-overlay-inner">
              <div className="scroll-card-play">▶</div>
              <p className="scroll-card-overlay-title">{movie.title}</p>
              <div className="scroll-card-meta">
                <span className="scroll-card-match">{match}% match</span>
                <span className="scroll-card-year">{movie.releaseDate?.slice(0, 4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title below card */}
        <p className="scroll-card-title">{movie.title}</p>
      </div>
    </Link>
  );
}

function HorizontalRow({ title, movies }: { title: string; movies: Movie[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
    setTimeout(updateArrows, 400);
  };

  if (movies.length === 0) return null;

  return (
    <div className="row-wrapper">
      <h2 className="row-title">{title}</h2>
      <div className="row-container">
        {canScrollLeft && (
          <button className="row-arrow row-arrow-left" onClick={() => scroll("left")} aria-label="Scroll left">
            ‹
          </button>
        )}
        <div
          ref={rowRef}
          className="row-scroll"
          onScroll={updateArrows}
        >
          {movies.map((movie) => (
            <MoviePosterCard key={movie.id} movie={movie} />
          ))}
        </div>
        {canScrollRight && movies.length > 4 && (
          <button className="row-arrow row-arrow-right" onClick={() => scroll("right")} aria-label="Scroll right">
            ›
          </button>
        )}
      </div>
    </div>
  );
}

export default function MovieGrid({ movies, agentNote }: MovieGridProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Group movies by language
  const grouped = useMemo(() => {
    const map: Record<string, Movie[]> = {};
    for (const m of movies) {
      const lang = m.originalLanguage || "en";
      if (!map[lang]) map[lang] = [];
      map[lang].push(m);
    }
    return map;
  }, [movies]);

  const availableLangs = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // Filtered view for "all" shows rows per language; for specific lang shows flat grid
  const filteredMovies = useMemo(() => {
    if (activeFilter === "all") return movies;
    return movies.filter((m) => m.originalLanguage === activeFilter);
  }, [movies, activeFilter]);

  return (
    <div className="mgrid-wrapper">
      {/* Agent note */}
      <p className="mgrid-note">{agentNote}</p>

      {/* Filter pills */}
      <div className="mgrid-filters">
        <button
          className={`mgrid-pill ${activeFilter === "all" ? "mgrid-pill-active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        {availableLangs.map((lang) => (
          <button
            key={lang}
            className={`mgrid-pill ${activeFilter === lang ? "mgrid-pill-active" : ""}`}
            onClick={() => setActiveFilter(lang)}
          >
            {langLabel(lang)}
            <span className="mgrid-pill-count">{grouped[lang].length}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeFilter === "all" ? (
        <div className="mgrid-rows">
          {/* Featured row: top rated across all languages */}
          <HorizontalRow
            title="🔥 Top Picks For Your Mood"
            movies={[...movies].sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0)).slice(0, 20)}
          />
          {/* Per-language rows */}
          {availableLangs.map((lang) => (
            <HorizontalRow
              key={lang}
              title={`${langLabel(lang)} Films`}
              movies={grouped[lang]}
            />
          ))}
        </div>
      ) : (
        <div>
          <HorizontalRow
            title={`${langLabel(activeFilter)} Films (${filteredMovies.length})`}
            movies={filteredMovies}
          />
          {filteredMovies.length === 0 && (
            <p className="mgrid-empty">No {langLabel(activeFilter)} films found. Try "All".</p>
          )}
        </div>
      )}

      <style>{`
        .mgrid-wrapper {
          width: 100%;
          min-height: 100vh;
          background: #050510;
          padding: 0 0 60px 0;
        }

        .mgrid-note {
          text-align: center;
          font-size: 1.05rem;
          font-style: italic;
          color: rgba(245,240,240,0.8);
          padding: 0 24px 24px;
          max-width: 700px;
          margin: 0 auto;
          text-shadow: 0 0 20px rgba(129,140,248,0.2);
        }

        .mgrid-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 0 24px 32px;
          justify-content: center;
        }

        .mgrid-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(245,240,240,0.6);
          font-size: 0.82rem;
          font-family: monospace;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .mgrid-pill:hover { background: rgba(255,255,255,0.1); color: #f5f0f0; }

        .mgrid-pill-active {
          background: rgba(129,140,248,0.2) !important;
          border-color: rgba(129,140,248,0.5) !important;
          color: #c7d2fe !important;
        }

        .mgrid-pill-count {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 1px 7px;
          font-size: 0.75rem;
        }

        .mgrid-rows { display: flex; flex-direction: column; gap: 8px; }

        .mgrid-empty {
          text-align: center;
          color: rgba(245,240,240,0.4);
          padding: 60px 24px;
          font-size: 0.95rem;
        }

        /* Row */
        .row-wrapper { padding: 8px 0 16px; }

        .row-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #f5f0f0;
          padding: 0 40px 12px;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .row-container {
          position: relative;
        }

        .row-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: visible;
          scroll-snap-type: x mandatory;
          padding: 8px 40px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .row-scroll::-webkit-scrollbar { display: none; }

        /* Arrow buttons */
        .row-arrow {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 44px;
          background: linear-gradient(to right, rgba(5,5,16,0.95), rgba(5,5,16,0.4));
          color: #f5f0f0;
          font-size: 2.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          padding-bottom: 16px;
        }

        .row-arrow:hover { background: linear-gradient(to right, rgba(5,5,16,1), rgba(5,5,16,0.6)); }

        .row-arrow-left { left: 0; background: linear-gradient(to right, rgba(5,5,16,0.95), rgba(5,5,16,0.4)); }
        .row-arrow-right { right: 0; background: linear-gradient(to left, rgba(5,5,16,0.95), rgba(5,5,16,0.4)); }

        /* Scroll Card */
        .scroll-card-link { text-decoration: none; flex-shrink: 0; scroll-snap-align: start; }

        .scroll-card {
          width: 170px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), z-index 0s;
          position: relative;
          z-index: 1;
        }

        .scroll-card-hovered {
          transform: scale(1.12) translateY(-4px);
          z-index: 20;
        }

        .scroll-card-poster {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 8px;
          overflow: hidden;
          background: #1a1a2e;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          transition: box-shadow 0.25s;
        }

        .scroll-card-hovered .scroll-card-poster {
          box-shadow: 0 16px 48px rgba(0,0,0,0.8);
        }

        .scroll-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .scroll-card-hovered .scroll-card-img { transform: scale(1.04); }

        .scroll-card-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e, #2a2a4a);
          font-size: 2.5rem;
          font-weight: 800;
          color: rgba(255,255,255,0.3);
        }

        .scroll-card-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #e50914;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 3px 7px;
          border-radius: 4px;
        }

        .scroll-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(5,5,16,0.97) 0%, rgba(5,5,16,0.4) 50%, rgba(5,5,16,0.05) 100%);
          opacity: 0;
          transition: opacity 0.25s;
          display: flex;
          align-items: flex-end;
        }

        .scroll-card-overlay-show { opacity: 1; }

        .scroll-card-overlay-inner {
          padding: 12px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .scroll-card-play {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          color: #050510;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }

        .scroll-card-overlay-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: #f5f0f0;
          line-height: 1.3;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scroll-card-meta {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .scroll-card-match {
          color: #46d369;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .scroll-card-year {
          color: rgba(245,240,240,0.5);
          font-size: 0.72rem;
        }

        .scroll-card-title {
          font-size: 0.78rem;
          color: rgba(245,240,240,0.7);
          line-height: 1.3;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          padding: 0 2px;
          transition: color 0.2s;
        }

        .scroll-card-hovered .scroll-card-title { color: #f5f0f0; }

        @media (max-width: 640px) {
          .scroll-card { width: 130px; }
          .row-title { padding: 0 16px 10px; font-size: 1rem; }
          .row-scroll { padding: 8px 16px 16px; gap: 8px; }
          .row-arrow { width: 32px; font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
}