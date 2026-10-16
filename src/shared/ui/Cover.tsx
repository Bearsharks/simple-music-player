import { useId, useState } from "react";
import "./Cover.scss";
export const coverSeed = (id: string) =>
  [...id].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 7);
export default function Cover({
  id,
  thumbnail,
  className = "",
}: {
  id: string;
  thumbnail?: string;
  className?: string;
}) {
  const key = useId().replaceAll(":", "");
  const seed = coverSeed(id);
  const variant = seed % 4;
  const colors = [
    ["#241543", "#a855ff", "#ff4d8d", "#4cc9ff"],
    ["#152333", "#4cc9ff", "#6c70ef", "#a855ff"],
    ["#35202f", "#ff4d8d", "#d899fd", "#7065eb"],
    ["#222044", "#7469ff", "#bd7bff", "#f69dca"],
  ][variant];
  const [failed, setFailed] = useState("");
  return (
    <span
      className={`wave-cover ${className}`}
      data-cover-seed={seed}
      aria-hidden="true"
    >
      <svg viewBox="0 0 300 300" focusable="false">
        <defs>
          <linearGradient id={`${key}-bg`} x2=".8" y2="1">
            <stop stopColor={colors[0]} />
            <stop offset="1" stopColor="#0e0d1e" />
          </linearGradient>
          <linearGradient id={`${key}-wave`} x1="0" y1=".5" x2="1" y2=".3">
            <stop stopColor={colors[1]} />
            <stop offset=".55" stopColor={colors[2]} />
            <stop offset="1" stopColor={colors[3]} />
          </linearGradient>
          <linearGradient id={`${key}-light`} x2="1" y2="1">
            <stop stopColor="#fff" stopOpacity=".6" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={`url(#${key}-bg)`} />
        <circle
          cx={seed % 2 ? 250 : 44}
          cy={seed % 3 ? 45 : 250}
          r="110"
          fill={colors[1]}
          opacity=".08"
        />
        <g
          transform={`translate(${seed % 2 ? 300 : 0} 0) scale(${seed % 2 ? "-1 1" : "1 1"})`}
        >
          <path
            d="M-40 208C36 48 80 270 153 140S269 38 342 119"
            fill="none"
            stroke={`url(#${key}-wave)`}
            strokeWidth={variant === 1 ? 64 : 78}
            strokeLinecap="round"
          />
          <path
            d="M-40 171C36 11 80 233 153 103S269 1 342 82"
            fill="none"
            stroke={`url(#${key}-light)`}
            strokeWidth="2"
            opacity=".8"
          />
          <path
            d="M-40 216C36 56 80 278 153 148S269 46 342 127"
            fill="none"
            stroke="#050510"
            strokeWidth="27"
            opacity=".13"
          />
        </g>
        <circle cx="264" cy="37" r="3" fill="#fff" opacity=".7" />
        <path d="M28 270h20m-20-5h10" stroke="#ffffff60" strokeWidth="1.5" />
        <text
          x="272"
          y="273"
          textAnchor="end"
          fill="#ffffff90"
          fontSize="9"
          fontFamily="Arial,sans-serif"
          letterSpacing="2"
        >
          loopy
        </text>
      </svg>
      {thumbnail && failed !== thumbnail && (
        <img
          key={thumbnail}
          src={thumbnail}
          alt=""
          onError={() => setFailed(thumbnail)}
        />
      )}
    </span>
  );
}
