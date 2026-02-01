/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  // Keep Prettier defaults; Tailwind plugin needs the stylesheet entrypoint.
  tailwindStylesheet: "./app/globals.css",
};

export default config;
