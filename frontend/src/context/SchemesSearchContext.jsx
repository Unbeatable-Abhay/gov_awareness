import { createContext, useContext, useState } from "react";

const SchemesSearchContext = createContext(null);

function SchemesSearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const [schemes, setSchemes] = useState([]);
  const [status, setStatus] = useState("idle");

  const value = { query, setQuery, schemes, setSchemes, status, setStatus };

  return <SchemesSearchContext.Provider value={value}>{children}</SchemesSearchContext.Provider>;
}

function useSchemesSearch() {
  const ctx = useContext(SchemesSearchContext);
  if (!ctx) throw new Error("useSchemesSearch must be used within SchemesSearchProvider");
  return ctx;
}

export { SchemesSearchProvider, useSchemesSearch };