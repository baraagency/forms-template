import { useEffect, useRef, useState } from "react";

function readCloseDurationMs(): number {
  if (typeof window === "undefined") {
    return 150;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-quick")
    .trim();
  const ms = Number.parseFloat(raw);
  return Number.isFinite(ms) ? ms : 150;
}

/**
 * Keeps the react-select menu mounted briefly on close so CSS can play
 * the reverse of the open animation (slightly faster).
 */
export function useSelectMenuMotion() {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const menuIsOpenRef = useRef(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    menuIsOpenRef.current = menuIsOpen;
  }, [menuIsOpen]);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const onMenuOpen = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    isClosingRef.current = false;
    setIsClosing(false);
    menuIsOpenRef.current = true;
    setMenuIsOpen(true);
  };

  const onMenuClose = () => {
    if (!menuIsOpenRef.current || isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      menuIsOpenRef.current = false;
      isClosingRef.current = false;
      setMenuIsOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, readCloseDurationMs());
  };

  return {
    menuIsOpen,
    isClosing,
    onMenuOpen,
    onMenuClose,
  };
}
