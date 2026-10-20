"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.scss";

let audio: AudioContext | null = null;

/** Crisp rocker click. `on` is the brighter snap of turning a light on. */
function playLightSwitch(on: boolean) {
  try {
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    audio ??= new Ctor();
    if (audio.state === "suspended") void audio.resume();

    const t = audio.currentTime;
    const master = audio.createGain();
    master.gain.value = 0.7;
    master.connect(audio.destination);

    const samples = Math.floor(audio.sampleRate * 0.014);
    const buffer = audio.createBuffer(1, samples, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / samples) ** 3;
    }
    const snap = audio.createBufferSource();
    snap.buffer = buffer;
    const snapFilter = audio.createBiquadFilter();
    snapFilter.type = "bandpass";
    snapFilter.frequency.value = on ? 3400 : 1900;
    snapFilter.Q.value = 0.85;
    const snapGain = audio.createGain();
    snapGain.gain.setValueAtTime(on ? 0.85 : 0.62, t);
    snap.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(master);

    const knock = audio.createOscillator();
    knock.type = "sine";
    knock.frequency.setValueAtTime(on ? 480 : 280, t);
    knock.frequency.exponentialRampToValueAtTime(on ? 160 : 95, t + 0.05);
    const knockGain = audio.createGain();
    knockGain.gain.setValueAtTime(0.0001, t);
    knockGain.gain.exponentialRampToValueAtTime(on ? 0.42 : 0.34, t + 0.004);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    knock.connect(knockGain);
    knockGain.connect(master);

    snap.start(t);
    snap.stop(t + 0.02);
    knock.start(t);
    knock.stop(t + 0.07);
  } catch {
    // Theme still changes if the browser blocks audio.
  }
}

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
        playLightSwitch(next === "light");
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
