"use client";

import { Wallet, Rocket, Shield, Gamepad2, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  // Mobile gamepad menu state
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="border-b-2 border-primary/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 glow-effect">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3 md:gap-6 min-w-0">
            {/* Logo - Gamepad Style */}
            <Link href="/" className="flex items-center gap-3 group min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center glow-effect border-2 border-accent/50 transition-transform group-hover:scale-110">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg leading-tight font-black tracking-wider glow-text uppercase truncate max-w-[60vw] sm:max-w-none">Safupad</h1>
                <p className="hidden sm:block text-[10px] text-accent font-bold uppercase tracking-widest">🎮 Game Mode Active</p>
              </div>
            </Link>

            {/* D-Pad Navigation (hidden on mobile) */}
            <nav className="hidden xl:block">
              <div className="dpad-nav scale-90 origin-right 2xl:scale-100">
                <Link 
                  href="/" 
                  className={`dpad-btn ${pathname === "/" ? "active" : ""}`}
                >
                  🎯 Explore
                </Link>
                <Link 
                  href="/create" 
                  className={`dpad-btn ${pathname === "/create" ? "active" : ""}`}
                >
                  🚀 Create
                </Link>
                <Link 
                  href="/portfolio" 
                  className={`dpad-btn ${pathname === "/portfolio" ? "active" : ""}`}
                >
                  💼 Portfolio
                </Link>
              </div>
            </nav>

            {/* Wallet Connect */}
            <div className="flex items-center gap-3 flex-shrink-0 scale-90 sm:scale-95 2xl:scale-100 origin-right">
              <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Gamepad Menu */}
      <div className="md:hidden">
        {/* Backdrop */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
        )}

        {/* Pop-up Panel */}
        <div
          id="mobile-gamepad-panel"
          className={`fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-200 ease-out ${
            menuOpen
              ? "bottom-[calc(env(safe-area-inset-bottom)+6rem)] opacity-100"
              : "bottom-[calc(env(safe-area-inset-bottom)+4rem)] opacity-0 pointer-events-none"
          }`}
        >
          <div className="dpad-nav">
            <Link
              href="/"
              className={`dpad-btn ${pathname === "/" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              🎯 Explore
            </Link>
            <Link
              href="/create"
              className={`dpad-btn ${pathname === "/create" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              🚀 Create
            </Link>
            <Link
              href="/portfolio"
              className={`dpad-btn ${pathname === "/portfolio" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              💼 Portfolio
            </Link>
          </div>
        </div>

        {/* Floating Toggle Button */}
        <div className="fixed left-1/2 -translate-x-1/2 z-[61] bottom-[calc(env(safe-area-inset-bottom)+1rem)]">
          <button
            className={`gamepad-btn ${menuOpen ? "gamepad-btn-primary" : "gamepad-btn-secondary"}`}
            aria-label="Open gamepad menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-gamepad-panel"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>
      </div>
    </>
  );
}