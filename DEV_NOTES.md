React DevTools

- Install the official React Developer Tools browser extension (Edge/Chrome): https://reactjs.org/link/react-devtools
- After installing, open DevTools -> Components tab to inspect props/state and the component tree.

React Router future flag warnings

- The warnings you see are informational about v7 behavior changes (e.g., `v7_startTransition`, `v7_relativeSplatPath`). They don't break v6 apps.
- To opt-in early or learn more, see the React Router upgrade/future docs: https://reactrouter.com/v6/upgrading/future

Troubleshooting `/api/auth/login` 401 (UNAUTHORIZED)

- A 401 means the backend rejected the credentials. Typical causes:
  - You haven't registered an account yet (use the Signup form first).
  - Credentials were mistyped or password is incorrect.
  - Backend DB isn't running or the users collection is empty.

- Quick checks:
  - Use the Signup modal in the app to create a test account and then log in.
  - If you run the backend locally, enable the debug endpoint by setting `ALLOW_DEBUG=true` in the environment, then GET `/api/debug/users` to list users (debug endpoints are disabled by default).
  - Check backend logs for more details (server prints exceptions to stderr).

- The backend includes a dev-only seed endpoint when `ALLOW_DEBUG=true`:
  - `POST /api/debug/seed_user` with JSON `{ "email": "dev@example.com", "password": "password123" }` will create a test user (returns 201 on creation or 200 if already exists).
  - Use `ALLOW_DEBUG=true` in your environment (only enable locally).

Spotify redirect URI and logout notes

- Ensure your Spotify App's Redirect URI matches `SPOTIFY_REDIRECT_URI` in your `.env` exactly.
  - For local development, set `SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/callback` (or `http://localhost:5000/callback`) in `.env` and in the Spotify Developer Dashboard.
- We added a server logout endpoint to clear server-side Spotify tokens: `POST /api/auth/logout`.
  - The frontend `logout()` now calls this endpoint before clearing local state so you can login again reliably after logout.

- Recommendations now use the Spotify API when you have connected Spotify and a session token is available. The backend will use your selected `language` (and `region`) to bias seed genres and request Spotify recommendations; otherwise the app falls back to the built-in mock library.

Dashboard integration

- On the **Dashboard** you can now select a **language** and **emotion**, then click **Get Songs** to fetch recommendations tuned to that language. If your Spotify account is connected (via the **Connect Spotify** button), the app will request Spotify recommendations using your session token and the chosen language/region; otherwise it will return the local placeholder list.

AI parameter generator

- New endpoint: `POST /api/ai/generate_params` — send `{ emotion, language, extra_info }`. The endpoint returns a JSON object with the fixed template:
  - `emotion`, `language`, `market`, `seed_genres`, `seed_artists_description`, `extra_keywords`.
- If `OPENAI_API_KEY` is set, the backend will call OpenAI and attempt to parse JSON from the assistant reply. Otherwise it returns a deterministic fallback mapping.
- On the Dashboard you can now enter extra info, click **Generate Params**, inspect the returned JSON, and click **Use Generated Params** to fetch Spotify-based recommendations using those seeds.

If you'd like, I can implement a small dev-seed route (disabled by default) and wire up clearer UI messaging to guide users to sign up before logging in.