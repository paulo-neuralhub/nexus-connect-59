// ============================================================
// GENIUS Chat Sidebar — Context provider + global state
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface GeniusSidebarContextValue {
  isOpen: boolean;
  openChat: (matterId?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  initialMatterId?: string;
  badgeSide: "left" | "right";
  setBadgeSide: (side: "left" | "right") => void;
}

const GeniusSidebarContext = createContext<GeniusSidebarContextValue>({
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  badgeSide: "right",
  setBadgeSide: () => {},
});

export function useGeniusSidebar() {
  return useContext(GeniusSidebarContext);
}

export function GeniusSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMatterId, setInitialMatterId] = useState<string | undefined>();
  const [badgeSide, setBadgeSide] = useState<"left" | "right">("right");

  const openChat = useCallback((matterId?: string) => {
    setInitialMatterId(matterId);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  // ⌘+J / Ctrl+J shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        toggleChat();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggleChat]);

  return (
    <GeniusSidebarContext.Provider value={{ isOpen, openChat, closeChat, toggleChat, initialMatterId, badgeSide, setBadgeSide }}>
      {children}
    </GeniusSidebarContext.Provider>
  );
}
