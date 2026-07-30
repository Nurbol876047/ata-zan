"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { timelineData } from "@/data/timeline";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GestureProvider, useGesture } from "@/context/GestureContext";
import { CameraModal, GestureHint, GestureOrchestrator } from "@/components/GestureUI";
import { MuseumRoom } from "@/components/MuseumRoom";
import {
  InkBleedEffect,
  ConstitutionCrossfade,
  FlagRaise,
  ScalesReveal,
  PowerShift,
  DonutReveal,
} from "@/components/RevealEffects";

gsap.registerPlugin(ScrollTrigger);

/* ── icons ────────────────────────────────────────────────── */
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function ExternalLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ── Reveal effect по id карточки ─────────────────────────── */
function RevealEffect({ id }: { id: string }) {
  switch (id) {
    case "zhety-zhargy":          return <InkBleedEffect />;
    case "kazssr-constitutions":  return <ConstitutionCrossfade />;
    case "constitution-1993":     return <FlagRaise />;
    case "constitution-1995":     return <ScalesReveal />;
    case "reform-2022":           return <PowerShift />;
    case "constitution-2026":     return <DonutReveal />;
    default:                      return null;
  }
}

/* ── Tamga stamp (ARMED dim overlay decoration) ───────────── */
function TamgaCorner() {
  return (
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="tamga-stamp" aria-hidden="true">
      <circle cx="26" cy="26" r="23" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <circle cx="26" cy="26" r="4" stroke="currentColor" strokeWidth="1.2" />
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <line key={deg}
          x1={26 + 6 * Math.cos(r)} y1={26 + 6 * Math.sin(r)}
          x2={26 + 13 * Math.cos(r)} y2={26 + 13 * Math.sin(r)}
          stroke="currentColor" strokeWidth="1" strokeLinecap="round" />;
      })}
      <style>{`.tamga-stamp { color: var(--accent); }`}</style>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════
   MilestoneCard — IDLE / ARMED / REVEALED state machine
   ════════════════════════════════════════════════════════════ */
const ACCENT_CLASS: Record<string, string> = {
  "zhety-zhargy": "accent-zhety",
  "kazssr-constitutions": "accent-soviet",
  "constitution-1993": "accent-1993",
  "constitution-1995": "accent-1995",
  "reform-2022": "accent-2022",
  "constitution-2026": "accent-2026",
};

const MilestoneCard = forwardRef<
  HTMLDivElement,
  { milestone: (typeof timelineData)[0]; index: number; isActive: boolean; isGlowing?: boolean }
