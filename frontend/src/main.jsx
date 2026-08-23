import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { SchemesSearchProvider } from "./context/SchemesSearchContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
            <BrowserRouter>
      <AuthProvider>
        <SchemesSearchProvider>
          <App />
        </SchemesSearchProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);