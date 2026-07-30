"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════
   1. Жеті жарғы — тамга-печать (scale + rotate)
   ═══════════════════════════════════════════════════════════ */
export function TamgaAccent({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  const stampRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!stampRef.current || !cardRef.current) return;
    const el = stampRef.current;
    gsap.set(el, { scale: 1.8, rotation: -15, opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top center",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          scale: 1,
          rotation: 0,
          opacity: 0.65,
          duration: 0.6,
          ease: "back.out(1.6)",
        });
      },
    });
    return () => st.kill();
  }, [cardRef]);

  return (
    <svg
      ref={stampRef}
      className="tamga-stamp"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Тамга-стилизация: солнце + триquetra */}
      <circle cx="26" cy="26" r="23" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Центральный солярный знак */}
      <circle cx="26" cy="26" r="4" stroke="currentColor" strokeWidth="1.2" />
      {/* 8 лучей */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 26 + 6 * Math.cos(rad);
        const y1 = 26 + 6 * Math.sin(rad);
        const x2 = 26 + 13 * Math.cos(rad);
        const y2 = 26 + 13 * Math.sin(rad);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        );
      })}
      {/* Ромбы на ободке */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 26 + 20 * Math.cos(rad);
        const cy = 26 + 20 * Math.sin(rad);
        return <circle key={deg} cx={cx} cy={cy} r="1.2" fill="currentColor" opacity="0.7" />;
      })}
      <style>{`.tamga-stamp { color: var(--accent); }`}</style>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. Советский период — typewriter-эффект
   ═══════════════════════════════════════════════════════════ */
export function TypewriterText({
  text,
  cardRef,
}: {
  text: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [displayed, setDisplayed] = useState("");
  const triggered = useRef(false);

  useEffect(() => {
    if (!cardRef.current) return;
    const st = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top center",
      once: true,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        let i = 0;
        const interval = setInterval(() => {
          i++;
          setDisplayed(text.slice(0, i));
          if (i >= text.length) clearInterval(interval);
        }, 22);
      },
    });
    return () => st.kill();
  }, [text, cardRef]);

  return (
    <p className="typewriter-text">
      {displayed}
      {displayed.length < text.length && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            background: "var(--accent)",
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            animation: "cursorBlink 0.7s steps(1) infinite",
          }}
        />
      )}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. 1993 — clip-path reveal (inset top→bottom)
   ═══════════════════════════════════════════════════════════ */
export function useClipReveal(
  cardInnerRef: React.RefObject<HTMLDivElement | null>,
  milestoneRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    if (!cardInnerRef.current || !milestoneRef.current) return;
    const el = cardInnerRef.current;
    gsap.set(el, { clipPath: "inset(0 0 100% 0 round 16px)" });

    const st = ScrollTrigger.create({
      trigger: milestoneRef.current,
      start: "top center",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          clipPath: "inset(0 0 0% 0 round 16px)",
          duration: 0.85,
          ease: "power3.out",
        });
      },
    });
    return () => st.kill();
  }, [cardInnerRef, milestoneRef]);
}

/* ═══════════════════════════════════════════════════════════
   4. 1995 — SVG emblem stroke-draw
   ═══════════════════════════════════════════════════════════ */
export function EmblemDraw({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !cardRef.current) return;
    const paths = svgRef.current.querySelectorAll<SVGGeometryElement>("path, circle, polygon");

    paths.forEach((p) => {
      const len = p.getTotalLength?.() ?? 80;
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    });

    const st = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top center",
      once: true,
      onEnter: () => {
        paths.forEach((p, i) => {
          gsap.to(p, {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: "power2.inOut",
            delay: i * 0.12,
          });
        });
      },
    });
    return () => st.kill();
  }, [cardRef]);

  return (
    /* Стилизованный солнечный герб — абстрактная геральдика */
    <svg
      ref={svgRef}
      className="emblem-draw"
      viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Внешний круг */}
      <circle cx="28" cy="28" r="25" />
      {/* Внутренний круг */}
      <circle cx="28" cy="28" r="16" />
      {/* Центр */}
      <circle cx="28" cy="28" r="5" />
      {/* Звезда-лучи */}
      <path d="M28 3 L30 12 L28 11 L26 12 Z" />
      <path d="M53 28 L44 30 L45 28 L44 26 Z" />
      <path d="M28 53 L26 44 L28 45 L30 44 Z" />
      <path d="M3 28 L12 26 L11 28 L12 30 Z" />
      {/* Диагональные лучи */}
      <path d="M45.7 10.3 L38.5 19.5 L37.5 18.5 L40 10 Z" />
      <path d="M45.7 45.7 L36.5 38.5 L37.5 37.5 L46 40 Z" />
      <path d="M10.3 45.7 L17.5 36.5 L18.5 37.5 L10 46 Z" />
      <path d="M10.3 10.3 L19.5 17.5 L18.5 18.5 L10 10 Z" />
      {/* Лавровые ветви (стилизация) */}
      <path d="M18 38 Q14 34 16 28 Q18 34 22 36 Z" />
      <path d="M38 38 Q42 34 40 28 Q38 34 34 36 Z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. 2022 — referendum donut + bar chart + count-up
   ═══════════════════════════════════════════════════════════ */
