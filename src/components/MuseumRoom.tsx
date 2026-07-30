"use client";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface MuseumStand {
  image: string;
  title: string;
  body: string;
  audioSrc?: string;
}

interface MuseumRoomProps {
  id: string;
  stands: MuseumStand[];
  onClose: () => void;
  // sourceRect for FLIP-like animation
  sourceRect?: DOMRect;
  // Pass true if "Swipe" (fist closed + moving left/right or just palm moving left/right) is detected outside
  // Actually, MuseumRoom could consume GestureContext directly, but we will pass gesture events.
}

export function MuseumRoom({ id, stands, onClose, sourceRect }: MuseumRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  // Audio crossfade logic
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  
  // 1) Инициализируем аудио объекты только один раз (вне React DOM)
  useEffect(() => {
    audioRefs.current = stands.map(stand => {
      if (stand.audioSrc) {
        const audio = new Audio(stand.audioSrc);
        audio.loop = true;
        audio.volume = 0;
        return audio;
      }
      return null;
    });

    return () => {
      // При закрытии музея уничтожаем аудио
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = ""; // Очищаем source чтобы остановить загрузку
        }
      });
    };
  }, [stands]);

  // 2) Управляем громкостью и воспроизведением при свайпе
  useEffect(() => {
    audioRefs.current.forEach((audio, idx) => {
      if (!audio) return;
      if (idx === activeIdx) {
        gsap.killTweensOf(audio);
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {}); // Игнорируем AbortError если пользователь быстро свайпает
        }
        gsap.to(audio, { volume: 1, duration: 0.5 });
      } else {
        gsap.killTweensOf(audio);
        gsap.to(audio, { volume: 0, duration: 0.5, onComplete: () => {
          audio.pause();
        }});
      }
    });
  }, [activeIdx]);

  const isProgrammaticScroll = useRef(false);

  // Handle Scroll to update activeIdx
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIdx && idx >= 0 && idx < stands.length) {
      setActiveIdx(idx);
    }
  };

  const handleExit = React.useCallback(() => {
    if (!containerRef.current) return;
    
    // Fade out audio
    audioRefs.current.forEach(a => {
      if (a) gsap.to(a, { volume: 0, duration: 0.4 });
    });

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.4,
      onComplete: onClose
    });
  }, [onClose]);

  // Keyboard and Gesture navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setActiveIdx(v => Math.min(v + 1, stands.length - 1));
      } else if (e.key === "ArrowLeft") {
        setActiveIdx(v => Math.max(v - 1, 0));
      } else if (e.key === "Escape") {
        handleExit();
      }
    };
    
    const handleSwipeLeft = () => setActiveIdx(v => Math.min(v + 1, stands.length - 1));
    const handleSwipeRight = () => setActiveIdx(v => Math.max(v - 1, 0));

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("gesture-swipe-left", handleSwipeLeft);
    window.addEventListener("gesture-swipe-right", handleSwipeRight);
    window.addEventListener("gesture-fist", handleExit);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("gesture-swipe-left", handleSwipeLeft);
      window.removeEventListener("gesture-swipe-right", handleSwipeRight);
      window.removeEventListener("gesture-fist", handleExit);
    };
  }, [stands.length, handleExit]);

  // Programmatic scroll when activeIdx changes (via keyboard or dots)
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const targetScroll = activeIdx * el.clientWidth;
      if (Math.abs(el.scrollLeft - targetScroll) > 10) {
        isProgrammaticScroll.current = true;
        el.scrollTo({ left: targetScroll, behavior: "smooth" });
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 600);
      }
    }
  }, [activeIdx]);


  return (
    <div ref={containerRef} className="museum-overlay">
      <button className="museum-close" onClick={handleExit} aria-label="Жабу">
        <X size={32} />
      </button>

      <div 
        ref={scrollRef}
        className="museum-scroll-container" 
        onScroll={handleScroll}
      >
        {stands.map((stand, i) => (
          <div key={i} className="museum-stand">
            <div 
              className="museum-bg" 
              style={{ backgroundImage: `url(${stand.image})` }} 
            />
            <div className="museum-content">
              <h2 className="museum-title">{stand.title}</h2>
              <p className="museum-body">{stand.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="museum-nav">
        {stands.map((_, i) => (
          <button 
            key={i} 
            className={`museum-dot ${i === activeIdx ? "active" : ""}`}
            onClick={() => setActiveIdx(i)}
            aria-label={`Стенд ${i + 1}`}
          />
        ))}
      </div>
      
      {/* Visual Gesture Hint for Museum */}
      <div className="museum-gesture-hint">
        <div className="hint-icon">🖐 ↔️</div>
        <span>Бес саусақпен солға/оңға свайп жасаңыз немесе кулакпен жабыңыз</span>
      </div>
    </div>
  );
}
