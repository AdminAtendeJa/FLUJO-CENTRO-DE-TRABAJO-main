import React from "react";

export const Textarea = ({
  error = false,
  disabled = false,
  style = {},
  className = "",
  rows = 4,
  ...rest
}) => {
  const baseStyle = {
    width: "100%",
    minHeight: 96,
    padding: "8px 10px",
    font: "var(--font-body)",
    borderRadius: "var(--radius-sm)",
    border: error ? "1px solid var(--color-danger)" : "1px solid var(--border-subtle)",
    background: disabled ? "var(--surface-raised)" : "var(--surface-elevated)",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
    outline: "none",
    resize: "vertical",
    minHeight: "96px",
    transition: "border var(--transition-normal), background var(--transition-normal), box-shadow var(--transition-normal)",
    ...style,
  };

  return (
    <textarea
      rows={rows}
      disabled={disabled}
      className={className}
      style={baseStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--brand-primary)";
        e.target.style.boxShadow = "0 0 0 2px var(--brand-primary-glow)";
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = "none";
        e.target.style.borderColor = error ? "var(--color-danger)" : "var(--border-subtle)";
        rest.onBlur?.(e);
      }}
      {...rest}
    />
  );
};

export default Textarea;