export function ReferendumWidget({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  const donutRef = useRef<SVGCircleElement>(null);
  const barForRef = useRef<HTMLDivElement>(null);
  const barAgainstRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  // r=26, circumference = 2π×26 ≈ 163.36
  const CIRC = 163.36;
  const PCT = 77.18; // % за

  useEffect(() => {
    if (!cardRef.current) return;
    const st = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top center",
      once: true,
      onEnter: () => {
        // donut fill
        if (donutRef.current) {
          gsap.to(donutRef.current, {
            strokeDashoffset: CIRC * (1 - PCT / 100),
            duration: 1.5,
            ease: "power2.out",
          });
        }
        // bars
        if (barForRef.current) {
          gsap.to(barForRef.current, { width: `${PCT}%`, duration: 1.4, ease: "power2.out" });
        }
        if (barAgainstRef.current) {
          gsap.to(barAgainstRef.current, { width: `${100 - PCT}%`, duration: 1.4, ease: "power2.out", delay: 0.1 });
        }
        // count-up label
        if (labelRef.current) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: PCT,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
              if (labelRef.current) labelRef.current.textContent = obj.val.toFixed(1) + "%";
            },
          });
        }
      },
    });
    return () => st.kill();
  }, [cardRef]);

  return (
    <div className="referendum-widget" aria-label="2022 жылғы референдум нәтижелері">
      <div className="ref-donut">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle className="ref-donut-track" cx="32" cy="32" r="26" />
          <circle
            ref={donutRef}
            className="ref-donut-fill"
            cx="32"
            cy="32"
            r="26"
            style={{ strokeDashoffset: CIRC }}
          />
        </svg>
        <div className="ref-donut-label" ref={labelRef}>0%</div>
      </div>

      <div className="ref-bars">
        <div className="ref-bar-row">
          <div className="ref-bar-label">Өзгерістер үшін</div>
          <div className="ref-bar-track">
            <div ref={barForRef} className="ref-bar-fill" style={{ width: "0%" }} />
          </div>
        </div>
        <div className="ref-bar-row">
          <div className="ref-bar-label">Қарсы</div>
          <div className="ref-bar-track">
            <div ref={barAgainstRef} className="ref-bar-fill parliament" style={{ width: "0%" }} />
          </div>
        </div>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          Қатысу 68,05% · ҚР ОСК, 05.06.2022
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. 2026 — circular progress donut (84%) + count-up
   ═══════════════════════════════════════════════════════════ */
export function ProgressWidget({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  const donutRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  // r=30, circumference = 2π×30 ≈ 188.5
  const CIRC = 188.5;
  const PCT = 84;

  useEffect(() => {
    if (!cardRef.current) return;
    const st = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top center",
      once: true,
      onEnter: () => {
        if (donutRef.current) {
          gsap.to(donutRef.current, {
            strokeDashoffset: CIRC * (1 - PCT / 100),
            duration: 1.8,
            ease: "power2.out",
          });
        }
        if (labelRef.current) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: PCT,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: () => {
              if (labelRef.current)
                labelRef.current.textContent = Math.round(obj.val) + "%";
            },
          });
        }
      },
    });
    return () => st.kill();
  }, [cardRef]);

  return (
    <div className="progress-widget" aria-label="2026 жылғы конституциялық өзгерістер индикаторы">
      <div className="prog-donut">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle className="prog-donut-track" cx="36" cy="36" r="30" />
          <circle
            ref={donutRef}
            className="prog-donut-fill"
            cx="36"
            cy="36"
            r="30"
            style={{ strokeDashoffset: CIRC }}
          />
        </svg>
        <div className="prog-donut-label">
          <div ref={labelRef}>0%</div>
          <span>статей</span>
        </div>
      </div>

      <div className="prog-info">
        <div className="prog-info-title">Өзгерістердің қамту аясы</div>
        <div className="prog-info-desc">
          2022–2026 жж. реформаларымен қамтылған Конституция баптарының үлесі
          (ҚР Заңнама институтының бағалауы бойынша)
        </div>
      </div>
    </div>
  );
}
