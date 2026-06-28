import React from "react";

export const SkeletonCard = ({ height = 16, width = "100%", radius = 6, className = "", style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{
      height,
      width,
      borderRadius: radius,
      ...style,
    }}
  />
);

export const SkeletonTramiteCard = () => (
  <div
    className="skeleton"
    style={{
      padding: "var(--card-padding, 14px 16px)",
      borderRadius: "var(--card-radius, 10px)",
      display: "flex",
      gap: "var(--gap-md, 12px)",
      alignItems: "center",
    }}
  >
    <SkeletonCard width={40} height={40} radius="50%" />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <SkeletonCard height={14} width="60%" />
      <SkeletonCard height={12} width="40%" />
    </div>
  </div>
);

export default SkeletonCard;
