function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  }

  return value;
}

export const env = {
  clerkPublishableKey: requireEnv("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  convexUrl: requireEnv("EXPO_PUBLIC_CONVEX_URL"),
};
