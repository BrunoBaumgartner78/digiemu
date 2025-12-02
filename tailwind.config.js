module.exports = {
  darkMode: "media", // <--- wichtig!
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryLight: "#3b82f6", // blau
        primaryDark: "#ef4444", // rot (dark mode)
      },
    },
  },
  plugins: [],
};
