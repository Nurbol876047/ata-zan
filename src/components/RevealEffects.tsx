"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ════════════════════════════════════════════════════════════
   1. Жеті жарғы — ink-bleed: тамга «впечатывается» в пергамент
   ════════════════════════════════════════════════════════════ */
export function InkBleedEffect() {
  const stampRef = useRef<SVGGElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stampRef.current || !inkRef.current) return;
    const paths = stampRef.current.querySelectorAll<SVGGeometryElement>("circle, line, path");
    paths.forEach((p) => {
      const len = p.getTotalLength?.() ?? 60;
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    });
    const tl = gsap.timeline();
    // чернильное растекание
    tl.fromTo(inkRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" });
    // прорисовка тамги
    tl.to(paths, { strokeDashoffset: 0, duration: 0.7, stagger: 0.04, ease: "power2.inOut" }, "-=0.2");
    // штамп-удар
    tl.fromTo(stampRef.current, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.35, ease: "back.out(2)" }, "-=0.5");
  }, []);

  return (
    <div className="reveal-effect-wrap" aria-hidden="true">
      {/* Чернильное пятно */}
      <div ref={inkRef} className="ink-bleed" />
      {/* Тамга */}
      <svg viewBox="0 0 80 80" className="ink-tamga" xmlns="http://www.w3.org/2000/svg">
        <g ref={stampRef} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="40" cy="40" r="34" opacity="0.7" />
          <circle cx="40" cy="40" r="22" opacity="0.5" />
          <circle cx="40" cy="40" r="6" />
          {[0,45,90,135,180,225,270,315].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return <line key={deg}
              x1={40 + 9 * Math.cos(r)} y1={40 + 9 * Math.sin(r)}
              x2={40 + 20 * Math.cos(r)} y2={40 + 20 * Math.sin(r)} />;
          })}
          {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((deg) => {
            const r = (deg * Math.PI) / 180;
            const cx = 40 + 29 * Math.cos(r), cy = 40 + 29 * Math.sin(r);
            return <circle key={deg} cx={cx} cy={cy} r="1.8" fill="currentColor" />;
          })}
        </g>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   2. ҚазКСР — crossfade 1937 ↔ 1978 обложки + typewriter
   ════════════════════════════════════════════════════════════ */
