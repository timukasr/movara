const XP_PER_KILOMETER_BY_ACTIVITY_TYPE = {
  Ride: 300,
  Run: 1000,
  Swim: 4000,
} as const;

const XP_DISPLAY_SCALE = 100;

export function calculateActivityXp(args: {
  type: string;
  distanceMeters: number;
}) {
  const xpPerKilometer =
    XP_PER_KILOMETER_BY_ACTIVITY_TYPE[
      args.type as keyof typeof XP_PER_KILOMETER_BY_ACTIVITY_TYPE
    ];

  if (xpPerKilometer === undefined) {
    return undefined;
  }

  return Math.round((args.distanceMeters * xpPerKilometer) / 1000);
}

export function formatXp(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return String(Math.floor(value / XP_DISPLAY_SCALE));
}

export function scaleDisplayedXp(value: number) {
  return Math.round(value * XP_DISPLAY_SCALE);
}
