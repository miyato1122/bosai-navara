import { defineConfig } from "vite";

const repoName = "bosai-navara";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? `/${repoName}/` : "/",
});
