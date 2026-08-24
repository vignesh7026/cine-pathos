# Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide walks you through deploying **Mood Movies** with Vercel serving the frontend UI and Render hosting the persistent backend service.

---

## 🏗 Architecture Overview

- **Frontend (Vercel)**: Serves static UI pages & client components. Rewrites requests starting with `/api/*` directly to the Render backend service.
- **Backend (Render)**: Runs the Next.js server instance (`npm start`) handling AI recommendations, TMDB proxying, user profiles, and persistent storage (`data/users.json` & `data/profiles.json`).

---

## Step 1: Push Code to GitHub

Ensure your project is pushed to a GitHub repository:

```bash
git add .
git commit -m "Configure Vercel + Render dual deployment"
git push origin main
```

---

## Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service parameters:
   - **Name**: `mood-movies-backend` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (or starter)
4. Add the following **Environment Variables**:
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
   - `TMDB_API_KEY`: Your TMDB v3 API key
   - `NEXTAUTH_SECRET`: A long secret random string (e.g. `openssl rand -hex 32`)
   - `NEXTAUTH_URL`: `https://<your-vercel-app-domain>.vercel.app` (update after Vercel deployment)
5. Click **Create Web Service**.
6. Once deployed, copy your Render Web Service URL (e.g. `https://mood-movies-backend.onrender.com`).

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
2. Select **Framework Preset**: `Next.js`.
3. In **Environment Variables**, add:
   - `RENDER_BACKEND_URL`: `https://mood-movies-backend.onrender.com` *(Use your exact Render URL from Step 2)*
   - `NEXTAUTH_SECRET`: Same secret key used on Render
   - `NEXTAUTH_URL`: `https://<your-vercel-app-name>.vercel.app`
   - `GROQ_API_KEY`: *(Optional on Vercel as calls proxy to Render)*
   - `TMDB_API_KEY`: *(Optional on Vercel as calls proxy to Render)*
4. Click **Deploy**.
5. Copy your assigned Vercel URL (e.g. `https://mood-movies.vercel.app`).

---

## Step 4: Final Verification

1. Go back to Render -> **Environment Variables** for your service and set:
   - `NEXTAUTH_URL` = `https://<your-vercel-app-name>.vercel.app`
2. Open your Vercel URL in a browser.
3. Test signing up, creating a profile, and submitting a mood prompt to verify recommendations and data persistence!
