import type { Config } from "tailwindcss";

const cssColor = (name: string) => `rgb(from var(--${name}) r g b / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: cssColor("background"),
        foreground: cssColor("foreground"),
        muted: cssColor("surface-secondary"),
        "muted-foreground": cssColor("muted-foreground"),
        border: cssColor("border"),
        primary: cssColor("primary"),
        "primary-foreground": cssColor("primary-foreground"),
        accent: cssColor("accent"),
        "accent-foreground": cssColor("accent-foreground"),
        destructive: cssColor("danger")
      }
    }
  },
  plugins: []
};

export default config;
