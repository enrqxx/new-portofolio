import { ImageResponse } from "next/og";
import { PLAYER } from "@/lib/data";

export const alt = `${PLAYER.name} — ${PLAYER.role} | Undertale Portfolio`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const SOUL_RECTS: [number, number, number, number][] = [
  [2, 2, 3, 1],
  [11, 2, 3, 1],
  [1, 3, 5, 2],
  [10, 3, 5, 2],
  [0, 5, 7, 3],
  [9, 5, 7, 3],
  [1, 8, 14, 2],
  [2, 10, 12, 2],
  [4, 12, 8, 1],
  [6, 13, 4, 1],
];

const ACTIONS = ["CHECK", "STATS", "ENCOUNTERS", "JOURNEY", "MERCY"];

export default function OpenGraphImage() {
  const hpPercent = Math.round((PLAYER.hp / PLAYER.maxHp) * 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(circle at 50% 45%, rgba(160, 18, 38, 0.28), transparent 70%), linear-gradient(to right, rgba(205, 32, 56, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(205, 32, 56, 0.16) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          padding: 48,
          fontFamily: "monospace",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#000000",
            border: "8px solid #ffffff",
            padding: "44px 52px",
          }}
        >
          {/* Header status ala HUD Undertale */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "3px dashed #333333",
              paddingBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <svg
                width="48"
                height="42"
                viewBox="0 0 16 14"
                style={{ display: "flex" }}
              >
                {SOUL_RECTS.map(([x, y, w, h], i) => (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="#ff2b4b"
                  />
                ))}
              </svg>
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: 4,
                }}
              >
                * {PLAYER.name.toUpperCase()}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 24,
              }}
            >
              <span style={{ color: "#8b8b8b" }}>LV {PLAYER.level}</span>
              <span style={{ color: "#ffffff" }}>HP</span>
              <div
                style={{
                  display: "flex",
                  width: 140,
                  height: 22,
                  backgroundColor: "#bb0000",
                  border: "2px solid #ffffff",
                }}
              >
                <div
                  style={{
                    width: `${hpPercent}%`,
                    height: "100%",
                    backgroundColor: "#ffcc00",
                  }}
                />
              </div>
              <span>
                {PLAYER.hp}/{PLAYER.maxHp}
              </span>
            </div>
          </div>

          {/* Konten utama */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 54,
                fontWeight: 700,
                letterSpacing: 3,
                color: "#ffffff",
              }}
            >
              <span>{PLAYER.role.toUpperCase()}</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "#ffe600",
                letterSpacing: 1,
              }}
            >
              * You&apos;re filled with DETERMINATION.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#a8a8a8",
              }}
            >
              Interactive Undertale &amp; Deltarune themed portfolio — with procedural SFX &amp; secret boss.
            </div>
          </div>

          {/* Bar tombol aksi ala Undertale */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingTop: 22,
              borderTop: "3px dashed #333333",
            }}
          >
            {ACTIONS.map((label, idx) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "12px 10px",
                  border:
                    idx === 0 ? "4px solid #ff2b4b" : "3px solid #ffffff",
                  color: idx === 0 ? "#ffffff" : "#8b8b8b",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 2,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
