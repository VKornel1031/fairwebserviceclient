"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(document.documentElement.dataset.theme === "dark"),
    [],
  );
  return (
    <button
      className="icon-button legal-theme"
      aria-label={dark ? "Világos téma" : "Sötét téma"}
      title="A témaválasztást ebben a böngészőben megjegyezzük."
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.dataset.theme = next ? "dark" : "light";
        try {
          localStorage.setItem("fairauto-theme", next ? "dark" : "light");
        } catch {}
      }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
