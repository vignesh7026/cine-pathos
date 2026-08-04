# MoodMovies 🎬

An agentic AI web app that recommends movies based on how you're feeling. Type in your mood ("feeling low, want something feel-good") and an LLM-driven agent figures out what to search for, finds matching movies, and shows trailers + where to stream them.

## How it works

1. User describes their mood in plain text.
2. Claude (via the Anthropic API) acts as an **agent** — it decides which tools to call (search movies, ask a clarifying question, etc.) rather than following a hardcoded pipeline.
3. The agent calls TMDB's API to search for movies matching the inferred genres/keywords/tone.
4. Results are shown as cards. Each card can lazy-load a YouTube trailer and streaming availability (Netflix, Prime, etc.) on demand.
5. If the agent decides the mood is ambiguous, it can pause and ask a clarifying question before searching.

## Tech stack

- **Frontend**: Next.js (React) + Tailwind
- **AI**: Gemini API (gemini-2.5-pro) with function calling
- **Movie data**: TMDB (The Movie Database) API
- **Trailers**: YouTube embeds via TMDB's `/videos` endpoint
- **Streaming links**: TMDB's `/watch/providers` endpoint

## Project structure

```
mood-movies/
├── app/
│   ├── page.tsx                 # Landing page — mood input UI
│   ├── api/
│   │   ├── recommend/route.ts   # Main agent loop endpoint
│   │   └── movie/[id]/
│   │       ├── trailer/route.ts
│   │       └── providers/route.ts
├── components/
│   ├── MoodInput.tsx
│   ├── MovieCard.tsx
│   ├── MovieGrid.tsx
│   └── ClarifyingQuestion.tsx
├── lib/
│   ├── gemini.ts                  # Gemini API wrapper + tool/function definitions
│   ├── tmdb.ts                    # TMDB API wrapper
│   ├── tools.ts                    # executeTool() dispatcher
│   └── agentLoop.ts                 # Agent chat-session loop
├── types/
│   └── movie.ts
├── .env.example
└── README.md
```

## How the agent works (core concept)

Unlike a fixed pipeline (`parse mood → call API → return results`), this app defines a set of **tools** and lets Claude decide the sequence:

- `search_movies(genres, keywords, min_rating)` — query TMDB
- `check_streaming_availability(movie_id, region)` — check where a movie can be watched
- `get_trailer(movie_id)` — fetch YouTube trailer
- `ask_clarifying_question(question)` — pause and ask the user for more detail

Gemini loops through these tools, evaluating results, retrying with different parameters if a search comes back empty, and only stops once it has a good final answer. This is what makes it an **agentic AI system** rather than a single LLM API call wrapped in an app.

## Setup

### 1. Clone and install
```bash
git clone <your-repo-url>
cd mood-movies
npm install
```

### 2. Get API keys
- **Gemini API key**: https://aistudio.google.com/apikey (free tier available)
- **TMDB API key**: https://www.themoviedb.org/settings/api (free)

### 3. Environment variables
Create `.env.local`:
```
GEMINI_API_KEY=your_key_here
TMDB_API_KEY=your_key_here
```

### 4. Run locally
```bash
npm run dev
```
Visit `http://localhost:3000`

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/recommend` | POST | Runs the agent loop; takes `{ message, conversationHistory }`, returns movie recommendations or a clarifying question |
| `/api/movie/[id]/trailer` | GET | Returns YouTube trailer key for a movie |
| `/api/movie/[id]/providers` | GET | Returns streaming providers (flatrate/rent/buy) for a movie, by region |

## Features

- ✅ Free-text mood input, no dropdowns/categories required
- ✅ LLM-driven tool selection (agentic, not hardcoded pipeline)
- ✅ Clarifying questions for ambiguous input
- ✅ Trailer previews (YouTube embed)
- ✅ Streaming availability by region
- ✅ Lazy-loaded extras (trailer/providers only fetched on click, keeps initial search fast)

## Roadmap / future improvements

- [ ] Mood history — remember past recommendations per user
- [ ] Feedback loop — "this didn't fit" → agent retries with adjusted parameters
- [ ] Multi-turn conversation UI for clarifying questions
- [ ] Caching TMDB genre/keyword lookups to reduce API calls
- [ ] User accounts + saved watchlist

## Domain

This project sits at the intersection of:
- **Affective computing** (emotion-aware input)
- **Recommender systems** (content-based filtering)
- **Agentic AI / LLM application development** (tool-use driven orchestration)

## License

MIT
