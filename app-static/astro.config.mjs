import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://easyhunt.in",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },
});
