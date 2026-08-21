import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@phosphor-icons/react";
import { getHomeSchemes } from "../api/schemes";
import SchemeCard from "../components/SchemeCard";
import BottomNav from "../components/BottomNav";

function HomePage() {
  const [schemes, setSchemes] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const navigate = useNavigate();

  useEffect(() => {
    getHomeSchemes()
      .then((data) => {
        setSchemes(data.schemes || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  function openScheme(schemeName) {
    navigate(`/home/scheme/${encodeURIComponent(schemeName)}`);
  }

  return (
    <div className="page">
      <header className="home-header">
        <div>
          <p className="home-header__brand">Sarkarly</p>
          <p className="home-header__tagline">
            Discover government schemes you qualify for and understand your legal rights — clearly, in one place.
          </p>
        </div>
        <button className="home-header__profile" aria-label="Profile">
          <User size={16} color="var(--color-text-muted)" />
        </button>
      </header>

      <div className="page__content">
        <div className="section-label">
          <span>Schemes for you</span>
          <span className="section-label__hint">Refreshes often</span>
        </div>

        {status === "loading" && <p className="state-message">Loading schemes...</p>}
        {status === "error" && <p className="state-message">Couldn't load schemes right now. Please try again.</p>}
        {status === "ready" && schemes.length === 0 && (
          <p className="state-message">No schemes available right now. Please check back soon.</p>
        )}

        {status === "ready" && (
          <div className="scheme-list">
            {schemes.map((scheme) => (
              <SchemeCard
                key={scheme.scheme_name}
                scheme={scheme}
                onClick={() => openScheme(scheme.scheme_name)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default HomePage;