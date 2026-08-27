import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchDirectory } from "../api/schemes";
import { useAuth } from "../auth/AuthContext";
import { useDirectorySearch } from "../context/DirectorySearchContext";
import SchemeCard from "../components/SchemeCard";
import AuthGateModal from "../components/AuthGateModal";
import BottomNav from "../components/BottomNav";
import SelectDropdown from "../components/SelectDropdown";
import RetryCountdown from "../components/RetryCountdown";
import SearchingIndicator from "../components/SearchingIndicator";

const ALL_STATES = "All States";
const ALL_PROFESSIONS = "All Professions";

const STATE_OPTIONS = [
  { value: ALL_STATES, label: "All States (central schemes)" },
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
  { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Haryana", label: "Haryana" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" },
  { value: "Mizoram", label: "Mizoram" },
  { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" },
  { value: "Punjab", label: "Punjab" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Uttarakhand", label: "Uttarakhand" },
  { value: "West Bengal", label: "West Bengal" },
  { value: "Delhi", label: "Delhi (NCT)" },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
  { value: "Puducherry", label: "Puducherry" },
  { value: "Chandigarh", label: "Chandigarh" },
];

const PROFESSION_OPTIONS = [
  { value: ALL_PROFESSIONS, label: "All Professions", queryPhrase: "" },
  { value: "Farmer", label: "Farmer", queryPhrase: "farmers" },
  { value: "Student", label: "Student", queryPhrase: "students" },
  { value: "Self-employed", label: "Self-employed", queryPhrase: "self-employed individuals" },
  { value: "Salaried employee", label: "Salaried employee", queryPhrase: "salaried employees" },
  { value: "Unemployed", label: "Unemployed", queryPhrase: "unemployed individuals" },
  { value: "Senior citizen", label: "Senior citizen", queryPhrase: "senior citizens" },
  { value: "Homemaker", label: "Homemaker", queryPhrase: "homemakers" },
  { value: "Fisherman", label: "Fisherman", queryPhrase: "fishermen" },
  { value: "Artisan / Craftsperson", label: "Artisan / Craftsperson", queryPhrase: "artisans and craftspersons" },
];

function buildDirectoryQuery(profession, stateName) {
  const parts = ["Government schemes"];

  if (profession !== ALL_PROFESSIONS) {
    const option = PROFESSION_OPTIONS.find((o) => o.value === profession);
    parts.push(`for ${option?.queryPhrase || profession.toLowerCase()}`);
  }

  if (stateName === ALL_STATES) {
    parts.push("(central government schemes available across all of India)");
  } else {
    parts.push(`available specifically in ${stateName}`);
  }

  return parts.join(" ");
}

function DirectoryPage() {
  const {
    profession, setProfession,
    stateName, setStateName,
    schemes, setSchemes,
    status, setStatus,
    hasSearched, setHasSearched,
    searchStartedAt, setSearchStartedAt,
  } = useDirectorySearch();
  const [showGate, setShowGate] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retrySeconds, setRetrySeconds] = useState(null);
  const navigate = useNavigate();
  const { user, hasConsent } = useAuth();

  async function handleSearch(e) {
    e?.preventDefault();
    const fullQuery = buildDirectoryQuery(profession, stateName);

    setStatus("loading");
    setSearchStartedAt(Date.now());
    setHasSearched(true);
    try {
      const data = await searchDirectory(fullQuery);
      setSchemes(data.schemes || []);
      setStatus("ready");
    } catch (err) {
      if (err.status === 429) {
        setErrorMessage("You've reached the limit for browsing the directory right now.");
        setRetrySeconds(err.retryAfterSeconds || null);
      } else {
        setErrorMessage("Couldn't load the directory right now. Please try again.");
        setRetrySeconds(null);
      }
      setStatus("error");
    }
  }

  async function handleLoadMore() {
    setStatus("loadingMore");
    try {
      const excludeNames = schemes.map((s) => s.scheme_name);
      const fullQuery = buildDirectoryQuery(profession, stateName);
      const data = await searchDirectory(fullQuery, excludeNames);
      setSchemes((prev) => [...prev, ...(data.schemes || [])]);
      setStatus("ready");
    } catch {
      setStatus("ready");
    }
  }

  function handleSchemeClick(schemeName) {
    if (!user || !hasConsent) {
      setShowGate(true);
      return;
    }
    navigate(`/schemes/scheme/${encodeURIComponent(schemeName)}`);
  }

  function broadenToAllStates() {
    setStateName(ALL_STATES);
  }

  function broadenToAllProfessions() {
    setProfession(ALL_PROFESSIONS);
  }

  const canBroadenState = stateName !== ALL_STATES;
  const canBroadenProfession = profession !== ALL_PROFESSIONS;

  return (
    <div className="page">
      <div className="page__content" style={{ padding: "18px" }}>
        <p className="tab-title">Scheme directory</p>
        <p className="tab-subtitle">Browse schemes by profession and state.</p>

        <form onSubmit={handleSearch} className="query-form">
          <div className="details-fields">
            <SelectDropdown
              placeholder="Profession"
              value={profession}
              onChange={setProfession}
              options={PROFESSION_OPTIONS}
            />

            <SelectDropdown
              placeholder="State"
              value={stateName}
              onChange={setStateName}
              options={STATE_OPTIONS}
            />
          </div>

          <button type="submit" className="primary-button" disabled={status === "loading"}>
            {status === "loading" ? "Searching..." : "Browse schemes"}
          </button>
        </form>

        {status === "loading" && <SearchingIndicator startedAt={searchStartedAt} />}

        {status === "error" && (
          <div className="message-card">
            <p>{errorMessage}</p>
            {retrySeconds !== null && <RetryCountdown seconds={retrySeconds} />}
          </div>
        )}

        {status === "ready" && hasSearched && schemes.length === 0 && (
          <div className="message-card">
            <p className="state-message">
              No schemes found for {profession === ALL_PROFESSIONS ? "any profession" : profession} in{" "}
              {stateName === ALL_STATES ? "any state" : stateName}.
            </p>
            {(canBroadenState || canBroadenProfession) && (
              <div className="broaden-actions">
                {canBroadenState && (
                  <button type="button" className="link-button" onClick={broadenToAllStates}>
                    Try "All States" for central schemes
                  </button>
                )}
                {canBroadenProfession && (
                  <button type="button" className="link-button" onClick={broadenToAllProfessions}>
                    Try "All Professions" instead
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {(status === "ready" || status === "loadingMore") && schemes.length > 0 && (
          <>
            <div className="result-list">
              {schemes.map((scheme, i) => (
                <SchemeCard
                  key={`${scheme.scheme_name}-${i}`}
                  scheme={scheme}
                  onClick={() => handleSchemeClick(scheme.scheme_name)}
                />
              ))}
            </div>
            <button className="load-more-button" onClick={handleLoadMore} disabled={status === "loadingMore"}>
              {status === "loadingMore" ? "Loading..." : "Load more"}
            </button>
          </>
        )}
      </div>

      {showGate && <AuthGateModal onClose={() => setShowGate(false)} />}

      <BottomNav />
    </div>
  );
}

export default DirectoryPage;