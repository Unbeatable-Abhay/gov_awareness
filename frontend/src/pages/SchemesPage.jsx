import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { matchSchemes } from "../api/schemes";
import { useAuth } from "../auth/AuthContext";
import { useSchemesSearch } from "../context/SchemesSearchContext";
import SchemeCard from "../components/SchemeCard";
import AuthGateModal from "../components/AuthGateModal";
import BottomNav from "../components/BottomNav";
import SelectDropdown from "../components/SelectDropdown";
import RetryCountdown from "../components/RetryCountdown";

function SchemesPage() {
  const { query, setQuery, schemes, setSchemes, status, setStatus } = useSchemesSearch();
  const [showGate, setShowGate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [ageRange, setAgeRange] = useState("");
  const [stateName, setStateName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [gender, setGender] = useState("");
  const navigate = useNavigate();
  const { user, hasConsent } = useAuth();
    const [searchErrorMessage, setSearchErrorMessage] = useState("");
    const [retrySeconds, setRetrySeconds] = useState(null);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch(e);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    const extras = [];
    if (ageRange) extras.push(`age ${ageRange}`);
    if (gender) extras.push(gender);
    if (occupation) extras.push(occupation);
    if (stateName) extras.push(`from ${stateName}`);

    const fullQuery = extras.length > 0
      ? `${query.trim()} (${extras.join(", ")})`
      : query.trim();

        setStatus("loading");
    try {
      const data = await matchSchemes(fullQuery);
      setSchemes(data.schemes || []);
      setStatus("ready");
    } catch (err) {
      if (err.status === 429) {
          setErrorMessage("You've reached the limit for viewing scheme details this hour.");
          setRetrySeconds(err.retryAfterSeconds || null);
        } else if (err.status === 401 || err.status === 403) {
          setErrorMessage("Please sign in again to view this scheme.");
          setRetrySeconds(null);
        } else {
          setErrorMessage("Couldn't load this scheme right now. Please try again.");
          setRetrySeconds(null);
        }
        setStatus("error");
    }
  }

  async function handleLoadMore() {
    setStatus("loadingMore");
    try {
      const excludeNames = schemes.map((s) => s.scheme_name);
      const data = await matchSchemes(query.trim(), excludeNames);
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

  return (
    <div className="page">
      <div className="page__content" style={{ padding: "18px" }}>
        <p className="tab-title">Find schemes for you</p>
        <p className="tab-subtitle">Describe your situation and we'll find schemes that match.</p>

        <form onSubmit={handleSearch} className="query-form">
          <textarea
            className="query-input"
            placeholder="e.g. I'm a farmer with less than 2 acres of land"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />

          <button
            type="button"
            className="details-toggle"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? "Hide details" : "Add more details (optional)"}
          </button>

          {showDetails && (
            <div className="details-fields">
                            <SelectDropdown
                placeholder="Age range"
                value={ageRange}
                onChange={setAgeRange}
                options={[
                  { value: "18-25", label: "18–25" },
                  { value: "26-40", label: "26–40" },
                  { value: "41-60", label: "41–60" },
                  { value: "60+", label: "60+" },
                ]}
              />

              <SelectDropdown
                placeholder="Gender"
                value={gender}
                onChange={setGender}
                options={[
                  { value: "woman", label: "Woman" },
                  { value: "man", label: "Man" },
                  { value: "other", label: "Other" },
                ]}
              />

              <SelectDropdown
                placeholder="Occupation"
                value={occupation}
                onChange={setOccupation}
                options={[
                  { value: "farmer", label: "Farmer" },
                  { value: "student", label: "Student" },
                  { value: "self-employed", label: "Self-employed" },
                  { value: "salaried", label: "Salaried employee" },
                  { value: "unemployed", label: "Unemployed" },
                  { value: "senior citizen", label: "Senior citizen" },
                  { value: "homemaker", label: "Homemaker" },
                ]}
              />

              <input
                type="text"
                className="details-select"
                placeholder="State (optional)"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="primary-button" disabled={!query.trim() || status === "loading"}>
            {status === "loading" ? "Searching..." : "Find schemes"}
          </button>
        </form>

        {status === "error" && (
          <div className="message-card">
            <p>{errorMessage}</p>
            {retrySeconds !== null && <RetryCountdown seconds={retrySeconds} />}
          </div>
        )}
        {status === "ready" && schemes.length === 0 && (
          <p className="state-message">No matching schemes found. Try describing your situation differently.</p>
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

export default SchemesPage;