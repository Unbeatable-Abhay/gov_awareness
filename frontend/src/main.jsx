import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { SchemesSearchProvider } from "./context/SchemesSearchContext";
import { DirectorySearchProvider } from "./context/DirectorySearchContext";
import { LegalSearchProvider } from "./context/LegalSearchContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <BrowserRouter>
          <AuthProvider>
              <SchemesSearchProvider>
              <DirectorySearchProvider>
                  <LegalSearchProvider>
                      <App />
                  </LegalSearchProvider>
              </DirectorySearchProvider>
              </SchemesSearchProvider>
          </AuthProvider>
      </BrowserRouter>
  </StrictMode>
);