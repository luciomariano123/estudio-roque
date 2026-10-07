/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        principios: { DEFAULT: "#0f766e", soft: "#ccfbf1" },
        marco: { DEFAULT: "#4338ca", soft: "#e0e7ff" },
        proceso: { DEFAULT: "#b45309", soft: "#fef3c7" },
      },
    },
  },
  plugins: [],
};
