/*******************
 * @type {import('tailwindcss').Config}
 *******************/
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(240 5.9% 90%)",
        input: "hsl(240 5.9% 90%)",
        ring: "#6366f1",
        background: "#EFEEE0",
        foreground: "#111827",
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#f3f4f6",
          foreground: "#111827"
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280"
        },
        accent: {
          DEFAULT: "#f3f4f6",
          foreground: "#111827"
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff"
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
};
