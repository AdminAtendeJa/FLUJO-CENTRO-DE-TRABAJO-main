import React from "react";

export const Select = ({
  options = [],
  error = false,
  disabled = false,
  style = {},
  ...rest
}) => {
  const baseStyle = {
    width: "100%",
    padding: "8px 10px",
    font: "var(--font-body)",
    borderRadius: "var(--radius-sm)",
    border: error ? "1px solid var(--color-danger)" : "1px solid var(--border-subtle)",
    background: disabled ? "var(--surface-raised)" : "var(--surface-elevated)",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
    outline: "none",
    minHeight: "42px",
    transition: "border var(--transition-normal), box-shadow var(--transition-normal)",
    ...style,
  };

  return (
    <select
      disabled={disabled}
      style={baseStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--brand-primary)";
        e.target.style.boxShadow = "0 0 0 2px var(--brand-primary-glow)";
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = "none";
        e.target.style.borderColor = error ? "var(--color-danger)" : "var(--border-subtle)";
      }}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Select;