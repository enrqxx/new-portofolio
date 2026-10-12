"use client";

/**
 * Tombol kembali ke hub ('/') di bagian bawah tiap halaman section.
 */

import Link from "next/link";
import { useSound } from "@/components/providers/SoundProvider";

export default function BackToHub() {
  const { play } = useSound();

  return (
    <Link
      href="/"
      className="ut-back"
      onMouseEnter={() => play("back")}
      onFocus={() => play("back")}
    >
      ◀ BACK TO HUB
    </Link>
  );
}
