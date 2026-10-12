"use client";

/**
 * Soul hati merah — simbol pemain di Undertale.
 *
 * Dipakai sebagai kursor/menu indicator. Kedip-kedip perlahan seperti
 * soul asli di game. Warna default #ff2b4b (soul merah Frisk).
 */

export default function SoulHeart({
  className = "",
  size = 16,
  color = "#ff2b4b",
  animated = true,
}: {
  className?: string;
  size?: number;
  color?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`ut-soul ${animated ? "ut-soul--animated" : ""} ${className}`}
      aria-hidden="true"
      style={{ color }}
    >
      <g fill="currentColor">
        <rect x="2" y="2" width="3" height="1" />
        <rect x="11" y="2" width="3" height="1" />
        <rect x="1" y="3" width="5" height="2" />
        <rect x="10" y="3" width="5" height="2" />
        <rect x="0" y="5" width="7" height="3" />
        <rect x="9" y="5" width="7" height="3" />
        <rect x="1" y="8" width="14" height="2" />
        <rect x="2" y="10" width="12" height="2" />
        <rect x="4" y="12" width="8" height="1" />
        <rect x="6" y="13" width="4" height="1" />
      </g>
    </svg>
  );
}
