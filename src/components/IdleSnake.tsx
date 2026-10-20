"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSnakeBoard, submitSnakeScore, type SnakeRank } from "@/app/actions/snake";
import styles from "./IdleSnake.module.scss";

const COLS = 18;
const ROWS = 14;
const IDLE_MS = 10000;

type Point = { x: number; y: number };
const DIRS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

/** Starts at 240ms, eases toward 52ms as food is eaten. */
function tickMs(score: number) {
  return Math.round(52 + 188 * Math.exp(-score / 9));
}

function wrap(n: number, max: number) {
  return ((n % max) + max) % max;
}

function spawn(exclude: Point[]): Point {
  for (let i = 0; i < 80; i++) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!exclude.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
  return { x: COLS - 1, y: ROWS - 1 };
}

function inForm() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

function Cup({ place }: { place: 1 | 2 | 3 }) {
  const fill = place === 1 ? "#e2b84a" : place === 2 ? "#c9d1d8" : "#c47a3a";
  const shine = place === 1 ? "#fff3c4" : place === 2 ? "#f4f7f9" : "#efc39a";
  return (
    <svg className={styles.cup} viewBox="0 0 24 24" aria-hidden>
      <path
        fill={fill}
        d="M7 3h10v1.4h2.6V8c0 2.1-1.5 3.9-3.5 4.4A5.2 5.2 0 0 1 13 16.4V18h3v2H8v-2h3v-1.6A5.2 5.2 0 0 1 7.9 12.4C5.9 11.9 4.4 10.1 4.4 8V4.4H7V3Z"
      />
      <path fill={shine} d="M9 5.2h2.2v6.2H9.6A3.6 3.6 0 0 1 7.2 8V5.2H9Z" opacity="0.45" />
    </svg>
  );
}

