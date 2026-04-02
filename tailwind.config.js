/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary
        "primary": "#ff9066",
        "primary-dim": "#ff743b",
        "primary-fixed": "#ff7943",
        "primary-fixed-dim": "#f76526",
        "primary-container": "#ff7943",
        "on-primary": "#571a00",
        "on-primary-container": "#441200",
        "on-primary-fixed": "#000000",

        // Secondary
        "secondary": "#ccdff6",
        "secondary-dim": "#bed1e7",
        "secondary-container": "#36485b",
        "secondary-fixed": "#ccdff6",
        "on-secondary": "#3e5063",
        "on-secondary-container": "#bfd2e9",

        // Tertiary
        "tertiary": "#ffe792",
        "tertiary-dim": "#efc900",
        "tertiary-container": "#ffd709",
        "on-tertiary": "#655400",
        "on-tertiary-container": "#5b4b00",

        // Error
        "error": "#ff716c",
        "error-dim": "#d7383b",
        "error-container": "#9f0519",
        "on-error": "#490006",
        "on-error-container": "#ffa8a3",

        // Surfaces
        "background": "#240304",
        "on-background": "#ffdedc",
        "surface": "#240304",
        "surface-dim": "#240304",
        "surface-bright": "#521819",
        "surface-tint": "#ff9066",
        "surface-variant": "#491314",
        "surface-container-lowest": "#000000",
        "surface-container-low": "#2c0506",
        "surface-container": "#36090b",
        "surface-container-high": "#3f0e0f",
        "surface-container-highest": "#491314",

        // On-surface (text on dark backgrounds)
        "on-surface": "#ffdedc",
        "on-surface-variant": "#dd9a97",

        // Outlines
        "outline": "#a16663",
        "outline-variant": "#6c3938",

        // Inverse
        "inverse-surface": "#fff8f7",
        "inverse-on-surface": "#7c4644",
        "inverse-primary": "#a93900",

        // App-specific
        "strava": "#FC4C02",
        "success": "#7ef5c5",
      },
    },
  },
  plugins: [],
};
