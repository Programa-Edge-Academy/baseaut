/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app-example/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0E89E5',
        secondary: '#25C125',
        extra: '#F0BD02',
        error: '#BE2223',
        level1: '#14181F',
        level2: '#1B1F27',
        outline: '#2B303B',
        verbal: '#09CDDB',
        example: '#DBBF09',
        physical: '#DC0886',
      },
    },
  },
  plugins: [],
};
