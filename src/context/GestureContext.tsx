"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

export type CardState = "idle" | "armed" | "revealed";
export type CameraState = "unchecked" | "requesting" | "granted" | "denied" | "unavailable";

interface GestureCtx {
  cardStates: Record<string, CardState>;
  cameraState: CameraState;
  showCameraModal: boolean;
  armedCardId: string | null;
  armCard: (id: string) => void;
  revealCard: (id: string) => void;
  setCameraState: (s: CameraState) => void;
  openCameraModal: () => void;
  closeCameraModal: () => void;
  museumCardId: string | null;
  openMuseum: (id: string) => void;
  closeMuseum: () => void;
  activeViewportCardId: string | null;
  setActiveViewportCardId: (id: string | null) => void;
}

const Ctx = createContext<GestureCtx | null>(null);

export function GestureProvider({ children }: { children: React.ReactNode }) {
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [cameraState, setCameraState] = useState<CameraState>("unchecked");
  const [showCameraModal, setShowCameraModal] = useState(false);
  // track which card is currently ARMED (only one at a time)
  const armedRef = useRef<string | null>(null);
  const [armedCardId, setArmedCardId] = useState<string | null>(null);
  const [museumCardId, setMuseumCardId] = useState<string | null>(null);
  const [activeViewportCardId, setActiveViewportCardId] = useState<string | null>(null);

  const armCard = useCallback((id: string) => {
    setCardStates((prev) => {
      if (prev[id] === "revealed") return prev; // already revealed, skip
      return { ...prev, [id]: "armed" };
    });
    armedRef.current = id;
    setArmedCardId(id);
  }, []);

  const revealCard = useCallback((id: string) => {
    setCardStates((prev) => ({ ...prev, [id]: "revealed" }));
    if (armedRef.current === id) {
      armedRef.current = null;
      setArmedCardId(null);
    }
  }, []);

  const openCameraModal = useCallback(() => setShowCameraModal(true), []);
  const closeCameraModal = useCallback(() => setShowCameraModal(false), []);
  const openMuseum = useCallback((id: string) => setMuseumCardId(id), []);
  const closeMuseum = useCallback(() => setMuseumCardId(null), []);

  return (
    <Ctx.Provider
      value={{
        cardStates,
        cameraState,
        showCameraModal,
        armedCardId,
        activeViewportCardId,
        setActiveViewportCardId,
        armCard,
        revealCard,
        setCameraState,
        openCameraModal,
        closeCameraModal,
        museumCardId,
        openMuseum,
        closeMuseum,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useGesture() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGesture must be used inside GestureProvider");
  return ctx;
}
