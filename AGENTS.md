# AGENTS.md

## About project

Movara — from “move”, representing motion, progress, and momentum.
Movara is a social fitness app where friends create group challenges, track activities, and work toward shared goals together. It connects to services like Strava or Apple Health to sync workouts, converts them into progress toward a target, and shows standings through simple leaderboards. The focus is on staying active together—turning individual movement into collective motivation.

## Repo intent

This is a hackathon Expo app. Prefer shipping fast over building abstractions.

## Core stack

- Expo Router in `app/`
- Clerk for authentication
- Convex for backend functions and auth-aware data access

## Formatting

After changing code, run `npx prettier --write` on the modified files to ensure consistent formatting. The project uses Prettier with import sorting (`@ianvs/prettier-plugin-sort-imports`) and Tailwind class sorting (`prettier-plugin-tailwindcss`).

## Rules for agents

- Keep the app simple and web-first, with Android as the main device target.
- Do not introduce a user sync table unless the task explicitly needs one.
- Prefer editing existing screens over adding extra layers of routing or state management.
- Keep styles inline or close to the screen unless reuse is obvious.
- Use Clerk identity directly when possible.
- After backend auth changes, run `npx convex dev` so Convex syncs config and regenerates `_generated`.

## Important files

- `app/_layout.tsx`
- `app/index.tsx`
- `app/sign-in/index.tsx`
- `app/sign-in/index.web.tsx`
- `app/sign-in/sso-callback.web.tsx`
- `app/continue.tsx`
- `convex/auth.config.ts`
- `convex/viewer.ts`
- `.env.example`

## Local commands

```bash
npm install
npx convex dev
npm run web
npm run android
```

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
