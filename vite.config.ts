import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "charts",
              test: /node_modules\/(recharts|d3-|victory|decimal|react-smooth)/,
            },
          ],
        },
      },
    },
  },
});
