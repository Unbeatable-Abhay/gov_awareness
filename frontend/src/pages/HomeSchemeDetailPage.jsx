import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHomeSchemeDetails } from "../api/schemes";
import BackHeader from "../components/BackHeader";

function HomeSchemeDetailPage() {
  const { schemeName } = useParams();
  const decodedName = decodeURIComponent(schemeName);
  const [scheme, setScheme] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    getHomeSchemeDetails(decodedName)
      .then((data) => {
        setScheme(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [decodedName]);

  return (
    <div className="page">
      <BackHeader title="Scheme details" />
      <div className="page__content detail-content">
        {status === "loading" && <p className="state-message">Loading...</p>}
        {status === "error" && (
          <p className="state-message">This scheme is no longer available. Please check the Schemes tab instead.</p>
        )}
        {status === "ready" && scheme && (
          <>
            <span className="category-chip">{scheme.category}</span>
            <h1 className="detail-title">{scheme.scheme_name}</h1>
            <p className="detail-ministry">{scheme.ministry}</p>

            {scheme.financial_benefits && (
              <div className="detail-box">
                <p className="detail-box__label">Financial benefits</p>
                <p className="detail-box__text">{scheme.financial_benefits}</p>
              </div>
            )}

            {scheme.description && (
              <>
                <p className="detail-section-label">About this scheme</p>
                <p className="detail-body">{scheme.description}</p>
              </>
            )}

            {scheme.eligibility?.length > 0 && (
              <>
                <p className="detail-section-label">Eligibility</p>
                <ul className="detail-list">
                  {scheme.eligibility.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </>
            )}

            {scheme.benefits?.length > 0 && (
              <>
                <p className="detail-section-label">Benefits</p>
                <ul className="detail-list">
                  {scheme.benefits.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </>
            )}

            {scheme.how_to_apply?.steps?.length > 0 && (
              <>
                <p className="detail-section-label">How to apply ({scheme.how_to_apply.mode})</p>
                <ol className="detail-list detail-list--ordered">
                  {scheme.how_to_apply.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </>
            )}

            {scheme.documents_required?.length > 0 && (
              <>
                <p className="detail-section-label">Documents required</p>
                <ul className="detail-list">
                  {scheme.documents_required.map((doc, i) => <li key={i}>{doc}</li>)}
                </ul>
              </>
            )}

            {scheme.deadline && (
              <>
                <p className="detail-section-label">Deadline</p>
                <p className="detail-body">{scheme.deadline}</p>
              </>
            )}

            {scheme.rejection_reasons?.length > 0 && (
              <>
                <p className="detail-section-label">Common rejection reasons</p>
                <ul className="detail-list">
                  {scheme.rejection_reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </>
            )}

            {scheme.helpline_contact && (
              <>
                <p className="detail-section-label">Helpline</p>
                <p className="detail-body">{scheme.helpline_contact}</p>
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

export default HomeSchemeDetailPage;