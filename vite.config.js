import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // This line allows access from other devices
    port: 5173, // Or whatever port your Vite app uses
  },
});
