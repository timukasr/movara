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
```

Set the Clerk issuer domain on your Convex deployment:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
```

Use the Clerk frontend API / issuer domain format from the Clerk dashboard.

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

4. Start the frontend.

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
- `convex/viewer.ts`: authenticated sample query

## Notes

- This repo is intentionally quick and dirty.
- There is no user table yet. The app reads Clerk identity directly.
- `npx convex dev` will still generate `convex/_generated` once the project is connected to a real Convex deployment.
