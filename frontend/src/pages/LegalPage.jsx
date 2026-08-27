import { useState } from "react";
import { getLegalAdvisory } from "../api/legal";
import { useAuth } from "../auth/AuthContext";
import { useLegalSearch } from "../context/LegalSearchContext";
import { formatBoldText } from "../utils/formatText";
import AuthGateModal from "../components/AuthGateModal";
import RetryCountdown from "../components/RetryCountdown";
import BottomNav from "../components/BottomNav";
import SearchingIndicator from "../components/SearchingIndicator";

function LegalPage() {
  const {
    query, setQuery,
    status, setStatus,
    result, setResult,
    searchStartedAt, setSearchStartedAt,
  } = useLegalSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [retrySeconds, setRetrySeconds] = useState(null);
  const [showGate, setShowGate] = useState(false);
  const { user, hasConsent, session } = useAuth();

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user || !hasConsent) {
      setShowGate(true);
      return;
    }

    setStatus("loading");
    setSearchStartedAt(Date.now());
    setRetrySeconds(null);
    try {
      const data = await getLegalAdvisory(query.trim(), session.access_token);
      setResult(data);
      setStatus("ready");
    } catch (err) {
      if (err.status === 429) {
        setErrorMessage("You've asked a lot of questions this hour.");
        setRetrySeconds(err.retryAfterSeconds || null);
      } else if (err.status === 401 || err.status === 403) {
        setErrorMessage("Please sign in again to continue.");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      setStatus("error");
    }
  }

  function handleAskAnother() {
    setResult(null);
    setStatus("idle");
    setQuery("");
  }

  return (
    <div className="page">
      <div className="page__content" style={{ padding: "18px" }}>
        {status !== "ready" && (
          <>
            <p className="tab-title">Know your legal rights</p>
            <p className="tab-subtitle">Describe a situation and get a clear, plain-language answer.</p>

            <form onSubmit={handleSubmit} className="query-form">
              <textarea
                className="query-input"
                placeholder="e.g. My landlord won't return my security deposit"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
              />
              <button type="submit" className="primary-button" disabled={!query.trim() || status === "loading"}>
                {status === "loading" ? "Thinking..." : "Get answer"}
              </button>
            </form>

            {status === "loading" && <SearchingIndicator startedAt={searchStartedAt} />}

            {status === "error" && (
              <div className="message-card">
                <p>{errorMessage}</p>
                {retrySeconds !== null && <RetryCountdown seconds={retrySeconds} />}
              </div>
            )}
          </>
        )}

        {status === "ready" && result && (
          <>
            <h1 className="detail-title">{result.topic}</h1>

            <p className="detail-section-label">Explanation</p>
            <p className="detail-body">{formatBoldText(result.explanation)}</p>

            {result.citizen_rights?.length > 0 && (
              <>
                <p className="detail-section-label">Your rights</p>
                <ul className="detail-list">
                  {result.citizen_rights.map((item, i) => <li key={i}>{formatBoldText(item)}</li>)}
                </ul>
              </>
            )}

            {result.authority_limits?.length > 0 && (
              <>
                <p className="detail-section-label">Authority limits</p>
                <ul className="detail-list">
                  {result.authority_limits.map((item, i) => <li key={i}>{formatBoldText(item)}</li>)}
                </ul>
              </>
            )}

            {result.relevant_provisions?.length > 0 && (
              <>
                <p className="detail-section-label">Relevant provisions</p>
                <ul className="detail-list">
                  {result.relevant_provisions.map((item, i) => <li key={i}>{formatBoldText(item)}</li>)}
                </ul>
              </>
            )}

            {result.sources?.length > 0 && (
              <>
                <p className="detail-section-label">Sources</p>
                {result.sources.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="official-link" style={{ marginBottom: "8px" }}>
                    <span className="official-link__dot" />
                    {src.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </>
            )}

            <p className="detail-body" style={{ marginTop: "18px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              {result.disclaimer}
            </p>

            <button className="load-more-button" onClick={handleAskAnother} style={{ marginTop: "16px" }}>
              Ask another question
            </button>
          </>
        )}
      </div>

      {showGate && <AuthGateModal onClose={() => setShowGate(false)} />}

      <BottomNav />
    </div>
  );
}

export default LegalPage;