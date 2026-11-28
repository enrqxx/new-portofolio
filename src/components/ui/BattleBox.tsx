"use client";

/**
 * Battle box — kotak berborder putih tempat semua "aksi" terjadi,
 * persis seperti UI encounter Undertale. Hitam pekat di dalamnya,
 * border putih tebal, sudut tegas.
 */

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function BattleBox({
  children,
  className = "",
  padding = "p-6 sm:p-8",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={`ut-battle-box relative ${className}`}>
      <div className={`ut-battle-box-inner ${padding}`}>{children}</div>
    </div>
  );
}
