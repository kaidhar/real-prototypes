/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - extracted from Sprouts ABM
        primary: {
          DEFAULT: "#1c64f2",
          hover: "#1a56db",
          light: "#3f83f8",
          bg: "#ebf5ff",
        },
        // Sidebar colors
        sidebar: {
          dark: "#0e2933",
          hover: "#263e47",
          active: "#3e545c",
          text: "#6e7f85",
          "text-hover": "#869499",
        },
        // Text colors
        text: {
          primary: "#191918",
          heading: "#111928",
          secondary: "#6b7280",
          muted: "#9ca3af",
          dark: "#4b5563",
        },
        // Background colors
        bg: {
          white: "#ffffff",
          "off-white": "#f6f6f5",
          gray: "#f9fafb",
          "table-header": "#f3f4f6",
          light: "#fbfafd",
          hover: "#f3f5f5",
        },
        // Border colors
        border: {
          DEFAULT: "#e7e7e6",
          light: "#e5e7eb",
          medium: "#e7eaeb",
          dark: "#d1d5db",
          muted: "#dbdfe0",
        },
        // Status colors
        status: {
          success: "#00913D",
          error: "#e02424",
          "error-dark": "#C81E1E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