>(function MilestoneCard({ milestone, index, isActive, isGlowing }, outerRef) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const isEven = index % 2 === 1;

  const { cardStates, cameraState, armCard, revealCard, openCameraModal, museumCardId, openMuseum, closeMuseum } = useGesture();
  const cardState = cardStates[milestone.id] ?? "idle";

  const milestoneRowRef = useRef<HTMLDivElement | null>(null);
  const setRefs = (el: HTMLDivElement | null) => {
    milestoneRowRef.current = el;
    if (typeof outerRef === "function") outerRef(el);
    else if (outerRef) outerRef.current = el;
  };

  /* ── Клик/тап — fallback reveal + accordion ── */
  const handleCardClick = () => {
    if (cardState !== "revealed") {
      revealCard(milestone.id);
      return;
    }
    setAccordionOpen((v) => !v);
  };

  const cardStateClass =
    cardState === "armed" ? "state-armed" :
    cardState === "revealed" ? "state-revealed" : "";

  return (
    <div
      ref={setRefs}
      id={`milestone-${milestone.id}`}
      className={`milestone ${isActive ? "is-active" : ""} ${isEven ? "milestone-even" : "milestone-odd"} ${ACCENT_CLASS[milestone.id] ?? ""} ${isGlowing ? "is-glowing" : ""}`}
      style={{ "--accent": milestone.themeColor, "--accent-rgb": milestone.accentRgb } as React.CSSProperties}
    >
      {/* ── CARD ──────────────────────────────────────────── */}
      <div
        className={`milestone-card ${cardStateClass}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-expanded={accordionOpen}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      >
        <div 
          className="milestone-hero-img"
          style={{ backgroundImage: `url(${milestone.image})` }}
        />
        <div className="milestone-glow" />

        <div className="milestone-card-content">
          {milestone.id === "zhety-zhargy" && <TamgaCorner />}

          <p className="milestone-subtitle">{milestone.subtitle}</p>
          <h2 className="milestone-title">{milestone.title}</h2>
          <p className="milestone-description">{milestone.description}</p>

          {/* ── ARMED: пульсирующая подсказка ── */}
          {cardState === "armed" && (
            <GestureHint
              cameraUnavailable={cameraState === "denied" || cameraState === "unavailable"}
              onRequestCamera={openCameraModal}
            />
          )}

          {/* ── REVEALED: уникальный эффект ── */}
          {cardState === "revealed" && <RevealEffect id={milestone.id} />}

          {/* ── MUSEUM ENTRY BUTTON ── */}
          {cardState === "revealed" && milestone.museumStands && (
            <button 
              className="museum-entry-btn" 
              onClick={(e) => { e.stopPropagation(); openMuseum(milestone.id); }}
            >
              🖐 Музейге кіру
            </button>
          )}

          {/* ── Accordion (только в revealed) ── */}
          {cardState === "revealed" && (
            <>
              <button
                className="accordion-trigger"
                onClick={(e) => { e.stopPropagation(); setAccordionOpen((v) => !v); }}
              >
                <ChevronDown className={`accordion-chevron ${accordionOpen ? "open" : ""}`} />
                {accordionOpen ? "Жасыру" : "Негізгі деректер"}
              </button>
              <div className={`accordion-body ${accordionOpen ? "open" : ""}`}>
                <ul className="key-facts-list">
                  {milestone.keyFacts.map((fact, i) => (
                    <li key={i} className="key-fact">
                      <span className="key-fact-bullet" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
                <a href={milestone.source} target="_blank" rel="noopener noreferrer"
                  className="source-link" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink />
                  {milestone.sourceLabel}
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── DOT ─────────────────────────────────────────────── */}
      <div className="milestone-dot-col">
        <div className="milestone-dot" />
        <div className="milestone-line" />
      </div>

      {/* ── MUSEUM ROOM OVERLAY (PORTAL TO ESCAPE TRANSFORMS) ── */}
      {museumCardId === milestone.id && milestone.museumStands && typeof window !== "undefined" && createPortal(
        <MuseumRoom 
          id={milestone.id} 
          stands={milestone.museumStands} 
          onClose={closeMuseum} 
          sourceRect={milestoneRowRef.current?.getBoundingClientRect()}
        />,
        document.body
      )}

      {/* ── YEAR ────────────────────────────────────────────── */}
      <div className={`milestone-year-col ${isEven ? "milestone-year-right" : ""}`}>
        <div className="milestone-year">{milestone.yearShort}</div>
        <div className="milestone-era">{milestone.era}</div>
      </div>
    </div>
  );
});

/* ── Progress Sidebar ─────────────────────────────────────── */
function ProgressSidebar({ activeIdx }: { activeIdx: number }) {
  return (
    <nav className="progress-sidebar" aria-label="Дәуірлер бойынша навигация">
      <span className="progress-sidebar-label">Дәуірлер</span>
      {timelineData.map((m, i) => (
        <button key={m.id}
          className={`progress-pip ${i === activeIdx ? "active" : ""}`}
          style={{ "--accent": m.themeColor, "--accent-rgb": m.accentRgb } as React.CSSProperties}
          onClick={() => document.getElementById(`milestone-${m.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          aria-label={`Өту: ${m.title} (${m.yearShort})`}>
          <span className="progress-pip-tooltip">{m.yearShort} · {m.title}</span>
        </button>
      ))}
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   Inner page (needs GestureProvider above)
   ════════════════════════════════════════════════════════════ */
function PageInner() {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [hoveredThemeIndices, setHoveredThemeIndices] = useState<number[] | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const readingBarRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const conclusionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const themeGridRef = useRef<HTMLDivElement>(null);

  const { armCard, setActiveViewportCardId } = useGesture();

  useEffect(() => {
    setActiveViewportCardId(activeIdx >= 0 && activeIdx < timelineData.length ? timelineData[activeIdx].id : null);
  }, [activeIdx, setActiveViewportCardId]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* reading bar */
      if (readingBarRef.current) {
        gsap.set(readingBarRef.current, { scaleX: 0, transformOrigin: "left" });
        gsap.to(readingBarRef.current, {
          scaleX: 1, ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 },
        });
      }

      /* timeline line draw */
      if (lineRef.current && timelineRef.current) {
        gsap.fromTo(lineRef.current, { scaleY: 0 }, {
          scaleY: 1, ease: "none",
          scrollTrigger: { trigger: timelineRef.current, start: "top 80%", end: "bottom 20%", scrub: 0.6 },
        });
      }

      /* cards fade-in (global entry) */
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 82%", toggleActions: "play none none none" },
        });
      });

      /* ARMED trigger + active tracking */
      timelineData.forEach((m, i) => {
        const el = document.getElementById(`milestone-${m.id}`);
        if (!el) return;

        /* active highlight & ARM sync */
        ScrollTrigger.create({
          trigger: el, start: "top 55%", end: "bottom 45%",
          onEnter: () => {
            setActiveIdx(i);
            armCard(m.id);
          },
          onEnterBack: () => {
            setActiveIdx(i);
            armCard(m.id);
          },
          onLeave: () => setActiveIdx(-1),
          onLeaveBack: () => {
            const prev = i > 0 ? i - 1 : -1;
            setActiveIdx(prev);
            if (prev >= 0) {
              armCard(timelineData[prev].id);
            }
          },
        });

        /* bg color per epoch */
        ScrollTrigger.create({
          trigger: el, start: "top 60%", end: "bottom 40%",
          onEnter: () => {
            document.documentElement.style.setProperty("--accent", m.themeColor);
            document.documentElement.style.setProperty("--accent-rgb", m.accentRgb);
          },
          onEnterBack: () => {
            document.documentElement.style.setProperty("--accent", m.themeColor);
            document.documentElement.style.setProperty("--accent-rgb", m.accentRgb);
          },
        });
      });


    });
    return () => ctx.revert();
  }, [armCard]);

  const [pathsD, setPathsD] = useState<string[]>([]);

  useEffect(() => {
    // Calculate paths for theme cards
    const updatePaths = () => {
      if (!conclusionRef.current || !themeGridRef.current || !svgRef.current) return;
      const conclusionRect = conclusionRef.current.getBoundingClientRect();
      const cards = themeGridRef.current.querySelectorAll('.theme-card');
      const startX = conclusionRect.width / 2;
      const startY = 0; // Top of conclusion section
      
      const newPaths: string[] = [];
      cards.forEach((c) => {
        const cardRect = c.getBoundingClientRect();
        const endX = cardRect.left - conclusionRect.left + cardRect.width / 2;
        const endY = cardRect.top - conclusionRect.top;
        // Draw a nice bezier curve
        const cp1Y = startY + (endY - startY) * 0.4;
        const cp2Y = startY + (endY - startY) * 0.8;
        newPaths.push(`M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`);
      });
      setPathsD(newPaths);

      // Animate them after render
      setTimeout(() => {
        if (!svgRef.current || !conclusionRef.current) return;
        const paths = svgRef.current.querySelectorAll('.theme-path');
        paths.forEach((p) => {
          const path = p as SVGPathElement;
          const len = path.getTotalLength() || 1000;
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          
          // Clear any existing scroll triggers for these paths
          ScrollTrigger.getAll().filter(t => t.trigger === conclusionRef.current && t.vars.id === 'theme-lines').forEach(t => t.kill());

          gsap.to(path, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              id: 'theme-lines',
              trigger: conclusionRef.current,
              start: "top 60%",
              end: "top 20%",
              scrub: 0.5,
            }
          });
        });
      }, 50);
    };

    updatePaths();
    window.addEventListener('resize', updatePaths);
    return () => window.removeEventListener('resize', updatePaths);
  }, []);

  const themes = [
    { icon: "🤝", name: "Алқалық", desc: "Тәуке хан тұсындағы үш бидің кеңесінен бастап кеңінен қоғамдық консенсус қалыптастырған конституциялық реформаларға дейін.", indices: [0, 4, 5] },
    { icon: "🔄", name: "Жаңару циклі", desc: "Қазақ құқығы үнемі кодификацияланды: 1937 → 1978 → 1993 → 1995 → 2022 → 2026. Әр цикл өз дәуірінің сынақтарына жауап берді.", indices: [0, 1, 2, 3, 4, 5] },
    { icon: "⚖️", name: "Құқықтық дуализм", desc: "Жеті жарғыдан конституциялық өзгерістерге дейін әдет-ғұрып (адат) мен кодификацияланған нормалардың үйлесімі сақталды.", indices: [0, 4] },
    { icon: "🏛️", name: "Мемлекеттілік", desc: "Әр конституциялық реформа институттарды нығайтты: хан заңынан егемендікке, егемендіктен биліктің бөлінуіне дейін.", indices: [2, 3, 4, 5] },
  ];

  return (
    <>
      <style>{`@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      <div ref={readingBarRef} className="reading-bar" style={{ width: "100%" }} />

      {/* HERO */}
      <section className="hero-section" aria-label="Кіріспе">
        <div className="hero-ornament" aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 1, padding: "0 1.5rem" }}>
          <div className="hero-tagline">Конституциялық тарих · Қазақстан</div>
          <h1 className="hero-title" style={{ marginTop: "1.5rem" }}>
            Ата заңның<br />
            <em style={{ fontStyle: "italic", color: "rgba(var(--accent-rgb), 0.9)" }}>тарихи тамыры</em>
          </h1>
          <p className="hero-subtitle">Жеті жарғыдан Жаңа Қазақстанға дейін</p>
          <p style={{ marginTop: "1rem", fontSize: "0.95rem", color: "var(--text-muted)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            Дала әдет-ғұрып құқығынан қазіргі конституционализмге дейін
          </p>
        </div>
        <div className="scroll-indicator" aria-hidden="true">
          <div className="scroll-mouse"><div className="scroll-dot" /></div>
          <span>айналдырыңыз</span>
        </div>
      </section>

      {/* TIMELINE */}
      <main className="timeline-section" ref={timelineRef} id="timeline" aria-label="Хронология">
        <div className="timeline-wrapper">
          <div className="section-header">
            <span className="section-label">Хронология</span>
            <h2 className="section-title">Қазақ құқығының алты дәуірі</h2>
          </div>
          <div className="timeline-track" aria-hidden="true">
            <div className="timeline-track-bg" />
            <div className="timeline-track-fill" ref={lineRef} />
          </div>
          {timelineData.map((m, i) => (
            <MilestoneCard
              key={m.id}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              milestone={m}
              index={i}
              isActive={activeIdx === i}
              isGlowing={hoveredThemeIndices?.includes(i)}
            />
          ))}
        </div>
      </main>

      <ProgressSidebar activeIdx={activeIdx} />

      {/* CONCLUSION */}
      <section className="conclusion-section" ref={conclusionRef} aria-label="Қорытындылар">
        <svg 
          ref={svgRef}
          className="theme-lines-svg" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
        >
          {pathsD.map((d, i) => (
            <path key={i} className="theme-path" d={d} fill="none" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="2" strokeLinecap="round" />
          ))}
        </svg>

        <div className="conclusion-inner">
          <span className="section-label">Өзекті тақырыптар</span>
          <h2 className="conclusion-title">Қазақ конституционализмінің<br />тұрақты принциптері</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.8 }}>
            Үш жарым ғасыр бойы — дала билер кеңестерінен бүгінгі референдумдарға дейін —
            қазақ заң шығармашылығында бірнеше тұрақты принциптер байқалады.
          </p>
          <div className="theme-grid" ref={themeGridRef}>
            {themes.map((t) => (
              <div 
                key={t.name} 
                className="theme-card"
                onMouseEnter={() => setHoveredThemeIndices(t.indices)}
                onMouseLeave={() => setHoveredThemeIndices(null)}
                onClick={() => {
                  const firstId = timelineData[t.indices[0]]?.id;
                  if (firstId) {
                    document.getElementById(`milestone-${firstId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="theme-icon">{t.icon}</div>
                <div className="theme-name">{t.name}</div>
                <div className="theme-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <p className="footer-note">
          Деректерді соңғы тексеру: <strong>2026 жылдың шілдесі</strong> ·
          2026 жылғы реформалар туралы деректер алдын ала сипатта және нақтылануда.
          Ресми дереккөздер:{" "}
          <a href="https://adilet.zan.kz" target="_blank" rel="noopener noreferrer">adilet.zan.kz</a>
          {" · "}
          <a href="https://www.akorda.kz" target="_blank" rel="noopener noreferrer">akorda.kz</a>
          <br />
          Бағалау пікірлері дереккөзге сілтемемен берілген. Материал ақпараттық-білім беру сипатында.
        </p>
      </footer>

      {/* Gesture system (headless) */}
      <GestureOrchestrator />
      <CameraModal />
    </>
  );
}

/* ── Root export — обёрнут в GestureProvider ──────────────── */
export default function Home() {
  return (
    <GestureProvider>
      <PageInner />
    </GestureProvider>
  );
}
