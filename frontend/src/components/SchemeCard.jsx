import { CaretRight, Plant, PiggyBank, House, Drop, FileText } from "@phosphor-icons/react";

const CATEGORY_ICONS = {
  agriculture: Plant,
  pension: PiggyBank,
  housing: House,
  water: Drop,
};

function getCategoryIcon(category) {
  const key = (category || "").toLowerCase();
  const match = Object.keys(CATEGORY_ICONS).find((k) => key.includes(k));
  return match ? CATEGORY_ICONS[match] : FileText;
}

function SchemeCard({ scheme, onClick }) {
  const Icon = getCategoryIcon(scheme.category);

  return (
    <button className="scheme-card" onClick={onClick}>
      <span className="scheme-card__icon-wrap">
        <Icon size={15} color="var(--color-ink)" />
      </span>
      <span className="scheme-card__body">
        <span className="scheme-card__name">{scheme.scheme_name}</span>
        <span className="scheme-card__meta">
          {scheme.category} · {scheme.ministry}
        </span>
        {scheme.financial_benefits && (
          <span className="scheme-card__benefit">{scheme.financial_benefits}</span>
        )}
      </span>
      <CaretRight size={15} color="var(--color-border)" style={{ flexShrink: 0 }} />
    </button>
  );
}

export default SchemeCard;