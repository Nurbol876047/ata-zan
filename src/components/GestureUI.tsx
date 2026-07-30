"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGesture } from "@/context/GestureContext";
import { useHandGesture } from "@/hooks/useHandGesture";

/* ════════════════════════════════════════════════════════════
   CameraModal — объяснение ДО вызова getUserMedia
   ════════════════════════════════════════════════════════════ */
export function CameraModal() {
  const { showCameraModal, closeCameraModal, setCameraState, revealCard, armedCardId } =
    useGesture();

  const handleAllow = useCallback(async () => {
    closeCameraModal();
    setCameraState("requesting");
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraState("granted");
    } catch {
      setCameraState("denied");
      // Fallback: auto-reveal armed card
      if (armedCardId) {
        setTimeout(() => revealCard(armedCardId), 100);
      }
    }
  }, [closeCameraModal, setCameraState, revealCard, armedCardId]);

  const handleSkip = useCallback(() => {
    closeCameraModal();
    setCameraState("denied");
    if (armedCardId) setTimeout(() => revealCard(armedCardId), 100);
  }, [closeCameraModal, setCameraState, revealCard, armedCardId]);

  if (!showCameraModal) return null;

  return (
    <div className="camera-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cam-title">
      <div className="camera-modal">
        <div className="camera-modal-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
            <rect x="4" y="16" width="56" height="38" rx="6" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="32" cy="35" r="10" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="32" cy="35" r="4" fill="currentColor" opacity="0.6" />
            <path d="M22 16 L26 10 H38 L42 16" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="cam-title" className="camera-modal-title">Камераға рұқсат</h2>
        <p className="camera-modal-desc">
          <strong>1. Ашу қимылы:</strong> Үлкен және сұқ саусағыңызды біріктіріп (щипок), содан кейін тез ашыңыз.<br />
          <strong>2. Скроллинг қимылы:</strong> Қолыңызды жұдырыққа түйіп (кулак), жоғары-төмен жылжытыңыз.<br /><br />
          Бейне деректер тек браузерде өңделеді.
          Рұқсат бермесеңіз де карточкаларды басу арқылы ашуға болады.
        </p>
        <div className="camera-modal-actions">
          <button className="camera-btn-allow" onClick={handleAllow}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Рұқсат беру
          </button>
          <button className="camera-btn-skip" onClick={handleSkip}>
            Өткізіп жіберу
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GestureHint — пульсирующая ладонь + подсказка
   ════════════════════════════════════════════════════════════ */
export function GestureHint({
  cameraUnavailable,
  onRequestCamera,
}: {
  cameraUnavailable: boolean;
  onRequestCamera: () => void;
}) {
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    if (cameraUnavailable) return;
    const t = setTimeout(() => setShowSecondary(true), 3000);
    return () => clearTimeout(t);
  }, [cameraUnavailable]);

  return (
    <div className="gesture-hint" aria-live="polite">
      {/* Иконка 5 пальцев */}
      <div className="gesture-palm" aria-hidden="true" style={{ fontSize: "2rem", lineHeight: 1 }}>
        🖐
      </div>

      <div className="gesture-hint-text">
        {cameraUnavailable ? (
          <span>Карточканы ашу үшін басыңыз</span>
        ) : showSecondary ? (
          <span>
            Қол қимылын қолдану үшін{" "}
            <button className="gesture-camera-link" onClick={onRequestCamera}>
              камераны іске қосыңыз
            </button>
          </span>
        ) : (
          <span>Карточканы ашу үшін <b>5 саусағыңызды ашып көрсетіңіз</b></span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GestureOrchestrator — управляет камерой и детекцией жестов
   (монтируется один раз в корне страницы)
   ════════════════════════════════════════════════════════════ */
export function GestureOrchestrator() {
  const { armedCardId, activeViewportCardId, cardStates, museumCardId, cameraState, setCameraState, revealCard, openCameraModal, openMuseum } = useGesture();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Когда появляется первая ARMED-карточка ── */
  useEffect(() => {
    if (!armedCardId) return;
    if (cameraState === "granted" || cameraState === "denied" || cameraState === "unavailable") return;

    // Первый ARMED — показать modal
    if (cameraState === "unchecked") {
      openCameraModal();
    }
  }, [armedCardId, cameraState, openCameraModal]);

  /* ── Получить поток при granted ── */
  useEffect(() => {
    if (cameraState !== "granted") return;
    if (stream) return;

    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((s) => {
        if (active) setStream(s);
        else s.getTracks().forEach((t) => t.stop());
      })
      .catch(() => {
        if (active) setCameraState("unavailable");
      });

    return () => {
      active = false;
    };
  }, [cameraState, setCameraState, stream]);

  // Clean up stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  /* ── Fallback: auto-reveal если камера denied/unavailable ── */
  useEffect(() => {
    if (!armedCardId) return;
    if (cameraState !== "denied" && cameraState !== "unavailable") return;

    fallbackTimerRef.current = setTimeout(() => {
      revealCard(armedCardId);
    }, 2500);

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [armedCardId, cameraState, revealCard]);

  /* ── Жест-детектор ── */
  const handleGesture = useCallback((id: string) => {
    const state = cardStates[id];
    if (!state || state === "armed") {
      revealCard(id);
    } else if (state === "revealed" && museumCardId !== id) {
      openMuseum(id);
    }
  }, [cardStates, museumCardId, revealCard, openMuseum]);

  useHandGesture({
    activeCardId: cameraState === "granted" ? activeViewportCardId : null,
    stream: stream,
    onGestureDetected: handleGesture,
    isMuseumMode: museumCardId !== null,
  });

  return null; // headless
}