export function ConstitutionCrossfade() {
  const c37 = useRef<HTMLDivElement>(null);
  const c78 = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLSpanElement>(null);
  const PHRASE = "Халық — билік иесі";

  useEffect(() => {
    if (!c37.current || !c78.current || !typeRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(c37.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" });
    tl.to(c37.current, { opacity: 0, x: -15, duration: 0.4 }, "+=0.6");
    tl.fromTo(c78.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, "-=0.1");

    // typewriter
    let i = 0;
    tl.call(() => {
      const iv = setInterval(() => {
        if (typeRef.current) typeRef.current.textContent = PHRASE.slice(0, ++i);
        if (i >= PHRASE.length) clearInterval(iv);
      }, 40);
    }, [], "+=0.2");
  }, []);

  return (
    <div className="reveal-effect-wrap crossfade-wrap" aria-hidden="true">
      <div ref={c37} className="constitution-cover cover-1937">
        <div className="cover-year">1937</div>
        <div className="cover-title">ҚазКСР<br/>Конституциясы</div>
        <div className="cover-star">★</div>
      </div>
      <div ref={c78} className="constitution-cover cover-1978" style={{ opacity: 0 }}>
        <div className="cover-year">1978</div>
        <div className="cover-title">ҚазКСР<br/>Конституциясы</div>
        <div className="cover-star">☭</div>
      </div>
      <div className="cover-typewriter">
        «<span ref={typeRef}></span>»
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   3. 1993 — флаг РК поднимается по флагштоку
   ════════════════════════════════════════════════════════════ */
export function FlagRaise() {
  const flagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flagRef.current) return;
    gsap.fromTo(flagRef.current,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.4, ease: "power3.out",
        onComplete: () => {
          gsap.to(flagRef.current, {
            rotationY: 8, rotationZ: 2, yoyo: true, repeat: -1,
            duration: 1.8, ease: "sine.inOut", transformOrigin: "left center"
          });
        }
      }
    );
  }, []);

  return (
    <div className="reveal-effect-wrap flag-wrap" aria-hidden="true">
      <div className="flagpole" />
      <div ref={flagRef} className="flag-kz">
        <div className="flag-blue">
          <div className="flag-sun">☀</div>
          <div className="flag-eagle">🦅</div>
        </div>
        <div className="flag-stripe" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4. 1995 — весы раскрываются + count-up 89%
   ════════════════════════════════════════════════════════════ */
export function ScalesReveal() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo([leftRef.current, rightRef.current],
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.7, stagger: 0.12, ease: "back.out(1.4)",
        transformOrigin: "center" }
    );
    const obj = { v: 0 };
    tl.to(obj, {
      v: 89,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(obj.v) + "%";
      }
    }, "-=0.5");
  }, []);

  return (
    <div className="reveal-effect-wrap scales-wrap" aria-hidden="true">
      <div className="scales-beam">
        <div ref={leftRef} className="scales-pan scales-left">
          <div className="scales-pan-label">Мемлекет</div>
        </div>
        <div className="scales-center">⚖</div>
        <div ref={rightRef} className="scales-pan scales-right">
          <div className="scales-pan-label">Азамат</div>
        </div>
      </div>
      <div className="scales-stat">
        Дауыс: <span ref={numRef} className="scales-num">0%</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   5. 2022 — before/after структура власти + count-up 77.2%
   ════════════════════════════════════════════════════════════ */
export function PowerShift() {
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(beforeRef.current, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" });
    tl.fromTo(afterRef.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");
    const obj = { v: 0 };
    tl.to(obj, {
      v: 77.18,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = obj.v.toFixed(1) + "%";
      }
    }, "-=0.4");
  }, []);

  return (
    <div className="reveal-effect-wrap power-wrap" aria-hidden="true">
      <div className="power-columns">
        <div ref={beforeRef} className="power-col power-before">
          <div className="power-label">2021</div>
          <div className="power-bars">
            <div className="power-bar" style={{ height: "72px" }}>Президент</div>
            <div className="power-bar slim" style={{ height: "28px" }}>Парламент</div>
          </div>
        </div>
        <div className="power-arrow">→</div>
        <div ref={afterRef} className="power-col power-after">
          <div className="power-label">2022</div>
          <div className="power-bars">
            <div className="power-bar" style={{ height: "54px" }}>Президент</div>
            <div className="power-bar slim" style={{ height: "46px" }}>Парламент</div>
          </div>
        </div>
      </div>
      <div className="power-stat">
        Реформа үшін: <span ref={numRef} className="power-num">0%</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   6. 2026 — donut 0→84% + glassmorphism reveal
   ════════════════════════════════════════════════════════════ */
export function DonutReveal() {
  const circleRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLDivElement>(null);
  const CIRC = 188.5; // 2π×30

  useEffect(() => {
    const tl = gsap.timeline();
    tl.to(circleRef.current, {
      strokeDashoffset: CIRC * 0.16,
      duration: 1.8,
      ease: "power2.out"
    });
    const obj = { v: 0 };
    tl.to(obj, {
      v: 84,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(obj.v) + "%";
      }
    }, "<");
  }, []);

  return (
    <div className="reveal-effect-wrap donut-wrap" aria-hidden="true">
      <div className="donut-ring">
        <svg width="90" height="90" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(var(--accent-rgb),0.1)" strokeWidth="7" />
          <circle
            ref={circleRef}
            cx="36" cy="36" r="30"
            fill="none"
            stroke="rgba(var(--accent-rgb),0.9)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
            style={{ filter: "drop-shadow(0 0 6px rgba(var(--accent-rgb),0.5))" }}
          />
        </svg>
        <div className="donut-label">
          <div ref={numRef} className="donut-num">0%</div>
          <div className="donut-sub">өзгертілді</div>
        </div>
      </div>
      <div className="donut-caption">2022–2026 жж. конституциялық реформалар</div>
    </div>
  );
}
