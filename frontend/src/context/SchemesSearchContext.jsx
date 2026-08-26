import { createContext, useContext, useState, useEffect } from "react";

const SchemesSearchContext = createContext(null);
const STORAGE_KEY = "sarkarly:schemesSearch";

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function SchemesSearchProvider({ children }) {
  const persisted = loadPersisted();

  const [query, setQuery] = useState(persisted?.query ?? "");
  const [schemes, setSchemes] = useState(persisted?.schemes ?? []);
  // Deliberately NOT persisting status as "loading"/"loadingMore" — a fresh
  // page load should never resume mid-request. If we had results, show them
  // as "ready" immediately; otherwise start idle.
  const [status, setStatus] = useState(persisted?.schemes?.length ? "ready" : "idle");

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ query, schemes }));
    } catch {
      // sessionStorage can fail (private browsing, quota) — search still
      // works via in-memory state, it just won't survive a full reload.
    }
  }, [query, schemes]);

  const value = { query, setQuery, schemes, setSchemes, status, setStatus };

  return <SchemesSearchContext.Provider value={value}>{children}</SchemesSearchContext.Provider>;
}

function useSchemesSearch() {
  const ctx = useContext(SchemesSearchContext);
  if (!ctx) throw new Error("useSchemesSearch must be used within SchemesSearchProvider");
  return ctx;
}

export { SchemesSearchProvider, useSchemesSearch };