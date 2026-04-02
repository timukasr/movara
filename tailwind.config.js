/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B2C",
        secondary: "#2C3E50",
        tertiary: "#FFD700",
        neutral: "#A36765",
        bg: {
          DEFAULT: "#1A0A0A",
          card: "#2A1210",
          "card-border": "#3D1F1C",
          elevated: "#331916",
        },
        text: {
          DEFAULT: "#F5E6E0",
          muted: "#C4A69E",
          hint: "#8B6B63",
        },
        strava: "#FC4C02",
        success: "#7ef5c5",
        error: "#FF9EB0",
      },
    },
  },
  plugins: [],
};
