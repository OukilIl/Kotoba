"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export default function Menu() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After initial render, mark as mounted
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="mt-0 ml-5 mr-5       z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container flex h-14 items-center justify-between">
        <ul className="flex items-center gap-6">
          <li>
            <a
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/decks"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Decks
            </a>
          </li>
          <li>
            <a
              href="/settings"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Settings
            </a>
          </li>
          <li>
            <a
            href="/breakdown"
            className="text-sm font-medium transition-colors hover:text-primary"
            >
              Breakdown
            </a>
          </li>
        </ul>
        
        {mounted && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-auto"
          >
            {theme === "dark" ? (
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            )}
          </Button>
        )}
      </div>
    </nav>
  );
}
