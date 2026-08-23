import { Lock } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";

function AuthGateModal({ onClose }) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card__icon">
          <Lock size={20} color="var(--color-ink)" />
        </div>
        <p className="modal-card__title">Sign in to view full details</p>
        <p className="modal-card__text">Full scheme information is free once you're signed in with Google.</p>
        <button className="primary-button" onClick={signInWithGoogle}>Sign in with Google</button>
        <button className="modal-card__dismiss" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}

export default AuthGateModal;