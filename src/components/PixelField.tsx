"use client";

import { useEffect, useRef } from "react";
import styles from "./PixelField.module.scss";

const CELL = 16;

export function PixelField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const heat = new Map<number, number>();
    let width = 0;
    let cols = 0;
    let rows = 0;
    let brand = "20, 128, 120";
    let ink = "22, 20, 26";
    let raf = 0;
    let mx = -100;
    let my = -100;

    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      const parse = (value: string, fallback: string) => {
        const hex = value.trim();
        if (hex.startsWith("#") && (hex.length === 7 || hex.length === 4)) {
          const n = hex.length === 4
            ? hex.slice(1).split("").map((c) => parseInt(c + c, 16))
            : [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
          return n.join(", ");
        }
        const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? `${m[1]}, ${m[2]}, ${m[3]}` : fallback;
      };
      brand = parse(cs.getPropertyValue("--brand"), brand);
      ink = parse(cs.getPropertyValue("--ink"), ink);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
    };

    const keyAt = (c: number, r: number) => r * 4096 + c;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hc = Math.floor(mx / CELL);
      const hr = Math.floor(my / CELL);
      if (hc >= 0 && hr >= 0) {
        heat.set(keyAt(hc, hr), 1);
        heat.set(keyAt(hc + 1, hr), Math.max(heat.get(keyAt(hc + 1, hr)) ?? 0, 0.55));
        heat.set(keyAt(hc, hr + 1), Math.max(heat.get(keyAt(hc, hr + 1)) ?? 0, 0.4));
      }

      ctx.strokeStyle = `rgba(${ink}, 0.055)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        ctx.moveTo(c * CELL + 0.5, 0);
        ctx.lineTo(c * CELL + 0.5, rows * CELL);
      }
      for (let r = 0; r <= rows; r++) {
        ctx.moveTo(0, r * CELL + 0.5);
        ctx.lineTo(cols * CELL, r * CELL + 0.5);
      }
      ctx.stroke();

      for (const [k, value] of heat) {
        const h = value * 0.93;
        if (h < 0.03) {
          heat.delete(k);
          continue;
        }
        heat.set(k, h);
        const c = k % 4096;
        const r = (k / 4096) | 0;
        ctx.fillStyle = `rgba(${brand}, ${0.05 + h * 0.22})`;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    readTheme();
    resize();
    tick();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    const obs = new MutationObserver(readTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      obs.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={styles.field} aria-hidden />;
}
