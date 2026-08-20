"use client";

import { useEffect, useState } from "react";
import type { StreamingAvailability, StreamingProvider } from "@/types/movie";

interface WhereToWatchProps {
  movieId: number;
  region?: string; // defaults to IN
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

function ProviderChip({ provider }: { provider: StreamingProvider }) {
  return (
    <div className="provider-chip" title={provider.providerName}>
      {provider.logoPath ? (
        <img
          src={`${TMDB_IMG}${provider.logoPath}`}
          alt={provider.providerName}
          className="provider-chip__logo"
        />
      ) : (
        <span className="provider-chip__fallback">
          {provider.providerName.slice(0, 1)}
        </span>
      )}
      <span className="provider-chip__name">{provider.providerName}</span>

      <style jsx>{`
        .provider-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(240, 169, 62, 0.14);
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .provider-chip:hover {
          border-color: rgba(240, 169, 62, 0.45);
          background: rgba(255, 255, 255, 0.07);
        }

        .provider-chip__logo {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: block;
          object-fit: cover;
        }

        .provider-chip__fallback {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(240, 169, 62, 0.25);
          color: #f0a93e;
          font-size: 12px;
          font-weight: 700;
        }

        .provider-chip__name {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

export default function WhereToWatch({ movieId, region = "IN" }: WhereToWatchProps) {
  const [data, setData] = useState<StreamingAvailability | null | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    setData(undefined);

    fetch(`/api/movie/${movieId}/providers?region=${region}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json.error ? null : json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [movieId, region]);

  const hasAny =
    data && (data.flatrate.length || data.rent.length || data.buy.length);

  return (
    <div className="where-to-watch">
      <div className="where-to-watch__label">
        <span className="where-to-watch__bulb" />
        Where It Screens
      </div>

      {data === undefined && (
        <div className="where-to-watch__skeleton">
          <span />
          <span />
          <span />
        </div>
      )}

      {data !== undefined && !hasAny && (
        <p className="where-to-watch__empty">
          Not currently available to stream in your region.
        </p>
      )}

      {hasAny && (
        <div className="where-to-watch__groups">
          {data!.flatrate.length > 0 && (
            <div className="where-to-watch__group">
              <span className="where-to-watch__group-title">Stream</span>
              <div className="where-to-watch__chips">
                {data!.flatrate.map((p) => (
                  <ProviderChip key={`flat-${p.providerId}`} provider={p} />
                ))}
              </div>
            </div>
          )}

          {data!.rent.length > 0 && (
            <div className="where-to-watch__group">
              <span className="where-to-watch__group-title">Rent</span>
              <div className="where-to-watch__chips">
                {data!.rent.map((p) => (
                  <ProviderChip key={`rent-${p.providerId}`} provider={p} />
                ))}
              </div>
            </div>
          )}

          {data!.buy.length > 0 && (
            <div className="where-to-watch__group">
              <span className="where-to-watch__group-title">Buy</span>
              <div className="where-to-watch__chips">
                {data!.buy.map((p) => (
                  <ProviderChip key={`buy-${p.providerId}`} provider={p} />
                ))}
              </div>
            </div>
          )}

          {data!.link && (
            <a
              href={data!.link}
              target="_blank"
              rel="noopener noreferrer"
              className="where-to-watch__more"
            >
              View all options ↗
            </a>
          )}
        </div>
      )}

      <style jsx>{`
        .where-to-watch {
          --marquee-amber: #f0a93e;
          --marquee-amber-dim: rgba(240, 169, 62, 0.35);
          width: 100%;
          margin-top: 28px;
        }

        .where-to-watch__label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--marquee-amber);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .where-to-watch__bulb {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--marquee-amber);
          box-shadow: 0 0 8px 2px var(--marquee-amber-dim);
        }

        .where-to-watch__skeleton {
          display: flex;
          gap: 10px;
        }

        .where-to-watch__skeleton span {
          width: 96px;
          height: 34px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .where-to-watch__skeleton span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .where-to-watch__skeleton span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .where-to-watch__empty {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
        }

        .where-to-watch__groups {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .where-to-watch__group {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .where-to-watch__group-title {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          width: 48px;
          flex-shrink: 0;
        }

        .where-to-watch__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .where-to-watch__more {
          align-self: flex-start;
          font-size: 13px;
          color: var(--marquee-amber);
          text-decoration: none;
          margin-top: 2px;
        }

        .where-to-watch__more:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}