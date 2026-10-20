"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getSnakeBoard, submitSnakeScore, type SnakeRank } from "@/app/actions/snake";
import styles from "./IdleSnake.module.scss";

const COLS = 18;
const ROWS = 14;
const IDLE_MS = 15000;
const SWIPE_PX = 10;

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

type Vec = { x: number; y: number };

function vsub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}
function vadd(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}
function vmul(a: Vec, s: number): Vec {
  return { x: a.x * s, y: a.y * s };
}
function vlen(a: Vec) {
  return Math.hypot(a.x, a.y) || 1;
}
function vnorm(a: Vec): Vec {
  const l = vlen(a);
  return { x: a.x / l, y: a.y / l };
}
function vperp(a: Vec): Vec {
  return { x: -a.y, y: a.x };
}
function cellCenter(p: Point): Vec {
  return { x: p.x + 0.5, y: p.y + 0.5 };
}

function bodyChains(body: Point[]): Point[][] {
  if (!body.length) return [];
  const tailFirst = [...body].reverse();
  const chains: Point[][] = [[tailFirst[0]]];
  for (let i = 1; i < tailFirst.length; i++) {
    const prev = tailFirst[i - 1];
    const next = tailFirst[i];
    const adjacent = Math.abs(prev.x - next.x) + Math.abs(prev.y - next.y) === 1;
    if (adjacent) chains[chains.length - 1].push(next);
    else chains.push([next]);
  }
  return chains;
}

