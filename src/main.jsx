import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { LangProvider } from "./context/LangContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <App />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  </BrowserRouter>
);
