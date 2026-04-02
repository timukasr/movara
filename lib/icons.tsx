import Svg, { Path } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  fill?: boolean;
};

type SimpleIconProps = Omit<IconProps, "fill">;

export function SettingsIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
        fill={color}
      />
    </Svg>
  );
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21.81 12.23c0-.72-.06-1.24-.19-1.79H12v3.56h5.65c-.11.88-.7 2.2-2.01 3.09l-.02.12 2.85 2.16.2.02c1.87-1.69 2.95-4.17 2.95-7.16Z"
        fill="#4285F4"
      />
      <Path
        d="M12 22c2.76 0 5.07-.89 6.76-2.42l-3.22-2.48c-.86.59-2.02 1-3.54 1-2.7 0-4.99-1.75-5.81-4.18l-.12.01-2.96 2.24-.04.11A10.24 10.24 0 0 0 12 22Z"
        fill="#34A853"
      />
      <Path
        d="M6.19 13.92A6.12 6.12 0 0 1 5.85 12c0-.67.12-1.31.33-1.92l-.01-.13-3-2.27-.1.05A9.8 9.8 0 0 0 2 12c0 1.55.38 3.01 1.07 4.27l3.12-2.35Z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.9c1.92 0 3.22.81 3.96 1.48l2.89-2.75C17.07 3.02 14.76 2 12 2a10.24 10.24 0 0 0-8.93 5.72l3.12 2.35C7.01 7.65 9.3 5.9 12 5.9Z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function AppleIcon({
  size = 20,
  color = "#f4eee7",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16.68 12.84c.03 3.25 2.85 4.34 2.88 4.36-.02.08-.45 1.51-1.47 2.99-.89 1.28-1.81 2.56-3.27 2.58-1.44.03-1.9-.83-3.55-.83-1.66 0-2.17.81-3.53.86-1.42.05-2.51-1.4-3.4-2.67C2.53 17.52 1.1 12.85 2.95 9.67c.92-1.58 2.57-2.58 4.36-2.61 1.36-.03 2.64.89 3.55.89.9 0 2.58-1.1 4.34-.94.74.03 2.82.29 4.16 2.19-.1.06-2.48 1.41-2.68 4.2ZM14.11 5.38C14.86 4.49 15.37 3.25 15.23 2c-1.09.04-2.42.72-3.2 1.61-.7.79-1.31 2.06-1.15 3.27 1.22.09 2.48-.61 3.23-1.5Z"
        fill={color}
      />
    </Svg>
  );
}

export function BackIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
        fill={color}
      />
    </Svg>
  );
}

// --- Activity icons ---

export function RunIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"
        fill={color}
      />
    </Svg>
  );
}

export function CycleIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1v-2c-1.4 0-2.5-.5-3.4-1.4L13.1 5.2c-.4-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 7.5c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 13v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"
        fill={color}
      />
    </Svg>
  );
}

export function SwimIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zm0-4.5c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zM8.67 12c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.12-.07.26-.15.41-.23L10.48 5C10.19 4.39 9.57 4 8.9 4H7.59c-.67 0-1.29.39-1.58 1l-2.56 5.12C3.18 10.6 3.6 11.2 4.09 11.2c.17 0 .34-.06.49-.17l2.74-2.03.72 3c-1.01.55-1.7.92-2.04 1.12-.46.27-1.07.64-2.18.64v2c1.11 0 1.73-.37 2.18-.64.37-.22.6-.36 1.15-.36zM16.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
        fill={color}
      />
    </Svg>
  );
}

export function HikeIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"
        fill={color}
      />
    </Svg>
  );
}

export function WeightIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
        fill={color}
      />
    </Svg>
  );
}

export function YogaIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"
        fill={color}
      />
    </Svg>
  );
}

export function ActivityIcon({ size = 24, color = "#fff" }: SimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"
        fill={color}
      />
    </Svg>
  );
}

export function getActivityIcon(sportType: string) {
  const type = sportType.toLowerCase();
  if (type.includes("run")) return RunIcon;
  if (type.includes("ride") || type.includes("cycle")) return CycleIcon;
  if (type.includes("swim")) return SwimIcon;
  if (type.includes("walk") || type.includes("hike")) return HikeIcon;
  if (type.includes("yoga")) return YogaIcon;
  if (type.includes("weight") || type.includes("crossfit")) return WeightIcon;
  return ActivityIcon;
}

export function DashboardIcon({ size = 24, color = "#fff", fill }: IconProps) {
  return fill ? (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13 9V3h8v6h-8ZM3 13V3h8v10H3Zm10 8V11h8v10h-8ZM3 21v-6h8v6H3Z"
        fill={color}
      />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 13h8V3H3v10zm2-8h4v6H5V5zm8-2v6h8V3h-8zm6 4h-4V5h4v2zM3 21h8v-6H3v6zm2-4h4v2H5v-2zm8 4h8V11h-8v10zm2-8h4v6h-4v-6z"
        fill={color}
      />
    </Svg>
  );
}

export function TrophyIcon({ size = 24, color = "#fff", fill }: IconProps) {
  return fill ? (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z"
        fill={color}
      />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1zm-4 3.49C14.35 12.41 13.28 13 12 13s-2.35-.59-3-1.51V5h6v6.49z"
        fill={color}
      />
    </Svg>
  );
}

export function PersonIcon({ size = 24, color = "#fff", fill }: IconProps) {
  return fill ? (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}
