"use client";
import { useCallback, useEffect, useRef } from "react";

/* ── Singleton HandLandmarker (инициализируется один раз) ─── */
let landmarkerPromise: Promise<import("@mediapipe/tasks-vision").HandLandmarker> | null = null;

async function getLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    return HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  })();
  return landmarkerPromise;
}

/* ── Euclidean distance между двумя landmarks ─────────────── */
function dist(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

interface UseHandGestureOptions {
  activeCardId: string | null;          // какая карточка ARMED
  onGestureDetected: (cardId: string) => void;
  stream: MediaStream | null;           // видеопоток (headless)
  isMuseumMode?: boolean;
}

export function useHandGesture({
  activeCardId,
  onGestureDetected,
  stream,
  isMuseumMode = false,
}: UseHandGestureOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);
  const debounceRef = useRef(false);

  /* ── Pinch-spread state machine ─────────────────────────── */
  const pinchStartRef = useRef<number | null>(null); // timestamp когда начался щипок
  const pinchConfirmedRef = useRef(false);           // щипок удержан >= 300ms
  const spreadTimerRef = useRef<number | null>(null); // timestamp начала разведения
  const fistStartRef = useRef<number | null>(null);  // timestamp удержания кулака

  const resetGestureState = useCallback(() => {
    pinchStartRef.current = null;
    pinchConfirmedRef.current = false;
    spreadTimerRef.current = null;
    fistStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!stream) return;

    /* Создаём скрытый video-элемент для headless-обработки */
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.cssText = "position:fixed;bottom:20px;right:20px;width:160px;height:120px;border-radius:12px;border:2px solid rgba(255,255,255,0.2);z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5);object-fit:cover;transform:scaleX(-1);";
    document.body.appendChild(video);
    videoRef.current = video;

    /* Создаём canvas для отрисовки линии между пальцами (debug/helper) */
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    canvas.style.cssText = "position:fixed;bottom:20px;right:20px;width:160px;height:120px;border-radius:12px;z-index:10000;pointer-events:none;transform:scaleX(-1);";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let landmarker: import("@mediapipe/tasks-vision").HandLandmarker;
    let active = true;
    let lastVideoTime = -1;
    let lastFistY = -1;
    let lastPalmX = -1;

    const loop = (now: number) => {
      if (!active || !videoRef.current) return;
      rafRef.current = requestAnimationFrame(loop);

      const v = videoRef.current;
      if (v.readyState < 2 || v.currentTime === lastVideoTime) return;
      lastVideoTime = v.currentTime;

      const result = landmarker.detectForVideo(v, now);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!result.landmarks || result.landmarks.length === 0) {
        resetGestureState();
        return;
      }

      const lm = result.landmarks[0];
      const wrist = lm[0];
      const thumbTip = lm[4];
      const indexTip = lm[8];
      const middleTip = lm[12];
      const ringTip = lm[16];
      const pinkyTip = lm[20];
      
      const isFolded = (tip: number, mcp: number) => dist(lm[tip], wrist) < dist(lm[mcp], wrist) * 0.9;
      const fist = isFolded(8, 5) && isFolded(12, 9) && isFolded(16, 13) && isFolded(20, 17);
      
      // Считаем ладонь открытой, если все 4 пальца не сложены и расстояние от большого до мизинца большое
      const isOpenPalm = !fist && !isFolded(8,5) && !isFolded(12,9) && !isFolded(16,13) && !isFolded(20,17) && dist(thumbTip, pinkyTip) > 0.25;
      
      // Считаем 1 палец (указательный), если он выпрямлен, а остальные 3 сложены
      const isOneFinger = !isFolded(8,5) && isFolded(12,9) && isFolded(16,13) && isFolded(20,17);

      /* Отрисовываем визуальную подсказку на канвасе */
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        
        // Линии от запястья к каждому пальцу
        const drawFinger = (tip: any, color: string, isActive: boolean = false) => {
          ctx!.beginPath();
          ctx!.moveTo(wrist.x * canvas.width, wrist.y * canvas.height);
          ctx!.lineTo(tip.x * canvas.width, tip.y * canvas.height);
          ctx!.strokeStyle = isActive ? "#22c55e" : "#ffffff"; // зеленый если жест активен
          ctx!.stroke();
          
          ctx!.beginPath();
          ctx!.arc(tip.x * canvas.width, tip.y * canvas.height, isActive ? 8 : 6, 0, 2 * Math.PI);
          ctx!.fillStyle = color;
          ctx!.fill();
        };

        drawFinger(thumbTip, "#ef4444", isOpenPalm);
        drawFinger(indexTip, "#3b82f6", isOpenPalm || isOneFinger);
        drawFinger(middleTip, "#eab308", isOpenPalm);
        drawFinger(ringTip, "#a855f7", isOpenPalm);
        drawFinger(pinkyTip, "#ec4899", isOpenPalm);
        
        // Рисуем запястье
        ctx.beginPath();
        ctx.arc(wrist.x * canvas.width, wrist.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      /* ── Scroll (Fist) ── */

      if (fist) {
        if (ctx) {
          ctx.beginPath();
          ctx.arc(wrist.x * canvas.width, wrist.y * canvas.height, 12, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(255, 165, 0, 0.8)"; // оранжевый для кулака
          ctx.fill();
        }
        
        const ts = performance.now();
        if (fistStartRef.current === null) fistStartRef.current = ts;

        if (isMuseumMode) {
          // Требуем удерживать кулак 600мс, чтобы избежать ложных срабатываний
          if (ts - fistStartRef.current >= 600) {
            if (!debounceRef.current) {
              debounceRef.current = true;
              window.dispatchEvent(new CustomEvent("gesture-fist"));
              setTimeout(() => { debounceRef.current = false; }, 1000);
            }
          }
        } else {
          if (lastFistY !== -1) {
            const deltaY = wrist.y - lastFistY;
            window.scrollBy({ top: -deltaY * window.innerHeight * 2.5, behavior: "instant" });
          }
          lastFistY = wrist.y;
        }
        resetGestureState(); // блокируем щипок, пока кулак
        lastPalmX = -1;
        return;
      } else {
        fistStartRef.current = null;
        lastFistY = -1;
      }

      /* ── Swipe (Open Palm) for Museum ── */
      if (isMuseumMode && isOpenPalm) {
        if (lastPalmX !== -1 && !debounceRef.current) {
          const deltaX = wrist.x - lastPalmX;
          // Измеряем скорость (разница между текущим и прошлым кадром).
          // 0.015 — это любое резкое микродвижение ладони (взмах). Срабатывает моментально!
          if (Math.abs(deltaX) > 0.015) {
            window.dispatchEvent(new CustomEvent(deltaX > 0 ? "gesture-swipe-left" : "gesture-swipe-right"));
            debounceRef.current = true;
            setTimeout(() => { debounceRef.current = false; }, 800);
          }
        }
        // Всегда обновляем позицию, чтобы отслеживать именно скорость (взмах)
        if (!debounceRef.current) {
          lastPalmX = wrist.x;
        }
      } else {
        lastPalmX = -1;
      }

      const ts = performance.now();

      /* ── Фаза 1: 5 пальцев открыты (isOpenPalm) ── */
      if (isOpenPalm) {
        if (pinchStartRef.current === null) pinchStartRef.current = ts;
        // Если удерживает 5 пальцев открытыми 500мс
        if (!pinchConfirmedRef.current && ts - pinchStartRef.current >= 500) {
          pinchConfirmedRef.current = true; // Триггер сработал
          if (!debounceRef.current && activeCardId && !isMuseumMode) {
            debounceRef.current = true;
            onGestureDetected(activeCardId);
            setTimeout(() => { debounceRef.current = false; }, 1500);
          }
          resetGestureState();
        }
      } else {
        // Если пальцы не открыты, сбрасываем таймер
        resetGestureState();
      }
    };

    getLandmarker().then((lm) => {
      if (!active) return;
      landmarker = lm;
      video.play().then(() => {
        if (!active) return;
        rafRef.current = requestAnimationFrame(loop);
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          console.error("MediaPipe video play error:", err);
        }
      });
    });

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      resetGestureState();
      video.srcObject = null;
      document.body.removeChild(video);
      if (canvas.parentNode) document.body.removeChild(canvas);
      videoRef.current = null;
    };
  }, [activeCardId, stream, isMuseumMode, onGestureDetected, resetGestureState]);
}
