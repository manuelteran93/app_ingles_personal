/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#58CC02",
          blue: "#1CB0F6",
          yellow: "#FFC800",
          purple: "#CE82FF",
          surface: "#F7F7F7",
          dark: "#16202A",
        },
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.08)",
        card: "0 10px 24px rgba(15, 23, 42, 0.12)",
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        flame: "flame 1.3s ease-in-out infinite",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
        "badge-pop": "badgePop 0.55s ease-out",
        "slide-in-right": "slideInRight 0.35s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        flame: {
          "0%, 100%": { transform: "scale(1) rotate(-2deg)" },
          "50%": { transform: "scale(1.08) rotate(2deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "1" },
        },
        badgePop: {
          "0%": { transform: "scale(0.8)" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(24px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
