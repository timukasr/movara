# movara

Hackathon starter built with Expo Router, Clerk auth, and Convex.

It is optimized for:

- fast web development
- Android testing
- minimal ceremony

## Stack

- Expo SDK 55
- Clerk Expo SDK with Google OAuth
- Convex for backend functions and realtime state

## Required env

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_STRAVA_CLIENT_ID=12345
```

Set the Clerk issuer domain on your Convex deployment:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
npx convex env set CLERK_SECRET_KEY your-clerk-secret-key
npx convex env set STRAVA_CLIENT_SECRET your-strava-client-secret
npx convex env set STRAVA_CLIENT_ID 12345
npx convex env set STRAVA_WEBHOOK_VERIFY_TOKEN your-random-verify-token
```

Use the Clerk frontend API / issuer domain format from the Clerk dashboard.
Set `CLERK_SECRET_KEY` on Convex because challenge member search uses Clerk's Backend API.
Set the Strava client secret on Convex because the token exchange happens server-side.
Keep `EXPO_PUBLIC_STRAVA_CLIENT_ID` in the Expo app env for the client flow, and set `STRAVA_CLIENT_ID` in Convex env for server-side token refreshes and webhook event fetches.

## First-time setup

1. Install dependencies.

```bash
npm install
```

2. Create or connect a Convex project.

```bash
npx convex dev
```

3. In the Clerk dashboard:

- enable Google as a social connection
- enable the Convex integration
- enable Native API
- add redirect URLs for local development, including your Expo callback URL

4. In the Strava API settings:

- create an API application at [developers.strava.com](https://developers.strava.com/)
- set the callback domain to `localhost` for local web development
- use `http://localhost:8081/strava/callback` as the web redirect during local dev
- use `movara://strava/callback` as the native redirect URI
- register the webhook by running the Convex internal action `strava:registerWebhookSubscription` in the dashboard

To register the Strava webhook from the Convex dashboard:

1. Open your deployment in the Convex dashboard.
2. Go to Functions and run the internal action `strava:registerWebhookSubscription`.
3. Use `{}` as the arguments.
4. Copy the returned `callbackUrl` if you want to confirm the endpoint that was registered.

That action deletes any existing Strava webhook subscriptions for the app, then creates a fresh one pointing at your Convex HTTP endpoint `/strava/webhook` using `STRAVA_WEBHOOK_VERIFY_TOKEN`.

5. Start the frontend.

```bash
npm run web
```

For Android:

```bash
npm run android
```

## Redirect URLs to add in Clerk

Use at least these during local development:

- `http://localhost:8081`
- `http://localhost:8081/continue`
- `movara://continue`

If Expo starts on a different port, add that exact localhost URL too.

For Strava local development, add:

- `http://localhost:8081/strava/callback`
- `movara://strava/callback`

## Convex auth config

The backend expects Clerk tokens with `applicationID: "convex"` via `convex/auth.config.ts`.

After changing auth config or backend functions, run:

```bash
npx convex dev
```

## Project shape

- `app/_layout.tsx`: Clerk + Convex providers
- `app/index.tsx`: protected home screen
- `app/sign-in/index.tsx`: native Google OAuth trigger
- `app/sign-in/index.web.tsx`: Clerk web sign-in screen
- `app/sign-in/sso-callback.web.tsx`: Clerk web OAuth callback route
- `app/continue.tsx`: OAuth callback safety net
- `app/strava/callback.tsx`: Strava OAuth callback route
- `convex/http.ts`: Strava webhook callback endpoint
- `convex/viewer.ts`: authenticated sample query
- `convex/strava.ts`: Strava queries and actions
- `convex/stravaModel.ts`: internal Strava persistence helpers
- `convex/schema.ts`: Strava tables and indexes

## Notes

- This repo is intentionally quick and dirty.
- There is no user table yet. The app reads Clerk identity directly.
- Strava tokens are stored against the Clerk `tokenIdentifier`, not a synced user table.
- `npx convex dev` will still generate `convex/_generated` once the project is connected to a real Convex deployment.
