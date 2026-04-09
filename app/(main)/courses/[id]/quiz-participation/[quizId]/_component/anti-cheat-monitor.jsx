"use client";

import { useEffect, useRef } from "react";

export default function AntiCheatMonitor({
  onViolation,
  isActive = true,
  developmentMode,
}) {
  const devToolsCheckRef = useRef();

  // This early return is safe because `developmentMode` is a static prop
  // that will not change between renders for this component instance.
  if (developmentMode) {
    console.log("🔧 AntiCheatMonitor: Development mode - monitoring disabled.");
    return null;
  }

  // --- Hooks are now called unconditionally to prevent the error ---

  // Disable right-click, selection, and keyboard shortcuts
  useEffect(() => {
    // If not active, do nothing and ensure no listeners are attached.
    if (!isActive) {
      return; // Return early from the effect, not the component.
    }

    const handleContextMenu = (e) => {
      e.preventDefault();
      onViolation("right_click", "Right-click is disabled during quiz");
    };

    const handleKeyDown = (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      // Block common dev tools and system shortcuts
      if (
        e.key === "F12" ||
        (isCtrlOrMeta && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (isCtrlOrMeta && ["U", "S", "P", "A", "C", "V", "X"].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        onViolation("keyboard_shortcut", `Keyboard shortcut (${e.key}) is disabled`);
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      onViolation("copy_paste_attempt", "Copy operation blocked");
    };
    const handlePaste = (e) => {
      e.preventDefault();
      onViolation("copy_paste_attempt", "Paste operation blocked");
    };
    const handleCut = (e) => {
      e.preventDefault();
      onViolation("copy_paste_attempt", "Cut operation blocked");
    };
    const preventDefaultAction = (e) => e.preventDefault();

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("selectstart", preventDefaultAction);
    document.addEventListener("dragstart", preventDefaultAction);

    // The cleanup function will run when `isActive` becomes false,
    // removing all the event listeners.
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("selectstart", preventDefaultAction);
      document.removeEventListener("dragstart", preventDefaultAction);
    };
  }, [onViolation, isActive]); // `isActive` is now a dependency

  // Monitor tab switching and window focus
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolation("tab_switch", "Tab switching detected");
      }
    };

    const handleWindowBlur = () => {
      // Use a small timeout to prevent false positives from browser alerts, etc.
      setTimeout(() => {
        if (document.activeElement === document.body) {
          onViolation("window_minimize", "Window lost focus");
        }
      }, 300);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [onViolation, isActive]); // `isActive` is now a dependency

  // Monitor developer tools
  useEffect(() => {
    if (!isActive) {
      // If we become inactive, clear any existing interval
      if (devToolsCheckRef.current) {
        clearInterval(devToolsCheckRef.current);
      }
      return;
    }

    const threshold = 160;
    const checkDevTools = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        onViolation("developer_tools", "Developer tools opened");
      }
    };

    devToolsCheckRef.current = setInterval(checkDevTools, 500);

    return () => {
      if (devToolsCheckRef.current) {
        clearInterval(devToolsCheckRef.current);
      }
    };
  }, [onViolation, isActive]); // `isActive` is now a dependency

  // This component doesn't render anything visible
  return null;
}