function smoothCenters(points: Vec[]): Vec[] {
  if (points.length < 3) return points;
  const out: Vec[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const inn = vnorm(vsub(curr, prev));
    const outDir = vnorm(vsub(next, curr));
    const turning = Math.abs(inn.x - outDir.x) > 0.2 || Math.abs(inn.y - outDir.y) > 0.2;
    if (!turning) {
      out.push(curr);
      continue;
    }
    const cut = 0.46;
    const a = vsub(curr, vmul(inn, cut));
    const b = vadd(curr, vmul(outDir, cut));
    const steps = 7;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      out.push({
        x: u * u * a.x + 2 * u * t * curr.x + t * t * b.x,
        y: u * u * a.y + 2 * u * t * curr.y + t * t * b.y,
      });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function densify(points: Vec[], step = 0.14): Vec[] {
  if (points.length < 2) return points;
  const out: Vec[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const pieces = Math.max(1, Math.ceil(vlen(vsub(b, a)) / step));
    for (let k = 1; k <= pieces; k++) {
      const t = k / pieces;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

function weave(samples: Vec[], phase: number, offset: number): Vec[] {
  return samples.map((p, i) => {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const normal = vperp(vnorm(vsub(next, prev)));
    const t = i / Math.max(1, samples.length - 1);
    const fade = Math.sin(t * Math.PI);
    const wave = Math.sin(phase * 5 + (offset + i) * 0.18) * 0.22 * fade;
    return vadd(p, vmul(normal, wave));
  });
}

function ribbonPath(samples: Vec[], pointedTail: boolean): string {
  if (samples.length < 2) return "";
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let i = 0; i < samples.length; i++) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const normal = vperp(vnorm(vsub(next, prev)));
    const t = i / (samples.length - 1);
    const grow = pointedTail ? Math.pow(Math.min(1, t / 0.34), 1.35) : 1;
    const width = 0.34 * grow;
    left.push(vadd(samples[i], vmul(normal, width)));
    right.push(vadd(samples[i], vmul(normal, -width)));
  }
  const cmd = (p: Vec) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  return `M ${cmd(left[0])} ${left.slice(1).map((p) => `L ${cmd(p)}`).join(" ")} ${right
    .reverse()
    .map((p) => `L ${cmd(p)}`)
    .join(" ")} Z`;
}

function SnakeFigure({ snake, food }: { snake: Point[]; food: Point }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let frame = 0;
    const loop = (now: number) => {
      setPhase(now / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const chains = bodyChains(snake);
  let walked = 0;
  const bodies = chains.map((chain, index) => {
    const centers = smoothCenters(chain.map(cellCenter));
    const samples = weave(densify(centers), phase, walked);
    walked += samples.length;
    const headChain = index === chains.length - 1;
    const tailChain = index === 0;
    const end = samples[samples.length - 1] ?? cellCenter(chain[chain.length - 1]);
    const before = samples[Math.max(0, samples.length - 2)] ?? end;
    const facing = vnorm(vsub(end, before));
    return {
      key: index,
      d: ribbonPath(samples, tailChain),
      head: headChain ? vadd(end, vmul(facing, 0.08)) : null,
      facing,
    };
  });
  const head = bodies.find((part) => part.head)?.head;
  const facing = bodies.find((part) => part.head)?.facing ?? { x: 1, y: 0 };
  const angle = (Math.atan2(facing.y, facing.x) * 180) / Math.PI;

  return (
    <svg className={styles.figure} viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="xMidYMid meet">
      <rect width={COLS} height={ROWS} fill="#12171b" />
      <circle cx={food.x + 0.5} cy={food.y + 0.5} r="0.42" fill="#e2b84a" opacity="0.22" />
      <circle cx={food.x + 0.5} cy={food.y + 0.5} r="0.26" fill="#e2b84a" />
      {bodies.map((part) =>
        part.d ? <path key={part.key} d={part.d} fill="#178f86" /> : null,
      )}
      {head ? (
        <g transform={`translate(${head.x.toFixed(2)} ${head.y.toFixed(2)}) rotate(${angle.toFixed(2)})`}>
          <ellipse cx="0.06" cy="0" rx="0.46" ry="0.33" fill="#178f86" />
          <ellipse cx="0.14" cy="0" rx="0.4" ry="0.28" fill="#5ec4bc" />
          <circle cx="0.32" cy="-0.11" r="0.055" fill="#07120f" />
          <circle cx="0.32" cy="0.11" r="0.055" fill="#07120f" />
          <circle cx="0.338" cy="-0.122" r="0.018" fill="#e7fff8" />
          <circle cx="0.338" cy="0.098" r="0.018" fill="#e7fff8" />
        </g>
      ) : null}
    </svg>
  );
}

function inForm() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

/** Survives client navigation. A full reload starts a new module and clears it. */
let dismissedUntilReload = false;

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
  const [touchUi, setTouchUi] = useState(false);
  const dir = useRef<Point>({ x: 1, y: 0 });
  const pending = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef(food);
  const scoreRef = useRef(0);
  const posted = useRef(false);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const stepTimer = useRef(0);
  const dueAt = useRef(0);
  const stepFn = useRef<(() => void) | null>(null);
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
    dismissedUntilReload = true;
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
    const queued = pending.current;
    if (next.x === queued.x && next.y === queued.y) return;
    if (next.x + queued.x === 0 && next.y + queued.y === 0) return;
    pending.current = next;
    const wait = dueAt.current - performance.now();
    if (stepFn.current && wait > 48) {
      window.clearTimeout(stepTimer.current);
      dueAt.current = performance.now() + 32;
      stepTimer.current = window.setTimeout(stepFn.current, 32);
    }
  }, []);

  const onSwipeStart = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onSwipeMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = swipe.current;
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) steer({ x: dx > 0 ? 1 : -1, y: 0 });
      else steer({ x: 0, y: dy > 0 ? 1 : -1 });
      swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    [steer],
  );

  const onSwipeEnd = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (swipe.current?.id === e.pointerId) swipe.current = null;
  }, []);

  const onSwipeCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (swipe.current?.id === e.pointerId) swipe.current = null;
  }, []);

  useEffect(() => {
    if (dismissedUntilReload) return;
    let t: number | undefined;
    const bump = () => {
      if (t) window.clearTimeout(t);
      if (open || inForm() || dismissedUntilReload) return;
      t = window.setTimeout(() => {
        if (!inForm() && !dismissedUntilReload) {
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
      const delay = tickMs(scoreRef.current);
      dueAt.current = performance.now() + delay;
      stepTimer.current = window.setTimeout(step, delay);
    };
    stepFn.current = step;
    const delay = tickMs(scoreRef.current);
    dueAt.current = performance.now() + delay;
    stepTimer.current = window.setTimeout(step, delay);
    return () => {
      cancelled = true;
      stepFn.current = null;
      window.clearTimeout(stepTimer.current);
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
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setTouchUi(mq.matches || navigator.maxTouchPoints > 0);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
        <div
          className={styles.stage}
          onPointerDown={onSwipeStart}
          onPointerMove={onSwipeMove}
          onPointerUp={onSwipeEnd}
          onPointerCancel={onSwipeCancel}
          aria-label={touchUi ? "Swipe to steer" : undefined}
        >
          <div className={styles.board}>
            <SnakeFigure snake={snake} food={food} />
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
        <span>
          {dead
            ? "ate itself — replay"
            : paused
              ? touchUi
                ? "paused"
                : "paused · space"
              : touchUi
                ? "swipe to turn"
                : "slow → faster"}
        </span>
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
      {touchUi ? null : (
        <div className={styles.pad} aria-hidden={!wide}>
          <button type="button" className={styles.up} onPointerDown={() => steer({ x: 0, y: -1 })}>
            ▲
          </button>
          <button type="button" className={styles.left} onPointerDown={() => steer({ x: -1, y: 0 })}>
            ◀
          </button>
          <button type="button" className={styles.ok} onPointerDown={dead ? resetGame : togglePause}>
            {dead ? "GO" : paused ? "▶" : "Ⅱ"}
          </button>
          <button type="button" className={styles.right} onPointerDown={() => steer({ x: 1, y: 0 })}>
            ▶
          </button>
          <button type="button" className={styles.down} onPointerDown={() => steer({ x: 0, y: 1 })}>
            ▼
          </button>
        </div>
      )}
    </aside>
  );
}
