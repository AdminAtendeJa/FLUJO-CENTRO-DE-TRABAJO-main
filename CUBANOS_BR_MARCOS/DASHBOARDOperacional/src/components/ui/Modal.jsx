import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export const Modal = ({
  isOpen = true,
  title,
  children,
  footer,
  onClose,
  maxWidth = 640,
  ariaLabel,
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousActive = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--section-gap, 16px)",
        background: "var(--surface-overlay)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn var(--transition-normal)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        tabIndex={-1}
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          animation: "scaleIn var(--transition-normal)",
        }}
      >
        {(title || onClose) && (
          <div
            style={{
              padding: "var(--card-padding, 14px 16px)",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--gap-md, 12px)",
            }}
          >
            {title && <h2 style={{ margin: 0, font: "var(--font-page-title)", color: "var(--color-text-primary)" }}>{title}</h2>}
            {onClose && (
              <button
                type="button"
                aria-label="Cerrar modal"
                onClick={onClose}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div style={{ overflowY: "auto", padding: "var(--section-gap, 16px)" }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "var(--card-padding, 14px 16px)",
              borderTop: "1px solid var(--border-default)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--gap-sm, 8px)",
              flexWrap: "wrap",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;