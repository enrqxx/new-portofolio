/**
 * Pixel-art style SVG icons untuk section STATS.
 *
 * Digambar grid pixel 16x16 dengan rect, meniru estetika sprite retro.
 * Tiap icon memakai `currentColor` jadi bisa diwarnai via CSS.
 */

type IconProps = {
  className?: string;
};

const PIXEL = 16; // grid 16x16

function PixelSprite({
  pixels,
  className,
}: {
  /** Baris string; tiap karakter = 1 pixel. Spasi/karakter lain = transparang. */
  pixels: string[];
  className?: string;
}) {
  const rects: React.ReactNode[] = [];
  pixels.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c !== " " && c !== ".") {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill="currentColor"
          />
        );
      }
    }
  });

  return (
    <svg
      viewBox={`0 0 ${PIXEL} ${PIXEL}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

export function CodeIcon({ className }: IconProps) {
  // tanda </>
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "................",
        "......##........",
        ".....##.........",
        "....##..........",
        "...##...........",
        "..##.......##...",
        ".##........##...",
        "..##.......##...",
        "...##......##...",
        "....##.....##...",
        ".....##....##...",
        "......##........",
        "................",
        "................",
        "................",
      ]}
    />
  );
}

export function AtomIcon({ className }: IconProps) {
  // atom sederhana: inti + orbit
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        ".......##.......",
        "......#..#......",
        ".....#....#.....",
        "....#.###..#....",
        "....#.#.#..#....",
        "....#.###..#....",
        ".....#....#.....",
        "......#..#......",
        ".......##.......",
        "................",
        "......####......",
        ".....#....#.....",
        "......####......",
        "................",
        "................",
      ]}
    />
  );
}

export function PaletteIcon({ className }: IconProps) {
  // palette
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "....######......",
        "..##......##....",
        ".#..##..##..#...",
        "#............#..",
        "#...##....#..#..",
        "#...........#...",
        ".#..........#...",
        "..##......##....",
        "....######......",
        "......###.......",
        "......#.#.......",
        "......###.......",
        "................",
        "................",
        "................",
      ]}
    />
  );
}

export function ServerIcon({ className }: IconProps) {
  // server / database
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "....########....",
        "...#........#...",
        "...#..####..#...",
        "...#........#...",
        "...#########....",
        "...#........#...",
        "...#..####..#...",
        "...#........#...",
        "...#########....",
        "...#........#...",
        "...#..####..#...",
        "...#........#...",
        "....########....",
        "................",
        "................",
      ]}
    />
  );
}

export function HeartIcon({ className }: IconProps) {
  // soul hati Undertale
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "................",
        "...##....##.....",
        "..####..####....",
        ".############...",
        ".############...",
        ".############...",
        "..############..",
        "...##########...",
        "....########....",
        "......####......",
        ".......##.......",
        "................",
        "................",
        "................",
        "................",
      ]}
    />
  );
}

export function BranchIcon({ className }: IconProps) {
  // git branch
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "......###.......",
        "......#.#.......",
        "......#.#.......",
        "......#.#.......",
        "......#.########",
        "......#......#..",
        "......#......#..",
        "......#......#..",
        "########......#.",
        "......#......#..",
        "......#......#..",
        "......########..",
        "......#.........",
        "......#.........",
        "......###.......",
      ]}
    />
  );
}

export function PhpIcon({ className }: IconProps) {
  // huruf P blok
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "..########......",
        "..#......##.....",
        "..#......##.....",
        "..########......",
        "..#.............",
        "..#.............",
        "..#.............",
        "..#.............",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
      ]}
    />
  );
}

export function LaravelIcon({ className }: IconProps) {
  // huruf L dengan serif — gaya mark Laravel
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "..########......",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....##.........",
        ".....########...",
        ".....########...",
        "................",
        "................",
      ]}
    />
  );
}

export function ExtjsIcon({ className }: IconProps) {
  // huruf E blok
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "..########......",
        "..#.............",
        "..#.............",
        "..#.............",
        "..########......",
        "..#.............",
        "..#.............",
        "..#.............",
        "..#.............",
        "..########......",
        "................",
        "................",
        "................",
        "................",
        "................",
      ]}
    />
  );
}

export function PythonIcon({ className }: IconProps) {
  // ular melingkar (S-serpent)
  return (
    <PixelSprite
      className={className}
      pixels={[
        "................",
        "...######.......",
        "...#......#.....",
        "...#......#.....",
        "....#####.......",
        ".........#......",
        ".........#......",
        "....######......",
        "...#............",
        "...#............",
        "....######......",
        ".........#......",
        ".........#......",
        "..........###...",
        "................",
        "................",
      ]}
    />
  );
}

export const SKILL_ICONS = {
  code: CodeIcon,
  atom: AtomIcon,
  palette: PaletteIcon,
  server: ServerIcon,
  heart: HeartIcon,
  branch: BranchIcon,
  php: PhpIcon,
  laravel: LaravelIcon,
  extjs: ExtjsIcon,
  python: PythonIcon,
} as const;

export type SkillIconName = keyof typeof SKILL_ICONS;
