"use client";

import { useEffect, useState } from "react";
import type { Trailer } from "@/types/movie";

interface TrailerCardProps {
  movieId: number;
  title: string;
}

export default function TrailerCard({ movieId, title }: TrailerCardProps) {
  const [trailer, setTrailer] = useState<Trailer | null | undefined>(
    undefined
  ); // undefined = loading, null = none found
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTrailer(undefined);
    setPlaying(false);

    fetch(`/api/movie/${movieId}/trailer`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTrailer(data.trailer ?? null);
      })
      .catch(() => {
        if (!cancelled) setTrailer(null);
      });

    return () => {
      cancelled = true;
    };
  }, [movieId]);

  if (trailer === null) return null; // nothing to show, fail quiet

  return (
    <div className="trailer-card">
      <div className="trailer-card__label">
        <span className="trailer-card__bulb" />
        Now Screening
      </div>

      <div className="trailer-card__frame">
        {playing && trailer ? (
          <iframe
            className="trailer-card__iframe"
            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
            title={trailer.name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="trailer-card__thumb"
            disabled={!trailer}
            onClick={() => setPlaying(true)}
            aria-label={`Play trailer for ${title}`}
            style={
              trailer
                ? {
                    backgroundImage: `url(https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg)`,
                  }
                : undefined
            }
          >
            <span className="trailer-card__scrim" />
            <span className="trailer-card__play">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>
            {!trailer && <span className="trailer-card__loading">loading trailer…</span>}
          </button>
        )}
      </div>

      <style jsx>{`
        .trailer-card {
          --marquee-amber: #f0a93e;
          --marquee-amber-dim: rgba(240, 169, 62, 0.35);
          width: 100%;
          max-width: 420px;
        }

        .trailer-card__label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--marquee-amber);
          margin-bottom: 10px;
          font-weight: 600;
        }

        .trailer-card__bulb {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--marquee-amber);
          box-shadow: 0 0 8px 2px var(--marquee-amber-dim);
          animation: bulb-pulse 1.6s ease-in-out infinite;
        }

        @keyframes bulb-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .trailer-card__frame {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(15, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(240, 169, 62, 0.18);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        }

        .trailer-card__thumb {
          all: unset;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          aspect-ratio: 16 / 9;
          background-color: rgba(255, 255, 255, 0.03);
          background-size: cover;
          background-position: center;
          cursor: pointer;
          position: relative;
        }

        .trailer-card__thumb:disabled {
          cursor: default;
        }

        .trailer-card__scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(10, 10, 18, 0.15) 0%,
            rgba(10, 10, 18, 0.55) 100%
          );
          transition: background 0.2s ease;
        }

        .trailer-card__thumb:hover .trailer-card__scrim {
          background: rgba(10, 10, 18, 0.35);
        }

        .trailer-card__play {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--marquee-amber);
          color: #14141f;
          box-shadow: 0 0 0 0 var(--marquee-amber-dim);
          transition: transform 0.18s ease, box-shadow 0.3s ease;
        }

        .trailer-card__thumb:hover .trailer-card__play {
          transform: scale(1.08);
          box-shadow: 0 0 0 10px transparent, 0 0 24px 4px var(--marquee-amber-dim);
        }

        .trailer-card__play svg {
          margin-left: 2px;
        }

        .trailer-card__loading {
          position: absolute;
          bottom: 10px;
          left: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .trailer-card__iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
          border: 0;
          display: block;
        }
      `}</style>
    </div>
  );
}