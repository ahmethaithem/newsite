import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "Tahoma", "sans-serif"]
      },
      colors: {
        ink: "#171514",
        dune: "#f5f0e8",
        clay: "#b86f52",
        olive: "#63705d",
        linen: "#fbf8f2"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 21, 20, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
