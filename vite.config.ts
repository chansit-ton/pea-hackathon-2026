import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // เดิมเขียน `[react]` (ส่ง factory function แทน plugin) ทำให้ React Fast Refresh ไม่ทำงาน → HMR ต้อง restart
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
