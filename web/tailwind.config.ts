import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        "regal-blue": "#243c5a",
        coral: "#F88379",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        pacifico: ["Pacifico", ...fontFamily.sans],
      },
      backgroundImage: {
        "app-bg-image": "url('/accountabilibuddies.png')",
      },
    },
  },
  plugins: [],
} satisfies Config;
