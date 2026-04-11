# Supply Tracking Web

Angular 17 application for operators and admins: dashboard, products, production lots, traceability events, authentication, and public consumer trace pages (QR).

## Prerequisites

- Node.js 20+ (recommended)
- npm
- The API running locally (default `http://localhost:3000`) when using `ng serve` with the bundled proxy

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server (development build, proxy to the API):

   ```bash
   npm start
   ```

   The app is served at `http://localhost:4200` by default. HTTP calls use a relative base (`/api/v0`, see `src/environments/environment.ts`); `proxy.conf.json` forwards `/api` to `http://localhost:3000`.

3. Ensure the API is up and reachable (same machine: start the API from the `../api` project with `npm run start:dev`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | `ng serve` — dev server with proxy |
| `npm run build` | Production build (output in `dist/supply-tracking-web`) |
| `npm run watch` | Development build in watch mode |
| `npm test` | Karma / Jasmine unit tests |

## Configuration

### Development (`environment.ts`)

- `apiBase`: `/api/v0` — relative path so the dev server proxy can reach the Nest API.

### Production (`environment.prod.ts`)

- `production`: `true`
- `apiBase`: `/api/v0` — same path; your reverse proxy should forward `/api` to the API host.

Production builds use `fileReplacements` in `angular.json` to swap in `environment.prod.ts`.

If the API is mounted under a different prefix or version, update `apiBase` in both environment files and align `API_PREFIX` / `API_VERSION` on the server.

## i18n

Translations live under `src/assets/i18n/` (for example `en.json`, `es.json`). The app uses Transloco.

## Project layout

- `src/app/core/` — HTTP interceptors, shared models, core services
- `src/app/features/` — Feature areas (auth, dashboard, products, lots, traceability, public trace, users)
- `src/app/shared/` — Reusable components
- `src/environments/` — Build-time configuration
- `proxy.conf.json` — Dev-only proxy from `/api` to the Nest server

## Building for deployment

```bash
npm run build
```

Serve the contents of `dist/supply-tracking-web` from a static host or CDN. Configure the host so that requests to `/api/v0/...` are proxied to your Nest API (same origin avoids CORS issues for browser calls).

## Linting and formatting

Use the Angular CLI and your editor integration for TypeScript and template checks; project-specific ESLint rules may live at the monorepo root if configured there.
