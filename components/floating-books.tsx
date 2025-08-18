"use client";

import React, { useEffect, useRef, useState } from "react";

type Item = {
  left: number;
  delay: number;
  dur: number;
  sway: number;
  scale: number;
  rz: number;
  rx: number;
  ry: number;
  width: number;
  alpha: number;
  src: string;
};

// Module-scoped cache to survive Strict Mode remounts and avoid recompute
let CACHED_ITEMS: Item[] | null = null;

// Deterministic PRNG (Mulberry32)
function seededRng(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function FloatingBooksWallpaper() {

  // Start with a placeholder, then hydrate from public/data/books.json
  const [srcs, setSrcs] = useState<string[]>([
    "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1728768241i/17332218._SY75_.jpg",
  ]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/books.json", { cache: "force-cache" });
        if (!res.ok) return;
        const data = await res.json();
        const images: string[] = Array.isArray(data?.images)
          ? (data.images as string[]).filter(Boolean)
          : Array.isArray(data)
          ? (data as string[]).filter(Boolean)
          : [];
        if (!cancelled && images.length) {
          setSrcs(images);
        }
      } catch {}
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute once and cache globally so it never changes during the session
  const itemsRef = useRef<Item[] | null>(null);
  if (ready && !CACHED_ITEMS) {
    const seed = 1337421; // constant seed for deterministic wallpaper
    const rnd = seededRng(seed);
    const rand = (min: number, max: number) => rnd() * (max - min) + min;

    // Determine count once based on first render viewport
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const count = vw >= 1280 ? 15 : vw >= 1024 ? 12 : vw >= 768 ? 9 : 6;

    // Build a unique pool (seeded shuffle and take up to count)
    const pool = srcs.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const countLimited = Math.min(count, Math.max(pool.length, 1));
    const chosen = pool.length ? pool.slice(0, countLimited) : [srcs[0]];

    const results: Item[] = [];

    // Variable-radius Poisson placement
    const margin = 32; // px safe border
    const minW = 52;
    const maxW = 70;

    type Disk = { x: number; y: number; r: number };
    const disks: Disk[] = [];

    const maxAttempts = 1000;
    let attempts = 0;
    while (disks.length < countLimited && attempts < maxAttempts) {
      attempts++;
      const scale = rand(0.9, 1.2);
      const width = Math.round(rand(minW, maxW));
      const hEst = width * 1.5 * scale;
      const pad = 10;
      const r = 0.5 * Math.hypot(width, hEst) + pad;

      const x = rand(margin + r, vw - margin - r);
      const y = rand(margin + r, vh - margin - r);

      const ok = disks.every((d) => {
        const dx = d.x - x;
        const dy = d.y - y;
        return dx * dx + dy * dy > (d.r + r) * (d.r + r);
      });
      if (!ok) continue;
      disks.push({ x, y, r });
    }

    for (let i = 0; i < disks.length; i++) {
      const src = chosen[i % chosen.length];
      // Extremely slow motion
      const dur = rand(360, 600);
      const sway = rand(24, 40);
      const scale = rand(0.9, 1.2);
      const rz = rand(-20, 20);
      const rx = rand(-6, 6);
      const ry = rand(-14, 14);
      let width = Math.max(minW, Math.min(maxW, Math.round(disks[i].r * 1.2)));
      const alpha = rand(0.22, 0.35);

      const x = disks[i].x;
      const y = disks[i].y;
      const leftPct = (x / Math.max(vw, 1)) * 100;
      const progress = y / Math.max(vh, 1);
      const delay = -progress * dur;

      results.push({
        left: leftPct,
        delay,
        dur,
        sway,
        scale,
        rz,
        rx,
        ry,
        width,
        alpha,
        src,
      });
    }
    CACHED_ITEMS = results;
  }
  if (!itemsRef.current) itemsRef.current = CACHED_ITEMS;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {(itemsRef.current ?? []).map((b, idx) => (
        <div
          key={idx}
          className="floating-book"
          style={{
            left: `${b.left}%`,
            // CSS custom properties used by animations
            // @ts-ignore
            "--dur": `${b.dur}s`,
            // @ts-ignore
            "--delay": `${b.delay}s`,
            // @ts-ignore
            "--swayDur": `${b.sway}s`,
            // @ts-ignore
            "--scale": b.scale,
            // @ts-ignore
            "--rz": `${b.rz}deg`,
            // @ts-ignore
            "--rx": `${b.rx}deg`,
            // @ts-ignore
            "--ry": `${b.ry}deg`,
            // @ts-ignore
            "--w": `${b.width}px`,
            // @ts-ignore
            "--alpha": b.alpha,
          } as React.CSSProperties}
        >
          <span className="floating-book-inner relative floating-book-spine">
            <img
              src={b.src}
              alt="floating book"
              className="floating-book-img"
              loading="lazy"
              decoding="async"
            />
          </span>
        </div>
      ))}
    </div>
  );
}
