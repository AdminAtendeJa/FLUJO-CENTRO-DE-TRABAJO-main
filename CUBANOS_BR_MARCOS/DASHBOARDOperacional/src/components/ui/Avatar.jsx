import React from "react";

const COLORS = [
  "#534AB7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
];

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

export const Avatar = ({
  name = "",
  src,
  size = 40,
  className = "",
  style = {},
  ...props
}) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const bg = src ? "transparent" : stringToColor(name);

  return (
    <div
      className={className}
      {...props}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: size * 0.4,
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials || "?"
      )}
    </div>
  );
};

export default Avatar;
