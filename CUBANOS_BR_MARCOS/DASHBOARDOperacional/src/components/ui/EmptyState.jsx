import React from "react";

export const EmptyState = ({
  icon,
  title = "Sin datos",
  description = "No se encontraron elementos para mostrar.",
  actionLabel,
  onAction,
  className = "",
  style = {},
}) => (
  <div
    className={className}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--gap-md, 12px)",
      padding: "3rem 2rem",
      textAlign: "center",
      color: "var(--text-muted)",
      ...style,
    }}
  >
    {icon && (
      <div style={{ fontSize: "2rem", lineHeight: 1, opacity: 0.7 }}>{icon}</div>
    )}
    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)" }}>
      {title}
    </div>
    {description && (
      <div style={{ fontSize: "0.8rem", maxWidth: 360, lineHeight: 1.5 }}>
        {description}
      </div>
    )}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="btn btn-primary"
        style={{ marginTop: "var(--gap-sm, 8px)" }}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
