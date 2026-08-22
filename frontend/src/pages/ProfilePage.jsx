import { useState } from "react";
import { GoogleLogo, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import BackHeader from "../components/BackHeader";
import { useNavigate } from "react-router-dom";

function getInitial(user) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name;
  if (name) return name.trim()[0].toUpperCase();
  return (user?.email || "?")[0].toUpperCase();
}

function ProfilePage() {
  const { user, loading, hasConsent, signInWithGoogle, signOut, submitConsent } = useAuth();
  const [termsChecked, setTermsChecked] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleConsentSubmit() {
    setSubmitting(true);
    await submitConsent();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="page">
        <BackHeader title="Profile" onBack={() => navigate("/", { replace: true })} />
        <div className="page__content page__content--centered">
          <p className="state-message">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <BackHeader title="Profile" onBack={() => navigate("/", { replace: true })} />
        <div className="page__content page__content--centered">
          <div className="auth-card">
            <p className="auth-card__title">Sign in to continue</p>
            <p className="auth-card__text">
              Signing in lets you view full scheme details and ask about your legal rights.
            </p>
            <button className="google-button" onClick={signInWithGoogle}>
              <GoogleLogo size={18} weight="bold" />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <div className="page">
        <BackHeader title="Profile" onBack={() => navigate("/", { replace: true })} />
        <div className="page__content" style={{ padding: "18px" }}>
          <p className="auth-card__title">Before you continue</p>
          <p className="auth-card__text">Please review and accept the following to continue.</p>

          <label className="consent-row">
            <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />
            <span>I accept the Terms &amp; Conditions</span>
          </label>

          <label className="consent-row">
            <input type="checkbox" checked={analyticsChecked} onChange={(e) => setAnalyticsChecked(e.target.checked)} />
            <span>I consent to analytics to help improve the app</span>
          </label>

          <button
            className="primary-button"
            disabled={!termsChecked || !analyticsChecked || submitting}
            onClick={handleConsentSubmit}
          >
            {submitting ? "Please wait..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const initial = getInitial(user);

  return (
    <div className="page">
      <BackHeader title="Profile" onBack={() => navigate("/", { replace: true })} />
      <div className="page__content" style={{ padding: "18px" }}>
        <div className="profile-info">
          <div className="profile-avatar">{initial}</div>
          {name && <p className="profile-name">{name}</p>}
          <p className="profile-email">{user.email}</p>
        </div>
      </div>
      <button className="logout-button" onClick={signOut}>
        <SignOut size={16} />
        Log out
      </button>
    </div>
  );
}

export default ProfilePage;