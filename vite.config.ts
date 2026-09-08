import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]?.trim() && value.trim()) {
      process.env[key] = value;
    }
  }

  return {
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
      // Pre-bundle these on cold start too. Otherwise Vite discovers them
      // lazily on the first real page request and forces a full-page
      // reload mid-session once optimization finishes, which flakes e2e
      // tests that happen to be interacting with the page at that moment.
      "@emotion/react",
      "@emotion/cache",
      "@mui/material",
      "@mui/material/styles",
      "@mui/material/Table",
      "@mui/material/TableBody",
      "@mui/material/TableCell",
      "@mui/material/TableContainer",
      "@mui/material/TableHead",
      "@mui/material/TablePagination",
      "@mui/material/TableRow",
      "motion/react",
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "@mui/material/Alert",
      "@mui/x-date-pickers/LocalizationProvider",
      "@mui/x-date-pickers/AdapterDayjs",
      "@mui/x-date-pickers/DatePicker",
      "@mui/x-date-pickers/TimePicker",
      "dayjs",
      "dayjs/plugin/customParseFormat",
      "dayjs/plugin/timezone",
      "dayjs/plugin/utc",
    ],
  },
  };
});
