import { useState, useRef, useEffect } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";

function SelectDropdown({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="select-dropdown" ref={ref}>
      <button
        type="button"
        className="select-dropdown__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selectedLabel ? "" : "select-dropdown__placeholder"}>
          {selectedLabel || placeholder}
        </span>
        <CaretDown size={13} color="var(--color-text-muted)" />
      </button>

      {open && (
        <div className="select-dropdown__panel">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className="select-dropdown__option"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={14} color="var(--color-ink)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectDropdown;