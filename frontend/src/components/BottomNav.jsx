import { useNavigate, useLocation } from "react-router-dom";
import { House, FileText, Scales, MapPin } from "@phosphor-icons/react";

const TABS = [
  { path: "/", label: "Home", Icon: House },
  { path: "/schemes", label: "Schemes", Icon: FileText },
  { path: "/legal", label: "Legal", Icon: Scales },
  { path: "/directory", label: "Directory", Icon: MapPin },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(tabPath) {
    if (tabPath === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(tabPath);
  }

  function handleTabClick(tabPath) {
    if (isActive(tabPath)) return;
    navigate(tabPath, { replace: true });
  }

  return (
    <nav className="bottom-nav">
      {TABS.map(({ path, label, Icon }) => {
        const active = isActive(path);
        return (
          <button
            key={path}
            className="bottom-nav__item"
            onClick={() => handleTabClick(path)}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            <span className={active ? "bottom-nav__pill" : "bottom-nav__icon-wrap"}>
              <Icon size={19} weight={active ? "fill" : "regular"} color={active ? "var(--color-marigold)" : "var(--color-text-muted)"} />
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;