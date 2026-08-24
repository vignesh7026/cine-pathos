# Marquee

Mood-based AI movie recommendation app. Tell it how you feel, and it reads the room to find something worth watching.

## Features

- **Mood-driven recommendations** — describe your mood in natural language (or use voice input) and get curated movie picks powered by an LLM
- **Voice input** via the Web Speech API
- **Rich movie data** from TMDB — posters, trailers, streaming availability, ratings, genres
- **Immersive UI** — animated shader backgrounds (Three.js / OGL), Framer Motion transitions, 3D poster tilt/glare effects
- **Authentication** via NextAuth
- **Regional + language-aware discovery** — includes Indian-language film support and diversity sampling across languages

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| AI / recommendations | Groq SDK |
| Movie data | TMDB API |
| Auth | NextAuth |
| Graphics / animation | Three.js, OGL, Framer Motion |
| Voice input | Web Speech API |

## Getting Started

### Prerequisites

- Node.js 18+
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- A [Groq API key](https://console.groq.com/keys)

### Setup

```bash
git clone <repo-url>
cd mood-movies
npm install
```

Create a `.env.local` file in the project root:

```env
TMDB_API_KEY=your_tmdb_api_key
GROQ_API_KEY=your_groq_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
mood-movies/
├── lib/
│   └── tmdb.ts          # TMDB API client (search, details, trailers, providers)
├── types/
│   └── movie.ts         # Shared movie/streaming/trailer types
├── app/                 # Next.js App Router pages & API routes
├── components/          # UI components (poster cards, shader backgrounds, etc.)
└── ...
```

## Known Issues / In Progress

- Intermittent TLS/connection resets on Windows dev environments when calling TMDB and Groq — mitigated with retry-with-backoff and IPv4-first DNS resolution in `lib/tmdb.ts`
- Occasional TMDB 403s under investigation

## License

TBD
