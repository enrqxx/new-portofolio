/**
 * SaveStar — bintang kuning 4-sisi khas SAVE Point Undertale / Deltarune.
 *
 * Digambar sebagai pixel art 16x16 dengan animasi berkilau 2-frame (`steps(2)`).
 */

export default function SaveStar({
  size = 20,
  animated = true,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`ut-save-star ${animated ? "ut-save-star--anim" : ""} ${className}`}
    >
      {/* Bintang 4-sisi ala pixel art Undertale */}
      <rect x="7" y="1" width="2" height="14" fill="currentColor" />
      <rect x="1" y="7" width="14" height="2" fill="currentColor" />
      <rect x="6" y="4" width="4" height="8" fill="currentColor" />
      <rect x="4" y="6" width="8" height="4" fill="currentColor" />
      <rect x="5" y="5" width="6" height="6" fill="currentColor" />
      {/* Inti putih terang di tengah */}
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}
