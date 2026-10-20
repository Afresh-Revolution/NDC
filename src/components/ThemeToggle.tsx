"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.scss";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  return (
    <button
      type="button"
      className={styles.switch}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        const next = dark ? "light" : "dark";
        setDark(next === "dark");
        if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
        else document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("ndc-theme", next);
      }}
    >
      <span className={styles.led} data-on={dark} />
      <span className={styles.label}>THEME</span>
      <span className={styles.track} data-on={dark}>
        <span className={styles.knob} />
      </span>
      <span className={styles.mode}>{dark ? "DARK" : "LIGHT"}</span>
    </button>
  );
}
