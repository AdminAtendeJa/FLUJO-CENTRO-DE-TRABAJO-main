import React from "react";

const STATUS_MAP = {
  pendiente: { label: "Pendiente", cls: "badge-pendiente", dot: true },
  procesando: { label: "Procesando", cls: "badge-procesando", dot: true },
  esperando: { label: "Esperando docs", cls: "badge-esperando", dot: true },
  esperando_docs: { label: "Esperando docs", cls: "badge-esperando", dot: true },
  completada: { label: "Completado", cls: "badge-completada", dot: true },
  cancelada: { label: "Cancelado", cls: "badge-cancelada", dot: true },
  success: { label: "Success", cls: "badge-success", dot: false },
  warning: { label: "Warning", cls: "badge-warning", dot: false },
  danger: { label: "Danger", cls: "badge-danger", dot: false },
  info: { label: "Info", cls: "badge-info", dot: false },
};

export const Badge = ({
  status = "info",
  children,
  dot = true,
  className = "",
  ...props
}) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.info;
  return (
    <span className={`badge ${cfg.cls} ${className}`.trim()} {...props}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children || cfg.label}
    </span>
  );
};

export default Badge;
