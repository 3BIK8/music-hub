# Music Hub

A personal music library with a React client and a Node/Express API backed by MongoDB. The API currently runs audio extraction in-process and uploads audio to Cloudinary; the local storage adapter is not connected to import or playback yet.

## Requirements

- Node.js 20 and npm.
- Python 3 available as `python` on `PATH`. The existing `youtube-dl-exec` dependency checks for Python during `npm ci`.
- A MongoDB instance for API data.
- For YouTube audio extraction, the `yt-dlp` executable must be available on `PATH`.
- API credentials for YouTube, Cloudinary, and Spotify features, as needed.

## Setup

From the repository root, install both package trees:

```text
npm ci
npm --prefix client ci
```

Create local environment files from the examples. In PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

In Git Bash or Linux:

```sh
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Replace placeholder values with local credentials. `.env` files are ignored by Git. The server loads `server/.env` relative to `server/server.js`, so its configuration works regardless of the current directory.

## Environment variables

| Variable | File | Purpose |
| --- | --- | --- |
| `MONGO_URI` | `server/.env` | MongoDB connection string. |
| `PORT` | `server/.env` | Express listening port. |
| `YOUTUBE_API_KEY` | `server/.env` | YouTube Data API metadata lookup. |
| `CLOUDINARY_CLOUD_NAME` | `server/.env` | Cloudinary account name for current audio uploads. |
| `CLOUDINARY_API_KEY` | `server/.env` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | `server/.env` | Cloudinary API secret. |
| `SPOTIFY_CLIENT_ID` | `server/.env` | Spotify API client ID. |
| `SPOTIFY_CLIENT_SECRET` | `server/.env` | Spotify API client secret. |
| `AUDIO_DIR` | `server/.env` | Local storage adapter directory; relative paths are resolved from the server directory. The adapter is not wired into routes yet. |
| `CLIENT_ORIGIN` | `server/.env` | Reserved for a future CORS origin setting; currently unused. |
| `API_TOKEN` | `server/.env` | Reserved for future API authentication; currently unused. |
| `REACT_APP_API_URL` | `client/.env` | API base URL. Defaults to `http://localhost:5000/api` in development; set this for other environments. |
| `NODE_ENV` | managed by Create React App | Create React App sets this to `development`, `production`, or `test`; do not set it manually. |

## Run the apps

Start MongoDB and configure `server/.env`, then run the API from the repository root:

```text
npm start
```

For automatic server restarts during development:

```text
npm run dev
```

The server can also be started from `server/` with `node server.js`.

In another terminal, start the client:

```text
npm --prefix client start
```

The client development server runs on port 3000 by default. The API runs on the port configured by `PORT`.

## Checks and builds

Run from the repository root:

```text
npm run check
npm test
npm run build
```

`npm run check` runs `node --check` on every JavaScript file under `server/`. `npm test` runs the server tests with Node's built-in test runner. The production build delegates to Create React App in `client/`.

To run the client test runner non-interactively (the repository currently has no client test files):

```text
npm --prefix client test -- --watchAll=false --passWithNoTests
```

## Folder layout

```text
client/                 React application, public assets, and client tests
server/                 Express entry point, routes, models, services, and server tests
scripts/                Root project checks
.github/workflows/      Continuous integration
shared/                 Shared code
temp-audio/             Local audio workspace
```
