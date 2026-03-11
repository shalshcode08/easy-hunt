import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://easyhunt.space",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },
});
