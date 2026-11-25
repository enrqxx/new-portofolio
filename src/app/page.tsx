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

const ENTERED_KEY = "ut-portfolio-entered";
let hasEnteredSession = false;

export default function Home() {
  const [entered, setEntered] = useState(() => hasEnteredSession);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(ENTERED_KEY) === "1") {
        hasEnteredSession = true;
        setEntered(true);
      }
    } catch {
      // ignore — sessionStorage may be unavailable
    }
  }, []);

  const handleEnter = useCallback(() => {
    hasEnteredSession = true;
    try {
      window.sessionStorage.setItem(ENTERED_KEY, "1");
    } catch {
      // ignore
    }
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
