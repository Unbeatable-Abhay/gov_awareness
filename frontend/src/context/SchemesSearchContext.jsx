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
  const [status, setStatus] = useState(persisted?.schemes?.length ? "ready" : "idle");
  // Not persisted to sessionStorage on purpose — this survives tab
  // switches (Context stays mounted across client-side navigation), but a
  // real page reload should abandon a dead in-flight request rather than
  // showing a stale timer for work that no longer exists.
  const [searchStartedAt, setSearchStartedAt] = useState(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ query, schemes }));
    } catch {
      // sessionStorage can fail (private browsing, quota) — search still
      // works via in-memory state, it just won't survive a full reload.
    }
  }, [query, schemes]);

  const value = {
    query, setQuery,
    schemes, setSchemes,
    status, setStatus,
    searchStartedAt, setSearchStartedAt,
  };

  return <SchemesSearchContext.Provider value={value}>{children}</SchemesSearchContext.Provider>;
}

function useSchemesSearch() {
  const ctx = useContext(SchemesSearchContext);
  if (!ctx) throw new Error("useSchemesSearch must be used within SchemesSearchProvider");
  return ctx;
}

export { SchemesSearchProvider, useSchemesSearch };