import { createContext, useContext, useState, useEffect } from "react";

const LegalSearchContext = createContext(null);
const STORAGE_KEY = "sarkarly:legalSearch";

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function LegalSearchProvider({ children }) {
  const persisted = loadPersisted();

  const [query, setQuery] = useState(persisted?.query ?? "");
  const [result, setResult] = useState(persisted?.result ?? null);
  // Never resume mid-request or mid-error on a fresh load — same reasoning
  // as SchemesSearchContext/DirectorySearchContext. If we have a real
  // result, show it; otherwise start idle.
  const [status, setStatus] = useState(persisted?.result ? "ready" : "idle");

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ query, result }));
    } catch {
      // sessionStorage can fail (private browsing, quota) — search still
      // works via in-memory state, it just won't survive a full reload.
    }
  }, [query, result]);

  const value = { query, setQuery, result, setResult, status, setStatus };

  return <LegalSearchContext.Provider value={value}>{children}</LegalSearchContext.Provider>;
}

function useLegalSearch() {
  const ctx = useContext(LegalSearchContext);
  if (!ctx) throw new Error("useLegalSearch must be used within LegalSearchProvider");
  return ctx;
}

export { LegalSearchProvider, useLegalSearch };