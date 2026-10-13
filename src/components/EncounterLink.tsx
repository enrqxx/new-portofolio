"use client";

/**
 * Pengganti <Link> untuk masuk minigame dengan transisi encounter.
 *
 * Pemakaian:
 *   <EncounterLink href="/roaring-knight" className="...">PLAY</EncounterLink>
 *
 * - Klik biasa  → transisi Undertale, lalu pindah halaman
 * - Ctrl/Cmd/Shift + klik, atau klik tengah → perilaku link normal (tab baru)
 * - Enter via keyboard → SOUL mulai dari tengah elemen
 */

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useEncounter } from "@/components/providers/EncounterProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export default function EncounterLink({ href, onClick, children, ...rest }: Props) {
  const { encounter } = useEncounter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();

    // e.detail === 0 → diaktifkan lewat keyboard
    const r = e.currentTarget.getBoundingClientRect();
    const origin =
      e.detail === 0
        ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        : { x: e.clientX, y: e.clientY };

    encounter(href, origin);
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}