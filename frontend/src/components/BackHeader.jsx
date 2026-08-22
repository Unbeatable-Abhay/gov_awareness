import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

function BackHeader({ title, onBack }) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }

  return (
    <header className="back-header">
      <button className="back-header__button" onClick={handleBack} aria-label="Go back">
        <ArrowLeft size={16} color="var(--color-ink)" />
      </button>
      <p className="back-header__title">{title}</p>
    </header>
  );
}

export default BackHeader;