import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSchemeDetails } from "../api/schemes";
import { useAuth } from "../auth/AuthContext";
import { formatBoldText } from "../utils/formatText";
import RetryCountdown from "../components/RetryCountdown";
import BackHeader from "../components/BackHeader";

function SchemeDetailPage() {
  const { schemeName } = useParams();
  const decodedName = decodeURIComponent(schemeName);
  const [scheme, setScheme] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retrySeconds, setRetrySeconds] = useState(null);
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/schemes", { replace: true });
      return;
    }
    setStatus("loading");
    setRetrySeconds(null);
    getSchemeDetails(decodedName, session.access_token)
      .then((data) => {
        setScheme(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.status === 429) {
          setErrorMessage("You've reached the limit for viewing scheme details this hour.");
          setRetrySeconds(err.retryAfterSeconds || null);
        } else if (err.status === 401 || err.status === 403) {
          setErrorMessage("Please sign in again to view this scheme.");
        } else {
          setErrorMessage("Couldn't load this scheme right now. Please try again.");
        }
        setStatus("error");
      });
  }, [decodedName, authLoading, user, session, navigate]);

  return (
    <div className="page">
      <BackHeader title="Scheme details" />
      <div className="page__content detail-content">
        {status === "loading" && (
          <div className="detail-skeleton">
            <div className="skeleton skeleton--chip" />
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--subtitle" />
            <div className="skeleton skeleton--box" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line" style={{ width: "70%" }} />
            <div className="skeleton skeleton--line" style={{ marginTop: "18px" }} />
            <div className="skeleton skeleton--line" style={{ width: "85%" }} />
          </div>
        )}

        {status === "error" && (
          <div className="message-card">
            <p>{errorMessage}</p>
            {retrySeconds !== null && <RetryCountdown seconds={retrySeconds} />}
          </div>
        )}

        {status === "ready" && scheme && (
          <>
            <span className="category-chip">{scheme.category}</span>
            <h1 className="detail-title">{scheme.scheme_name}</h1>
            <p className="detail-ministry">{scheme.ministry}</p>

            {scheme.financial_benefits && (
              <div className="detail-box">
                <p className="detail-box__label">Financial benefits</p>
                <p className="detail-box__text">{formatBoldText(scheme.financial_benefits)}</p>
              </div>
            )}

            {scheme.description && (
              <>
                <p className="detail-section-label">About this scheme</p>
                <p className="detail-body">{formatBoldText(scheme.description)}</p>
              </>
            )}

            {scheme.eligibility?.length > 0 && (
              <>
                <p className="detail-section-label">Eligibility</p>
                <ul className="detail-list">
                  {scheme.eligibility.map((item, i) => <li key={i}>{formatBoldText(item)}</li>)}
                </ul>
              </>
            )}

            {scheme.benefits?.length > 0 && (
              <>
                <p className="detail-section-label">Benefits</p>
                <ul className="detail-list">
                  {scheme.benefits.map((item, i) => <li key={i}>{formatBoldText(item)}</li>)}
                </ul>
              </>
            )}

            {scheme.how_to_apply?.steps?.length > 0 && (
              <>
                <p className="detail-section-label">How to apply ({scheme.how_to_apply.mode})</p>
                <ol className="detail-list detail-list--ordered">
                  {scheme.how_to_apply.steps.map((step, i) => <li key={i}>{formatBoldText(step)}</li>)}
                </ol>
              </>
            )}

            {scheme.documents_required?.length > 0 && (
              <>
                <p className="detail-section-label">Documents required</p>
                <ul className="detail-list">
                  {scheme.documents_required.map((doc, i) => <li key={i}>{formatBoldText(doc)}</li>)}
                </ul>
              </>
            )}

            {scheme.deadline && (
              <>
                <p className="detail-section-label">Deadline</p>
                <p className="detail-body">{formatBoldText(scheme.deadline)}</p>
              </>
            )}

            {scheme.rejection_reasons?.length > 0 && (
              <>
                <p className="detail-section-label">Common rejection reasons</p>
                <ul className="detail-list">
                  {scheme.rejection_reasons.map((r, i) => <li key={i}>{formatBoldText(r)}</li>)}
                </ul>
              </>
            )}

            {scheme.helpline_contact && (
              <>
                <p className="detail-section-label">Helpline</p>
                <p className="detail-body">{formatBoldText(scheme.helpline_contact)}</p>
              </>
            )}

            {scheme.official_link && (
              <a href={scheme.official_link} target="_blank" rel="noopener noreferrer" className="official-link">
                <span className="official-link__dot" />
                Official source · {scheme.official_link.replace(/^https?:\/\//, "")}
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SchemeDetailPage;