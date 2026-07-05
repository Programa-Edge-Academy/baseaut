const { chartColors } = require("./assets/theme");

/**
 * Themed tokens resolve to CSS variables declared in `app/global.css`, so
 * NativeWind utility classes (bg-level1, text-muted, border-outline, …) flip
 * between light and dark automatically. The `<alpha-value>` placeholder keeps
 * opacity modifiers (bg-primary/10, bg-black/60, shadow-primary/50) working.
 */
const themed = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./app-example/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: themed("primary"),
        secondary: themed("secondary"),
        extra: themed("extra"),
        error: themed("error"),
        level1: themed("level1"),
        level2: themed("level2"),
        outline: themed("outline"),
        muted: themed("muted"),
        placeholder: themed("placeholder"),
        content: themed("content"),
        "content-inverse": themed("content-inverse"),
        ...chartColors,
      },
    },
  },
  plugins: [],
};
