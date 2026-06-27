import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  style = {},
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          background: "var(--surface-raised)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--border-default)",
        };
      case "ghost":
        return {
          background: "transparent",
          color: "var(--brand-primary)",
          border: "1px solid var(--border-default)",
        };
      case "danger":
        return {
          background: "var(--color-danger)",
          color: "#fff",
          border: "1px solid var(--color-danger-border)",
        };
      case "primary":
      default:
        return {
          background: "var(--brand-primary)",
          color: "#fff",
          border: "1px solid var(--brand-primary-dark)",
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return { padding: "6px 10px", fontSize: "0.75rem", minHeight: "36px" };
      case "lg":
        return { padding: "10px 16px", fontSize: "1rem", minHeight: "46px" };
      case "md":
      default:
        return { padding: "8px 12px", fontSize: "0.875rem", minHeight: "42px" };
    }
  };

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontWeight: 600,
    letterSpacing: "0.01em",
    transition: "transform var(--transition-fast), background var(--transition-normal), color var(--transition-normal), border var(--transition-normal), box-shadow var(--transition-normal)",
    boxShadow: "none",
    ...getVariantStyle(),
    ...getSizeStyle(),
    ...style,
  };

  return (
    <button
      type={type}
      style={baseStyle}
      disabled={disabled}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;