import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    // Keep a single React copy so Base UI and React Router share the same dispatcher.
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@base-ui/react/button",
      "@base-ui/react/combobox",
      "@base-ui/react/field",
      "@base-ui/react/input",
      "@base-ui/react/separator",
    ],
  },
});
