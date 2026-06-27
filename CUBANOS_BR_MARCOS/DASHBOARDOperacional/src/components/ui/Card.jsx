import React from "react";

/**
 * Card component – can be clickable (adds .card-clickable class).
 * Props:
 *   clickable: boolean – if true adds hover/focus styles defined in tokens.css
 *   onClick, onKeyDown – forwarded when clickable
 *   className – additional classes
 *   style – custom inline style (merged with token defaults)
 */
export const Card = ({
  clickable = false,
  onClick,
  onKeyDown,
  children,
  className = "",
  style = {},
  ...props
}) => {
  const baseStyle = {
    padding: "var(--card-padding, 14px 16px)",
    borderRadius: "var(--card-radius, 10px)",
    background: "var(--surface-elevated)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--card-gap, 12px)",
    ...style,
  };

  const classNames = `${clickable ? "card-clickable" : ""} ${className}`.trim();

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? onKeyDown : undefined}
      className={classNames}
      style={baseStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;