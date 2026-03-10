import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d10",
        night: "#0f131a",
        steel: "#141b26",
        frost: "#e6f0ff",
        ember: "#ff7a59",
        neon: "#59f0c6",
        gold: "#f7c66a"
      },
      boxShadow: {
        glow: "0 0 40px rgba(89, 240, 198, 0.25)",
        ember: "0 0 32px rgba(255, 122, 89, 0.25)"
      }
    }
  },
  plugins: []
} satisfies Config;
