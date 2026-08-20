import { getMovieDetails } from '@/lib/tmdb';
import BackToResultsButton from '@/components/BackToResultsButton';
import AuthHeader from '@/components/AuthHeader';

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const PROVIDER_LINKS: Record<string, string> = {
  "Netflix": "https://netflix.com",
  "Amazon Prime Video": "https://primevideo.com",
  "Disney+ Hotstar": "https://hotstar.com",
  "Apple TV+": "https://tv.apple.com",
  "HBO Max": "https://hbomax.com",
  "Hulu": "https://hulu.com",
  "Zee5": "https://zee5.com",
  "SonyLIV": "https://sonyliv.com",
  "JioCinema": "https://jiocinema.com",
  "MX Player": "https://mxplayer.in",
  "Voot": "https://voot.com",
  "Aha": "https://aha.video",
};

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = parseInt(id);
  const details = !isNaN(movieId) ? await getMovieDetails(movieId).catch(() => null) : null;

  if (!details) {
    return (
      <main style={{ minHeight: '100vh', background: '#050510', color: '#f5f0f0' }}>
        <AuthHeader />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <BackToResultsButton />
          <div style={{ marginTop: 40, padding: 48, background: 'rgba(26,26,46,0.8)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎬</div>
            <h2 style={{ fontSize: '1.5rem', color: '#f5f0f0', marginBottom: 12 }}>Movie Details Unavailable</h2>
            <p style={{ color: 'rgba(245,240,240,0.6)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              We couldn&apos;t retrieve details for this title right now.
            </p>
            <a href="/results" style={{ display: 'inline-block', marginTop: 28, padding: '10px 24px', background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.4)', borderRadius: 8, color: '#c7d2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
              ← Back to recommendations
            </a>
          </div>
        </div>
      </main>
    );
  }

  const videoResults = details.videos?.results || [];
  const trailer =
    videoResults.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videoResults.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
    videoResults.find((v) => v.site === "YouTube") ||
    null;

  const regionData = details["watch/providers"]?.results?.["IN"];
  const flatrate = regionData?.flatrate || [];
  const rent = regionData?.rent || [];
  const buy = regionData?.buy || [];
  const allProviders = [
    ...flatrate.map(p => ({ ...p, type: "stream" as const })),
    ...rent.filter(p => !flatrate.some(f => f.provider_id === p.provider_id)).map(p => ({ ...p, type: "rent" as const })),
    ...buy.filter(p => !flatrate.some(f => f.provider_id === p.provider_id) && !rent.some(r => r.provider_id === p.provider_id)).map(p => ({ ...p, type: "buy" as const })),
  ];
  const hasProviders = allProviders.length > 0;

  const backdropUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/original${details.poster_path}`
    : null;

  const matchScore = details.vote_average ? Math.round(details.vote_average * 10) : null;

  return (
    <main className="detail-main">
      <AuthHeader />

      {/* Full-screen backdrop */}
      {backdropUrl && (
        <div className="detail-backdrop">
          <img src={backdropUrl} alt="" className="detail-backdrop-img" />
          <div className="detail-backdrop-gradient" />
        </div>
      )}

      <div className="detail-content">
        <div className="detail-back-btn">
          <BackToResultsButton />
        </div>

        <div className="detail-layout">
          {/* Left: Poster */}
          <div className="detail-poster-col">
            {details.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                alt={details.title}
                className="detail-poster-img"
              />
            ) : (
              <div className="detail-poster-fallback">
                <span>🎬</span>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="detail-info-col">
            <h1 className="detail-title">{details.title}</h1>

            <div className="detail-meta-row">
              {matchScore && (
                <span className="detail-match">{matchScore}% match</span>
              )}
              {details.release_date && (
                <span className="detail-meta-text">{details.release_date.slice(0, 4)}</span>
              )}
              {details.runtime && details.runtime > 0 && (
                <span className="detail-meta-text">{formatRuntime(details.runtime)}</span>
              )}
              {details.original_language && (
                <span className="detail-lang-badge">{details.original_language.toUpperCase()}</span>
              )}
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="detail-genres">
                {details.genres.map((g) => (
                  <span key={g.id} className="detail-genre-chip">{g.name}</span>
                ))}
              </div>
            )}

            {/* Overview */}
            <p className="detail-overview">
              {details.overview || "No overview available for this title."}
            </p>

            {/* Streaming Providers */}
            <div className="detail-providers-section">
              <h2 className="detail-section-title">
                {hasProviders ? "Where to Watch" : "Streaming Info"}
              </h2>
              {hasProviders ? (
                <div className="detail-providers-list">
                  {allProviders.map((p) => {
                    const link = PROVIDER_LINKS[p.provider_name] || "#";
                    return (
                      <a
                        key={p.provider_id}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-provider-badge"
                        title={p.provider_name}
                      >
                        {p.logo_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                            alt={p.provider_name}
                            className="detail-provider-logo"
                          />
                        ) : (
                          <span className="detail-provider-name">{p.provider_name}</span>
                        )}
                        <div className="detail-provider-type-tag">
                          {p.type === "stream" ? "Stream" : p.type === "rent" ? "Rent" : "Buy"}
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="detail-no-providers">
                  <span>🌐</span>
                  <div>
                    <p className="detail-no-providers-text">Not available for streaming in India (IN) right now.</p>
                    <p className="detail-no-providers-sub">Try searching on JioCinema, Hotstar, Netflix, or Prime Video.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trailer Section */}
        <div className="detail-trailer-section">
          <h2 className="detail-section-title-large">
            {trailer ? "🎬 Official Trailer" : "🎬 Preview"}
          </h2>
          {trailer ? (
            <div className="detail-trailer-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                title={trailer.name || `${details.title} Trailer`}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="detail-trailer-iframe"
              />
            </div>
          ) : (
            <div className="detail-no-trailer">
              <p className="detail-no-trailer-text">No trailer available for this title yet.</p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(details.title + " official trailer")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-yt-search-btn"
              >
                🔍 Search on YouTube
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .detail-main {
          min-height: 100vh;
          background: #050510;
          position: relative;
          color: #f5f0f0;
          overflow-x: hidden;
        }

        .detail-backdrop {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .detail-backdrop-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          opacity: 0.08;
          filter: blur(2px);
        }

        .detail-backdrop-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(5,5,16,0.3) 0%, rgba(5,5,16,0.8) 50%, rgba(5,5,16,1) 100%);
        }

        .detail-content {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 32px 60px;
        }

        .detail-back-btn { margin-bottom: 24px; }

        .detail-layout {
          display: flex;
          gap: 48px;
          align-items: flex-start;
          margin-bottom: 56px;
        }

        .detail-poster-col { flex-shrink: 0; width: 260px; }

        .detail-poster-img {
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06);
          display: block;
        }

        .detail-poster-fallback {
          width: 100%;
          aspect-ratio: 2/3;
          background: linear-gradient(135deg, #1a1a2e, #2a2a4a);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .detail-info-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 8px;
        }

        .detail-title {
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 800;
          color: #f5f0f0;
          line-height: 1.15;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .detail-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }

        .detail-match {
          color: #46d369;
          font-size: 1rem;
          font-weight: 700;
        }

        .detail-meta-text {
          color: rgba(245,240,240,0.6);
          font-size: 0.95rem;
        }

        .detail-lang-badge {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(245,240,240,0.8);
          letter-spacing: 0.05em;
        }

        .detail-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .detail-genre-chip {
          padding: 5px 14px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          font-size: 0.82rem;
          color: rgba(245,240,240,0.8);
        }

        .detail-overview {
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(245,240,240,0.85);
          margin: 0;
          max-width: 620px;
        }

        .detail-providers-section { display: flex; flex-direction: column; gap: 14px; }

        .detail-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(245,240,240,0.7);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }

        .detail-providers-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .detail-provider-badge {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: transform 0.2s;
        }

        .detail-provider-badge:hover { transform: scale(1.08); }

        .detail-provider-logo {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .detail-provider-name {
          max-width: 80px;
          font-size: 0.75rem;
          color: #f5f0f0;
          text-align: center;
          background: rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 8px 10px;
          line-height: 1.3;
        }

        .detail-provider-type-tag {
          font-size: 0.65rem;
          color: rgba(245,240,240,0.5);
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-no-providers {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          max-width: 480px;
        }

        .detail-no-providers span { font-size: 1.4rem; flex-shrink: 0; margin-top: 2px; }

        .detail-no-providers-text {
          font-size: 0.9rem;
          color: rgba(245,240,240,0.7);
          margin: 0 0 4px;
          line-height: 1.5;
        }

        .detail-no-providers-sub {
          font-size: 0.8rem;
          color: rgba(245,240,240,0.45);
          margin: 0;
        }

        /* Trailer */
        .detail-trailer-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-section-title-large {
          font-size: 1.4rem;
          font-weight: 700;
          color: #f5f0f0;
          margin: 0;
        }

        .detail-trailer-wrapper {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 16px 64px rgba(0,0,0,0.7);
        }

        .detail-trailer-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .detail-no-trailer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 60px 32px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 16px;
          text-align: center;
        }

        .detail-no-trailer-text {
          font-size: 1rem;
          color: rgba(245,240,240,0.5);
          margin: 0;
        }

        .detail-yt-search-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: rgba(255,0,0,0.15);
          border: 1px solid rgba(255,0,0,0.3);
          border-radius: 10px;
          color: #fca5a5;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .detail-yt-search-btn:hover {
          background: rgba(255,0,0,0.25);
          border-color: rgba(255,0,0,0.5);
          transform: scale(1.03);
        }

        @media (max-width: 768px) {
          .detail-content { padding: 70px 16px 40px; }
          .detail-layout { flex-direction: column; gap: 24px; }
          .detail-poster-col { width: 100%; max-width: 240px; margin: 0 auto; }
          .detail-title { font-size: 1.8rem; }
        }
      `}</style>
    </main>
  );
}