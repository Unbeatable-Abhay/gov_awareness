import { CaretRight, Plant, PiggyBank, House, Drop, FileText, GraduationCap } from "@phosphor-icons/react";

const CATEGORY_ICONS = {
  agriculture: Plant,
  pension: PiggyBank,
  housing: House,
  water: Drop,
  education: GraduationCap,
};

function getCategoryIcon(category) {
  const key = (category || "").toLowerCase();
  const match = Object.keys(CATEGORY_ICONS).find((k) => key.includes(k));
  return match ? CATEGORY_ICONS[match] : FileText;
}

function SchemeCard({ scheme, onClick, featured = false }) {
  const Icon = getCategoryIcon(scheme.category);

  if (featured) {
    return (
      <button className="scheme-card scheme-card--featured" onClick={onClick}>
        <span className="scheme-card__icon-wrap scheme-card__icon-wrap--featured">
          <Icon size={16} color="var(--color-marigold)" />
        </span>
        <span className="scheme-card__name scheme-card__name--featured">{scheme.scheme_name}</span>
        <span className="scheme-card__meta scheme-card__meta--featured">
          {scheme.category} · {scheme.ministry}
        </span>
        {scheme.financial_benefits && (
          <span className="scheme-card__benefit scheme-card__benefit--featured">{scheme.financial_benefits}</span>
        )}
      </button>
    );
  }

  return (
    <button className="scheme-card scheme-card--grid" onClick={onClick}>
      <span className="scheme-card__icon-wrap">
        <Icon size={13} color="var(--color-ink)" />
      </span>
      <span className="scheme-card__name">{scheme.scheme_name}</span>
      <span className="scheme-card__meta">{scheme.category}</span>
    </button>
  );
}

export default SchemeCard;