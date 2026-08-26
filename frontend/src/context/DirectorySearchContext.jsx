import { createContext, useContext, useState, useEffect } from "react";

const DirectorySearchContext = createContext(null);
const STORAGE_KEY = "sarkarly:directorySearch";

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function DirectorySearchProvider({ children }) {
  const persisted = loadPersisted();

  const [profession, setProfession] = useState(persisted?.profession ?? "Farmer");
  const [stateName, setStateName] = useState(persisted?.stateName ?? "All States");
  const [schemes, setSchemes] = useState(persisted?.schemes ?? []);
  const [hasSearched, setHasSearched] = useState(persisted?.hasSearched ?? false);
  // Same reasoning as SchemesSearchContext — never resume mid-request.
  const [status, setStatus] = useState(persisted?.schemes?.length ? "ready" : "idle");

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profession, stateName, schemes, hasSearched })
      );
    } catch {
      // See SchemesSearchContext — fails silently, just won't survive reload.
    }
  }, [profession, stateName, schemes, hasSearched]);

  const value = {
    profession, setProfession,
    stateName, setStateName,
    schemes, setSchemes,
    status, setStatus,
    hasSearched, setHasSearched,
  };

  return <DirectorySearchContext.Provider value={value}>{children}</DirectorySearchContext.Provider>;
}

function useDirectorySearch() {
  const ctx = useContext(DirectorySearchContext);
  if (!ctx) throw new Error("useDirectorySearch must be used within DirectorySearchProvider");
  return ctx;
}

export { DirectorySearchProvider, useDirectorySearch };