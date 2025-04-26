"use client";

import * as React from "react";
import { Moon, Sun, Github } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Menu() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After initial render, mark as mounted
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use the same styles for both server and client rendering
  const navStyle = "fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b px-5";

  return (
    <nav className={navStyle}>
      <div className="container flex h-14 items-center justify-between">
        <ul className="flex items-center gap-6">
          <li>
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/decks"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Decks
            </Link>
          </li>
          <li>
            <Link
            href="/breakdown"
            className="text-sm font-medium transition-colors hover:text-primary"
            >
              Breakdown
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Settings
            </Link>
          </li>
        </ul>
        
        <div className="flex items-center gap-2">
          {mounted && (
            <>
              <Link href="https://github.com/OukilIl/Kotoba" target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="mr-2"
                >
                  <Github className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