export function IdleSnake() {
  const dockRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [paused, setPaused] = useState(false);
  const [snake, setSnake] = useState<Point[]>([
    { x: 4, y: 7 },
    { x: 3, y: 7 },
    { x: 2, y: 7 },
  ]);
  const [food, setFood] = useState<Point>({ x: 10, y: 7 });
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [ranks, setRanks] = useState<SnakeRank[]>([]);
  const dir = useRef<Point>({ x: 1, y: 0 });
  const pending = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef(food);
  const scoreRef = useRef(0);
  const posted = useRef(false);
  foodRef.current = food;

  const resetGame = useCallback(() => {
    const start = [
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
    ];
    dir.current = { x: 1, y: 0 };
    pending.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    posted.current = false;
    setSnake(start);
    setFood(spawn(start));
    setDead(false);
    setScore(0);
    setPaused(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setWide(false);
    setPaused(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  const toggleWide = useCallback(() => {
    setWide((on) => {
      const next = !on;
      const node = dockRef.current;
      if (next) {
        void node?.requestFullscreen?.().catch(() => undefined);
      } else if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
      return next;
    });
  }, []);

  const togglePause = useCallback(() => {
    setPaused((on) => !on);
  }, []);

  const steer = useCallback((next: Point) => {
    if (next.x + dir.current.x === 0 && next.y + dir.current.y === 0) return;
    pending.current = next;
  }, []);

  useEffect(() => {
    let t: number | undefined;
    const bump = () => {
      if (t) window.clearTimeout(t);
      if (open || inForm()) return;
      t = window.setTimeout(() => {
        if (!inForm()) {
          resetGame();
          setWide(false);
          setOpen(true);
        }
      }, IDLE_MS);
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "pointerdown", "scroll", "wheel"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    bump();
    return () => {
      if (t) window.clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [open, resetGame]);

  useEffect(() => {
    if (!open) return;
    void getSnakeBoard().then((board) => {
      setSignedIn(board.signedIn);
      setMe(board.me);
      setRanks(board.ranks);
    });
  }, [open]);

  useEffect(() => {
    if (!open || dead || paused) return;
    let cancelled = false;
    let id = 0;
    const step = () => {
      if (cancelled) return;
      dir.current = pending.current;
      setSnake((prev) => {
        const head = {
          x: wrap(prev[0].x + dir.current.x, COLS),
          y: wrap(prev[0].y + dir.current.y, ROWS),
        };
        if (prev.some((p) => p.x === head.x && p.y === head.y)) {
          setDead(true);
          return prev;
        }
        const next = [head, ...prev];
        const bite = foodRef.current;
        if (head.x === bite.x && head.y === bite.y) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          setFood(spawn(next));
          return next;
        }
        next.pop();
        return next;
      });
      id = window.setTimeout(step, tickMs(scoreRef.current));
    };
    id = window.setTimeout(step, tickMs(scoreRef.current));
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [open, dead, paused]);

  useEffect(() => {
    if (!open || !dead || !signedIn || posted.current) return;
    posted.current = true;
    if (scoreRef.current < 1) return;
    void submitSnakeScore(scoreRef.current).then((board) => {
      setRanks(board.ranks);
      setMe(board.me);
    });
  }, [open, dead, signedIn]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space" || e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (!dead) setPaused((on) => !on);
        return;
      }
      const next = DIRS[e.key] ?? DIRS[e.key.toLowerCase()];
      if (!next) return;
      e.preventDefault();
      steer(next);
    };
    const onFs = () => {
      if (!document.fullscreenElement) setWide(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [open, dead, steer]);

  if (!open) return null;

  const overlay = dead ? "ate itself" : paused ? "paused" : null;

  return (
    <aside
      ref={dockRef}
      className={`${styles.dock} ${wide ? styles.wide : ""}`}
      role="dialog"
      aria-label="Idle snake"
    >
      <header className={styles.bar}>
        <span>idle.process // snake</span>
        <span className={styles.actions}>
          <button type="button" className={styles.full} onClick={togglePause} disabled={dead}>
            {paused ? "resume" : "pause"}
          </button>
          <button type="button" className={styles.full} onClick={toggleWide}>
            {wide ? "exit full" : "full screen"}
          </button>
          <button type="button" onClick={close} aria-label="Close snake">
            ×
          </button>
        </span>
      </header>
      <div className={styles.play}>
        <div className={styles.stage}>
          <div
            className={styles.board}
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
          >
            {Array.from({ length: COLS * ROWS }, (_, i) => {
              const x = i % COLS;
              const y = Math.floor(i / COLS);
              const body = snake.findIndex((p) => p.x === x && p.y === y);
              const isFood = food.x === x && food.y === y;
              return (
                <i
                  key={i}
                  className={
                    body === 0 ? styles.head : body > 0 ? styles.seg : isFood ? styles.food : styles.cell
                  }
                />
              );
            })}
          </div>
          {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
        </div>
        <ol className={styles.ranks} aria-label="Leaderboard">
          <li className={styles.rankHead}>leaderboard</li>
          {ranks.length === 0 ? (
            <li className={styles.empty}>{signedIn ? "no scores yet" : "sign in to rank"}</li>
          ) : (
            ranks.map((row, i) => {
              const place = (i + 1) as 1 | 2 | 3;
              return (
                <li key={row.userId} className={row.userId === me ? styles.mine : undefined}>
                  <span className={styles.place}>
                    {i < 3 ? <Cup place={place} /> : <span className={styles.hash}>{i + 1}</span>}
                  </span>
                  <span className={styles.who}>{row.name}</span>
                  <span className={styles.pts}>{String(row.best).padStart(3, "0")}</span>
                </li>
              );
            })
          )}
          {!signedIn ? <li className={styles.hint}>logged-in accounts only</li> : null}
        </ol>
      </div>
      <footer className={styles.meta}>
        <span>SCORE {String(score).padStart(3, "0")}</span>
        <span>{dead ? "ate itself — replay" : paused ? "paused · space" : "slow → faster"}</span>
        {dead ? (
          <button type="button" onClick={resetGame}>
            replay
          </button>
        ) : (
          <button type="button" onClick={togglePause}>
            {paused ? "resume" : "pause"}
          </button>
        )}
      </footer>
      <div className={styles.pad} aria-hidden={!wide}>
        <button type="button" className={styles.up} onPointerDown={() => steer({ x: 0, y: -1 })}>
          ▲
        </button>
        <button type="button" className={styles.left} onPointerDown={() => steer({ x: -1, y: 0 })}>
          ◀
        </button>
        <button
          type="button"
          className={styles.ok}
          onPointerDown={dead ? resetGame : togglePause}
        >
          {dead ? "GO" : paused ? "▶" : "Ⅱ"}
        </button>
        <button type="button" className={styles.right} onPointerDown={() => steer({ x: 1, y: 0 })}>
          ▶
        </button>
        <button type="button" className={styles.down} onPointerDown={() => steer({ x: 0, y: 1 })}>
          ▼
        </button>
      </div>
    </aside>
  );
}
