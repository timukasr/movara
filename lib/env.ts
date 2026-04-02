function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  }

  return value;
}

function optionalEnv(name: string) {
  return process.env[name] ?? null;
}

export const env = {
  clerkPublishableKey: requireEnv("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  convexUrl: requireEnv("EXPO_PUBLIC_CONVEX_URL"),
  stravaClientId: optionalEnv("EXPO_PUBLIC_STRAVA_CLIENT_ID"),
};
