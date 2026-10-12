/**
 * Layout untuk semua route section: HUD melayang + konten terpusar
 * tanpa scroll. SAVE screen hanya ada di '/'.
 */

import { type ReactNode } from "react";
import FloatingHud from "@/components/FloatingHud";

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ut-viewport">
      <FloatingHud />
      <main className="ut-main">{children}</main>
    </div>
  );
}
