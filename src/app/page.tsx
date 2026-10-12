"use client";

/**
 * Halaman utama ('/'): SAVE screen pembuka, lalu hub pemilihan section.
 *
 * SAVE screen menghalangi sampai pengguna memilih SAVE / CONTINUE / RESET.
 * Setelah itu, hub menampilkan kartu menuju tiap section (route masing-masing).
 */

import { useCallback, useEffect, useState } from "react";
import SaveScreen from "@/components/SaveScreen";
import Hub from "@/components/Hub";
import FloatingHud from "@/components/FloatingHud";

export default function Home() {
  const [entered, setEntered] = useState(false);

  const handleEnter = useCallback(() => {
    setEntered(true);
  }, []);

  // SAVE screen memakai fixed overlay, jadi body boleh tetap statis.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="ut-viewport">
      {!entered && <SaveScreen onEnter={handleEnter} />}

      <div
        className={`ut-stage ${entered ? "ut-stage--entered" : ""}`}
        aria-hidden={!entered}
      >
        <FloatingHud />
        <Hub />
      </div>
    </div>
  );
}
