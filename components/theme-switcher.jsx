"use client";

import { motion } from "framer-motion";
import { Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

//   Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Main button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Palette className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary animate-pulse" />
      </motion.button>

      {/* Theme options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : 20,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        className="absolute bottom-20 left-0"
      >
        <motion.button
          onClick={() => {
            setTheme("light");
            setIsOpen(false);
          }}
          className={`flex items-center justify-center w-12 h-12 mb-3 rounded-full shadow-lg ${
            theme === "light"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Sun className="w-5 h-5" />
        </motion.button>

        <motion.button
          onClick={() => {
            setTheme("dark");
            setIsOpen(false);
          }}
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg ${
            theme === "dark"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Moon className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
