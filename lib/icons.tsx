import Svg, { Path } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  fill?: boolean;
};

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
