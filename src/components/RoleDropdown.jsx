import { useState, useRef, useEffect } from "react";

export default function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { label: "All Roles", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
  ];

  const selected =
    options.find((item) => item.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen(!open)}
      >
        {selected.label}

        <span
          className={`dropdown-arrow ${
            open ? "rotate" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="dropdown-menu">
          {options.map((item) => (
            <div
              key={item.value}
              className={`dropdown-item ${
                value === item.value ? "active" : ""
              }`}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}