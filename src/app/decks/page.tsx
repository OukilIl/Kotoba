"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DecksPage() {
  const [hasJpdbKey, setHasJpdbKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if JPDB API key exists in localStorage
    const savedJpdbKey = localStorage.getItem("jpdbApiKey");
    setHasJpdbKey(!!savedJpdbKey);
    setIsLoading(false);
  }, []);

  const navigateToSettings = () => {
    router.push("/settings");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Decks</h1>
      
      {hasJpdbKey ? (
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <p className="text-lg">Your JPDB integration is active. You can now use deck features.</p>
          <p className="mt-2">This is some random text shown when JPDB key is set up.</p>
        </div>
      ) : (
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <p className="text-lg mb-4">You need to set up your JPDB API key to use deck features.</p>
          <Button onClick={navigateToSettings} className="group">
            Set up JPDB Key
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
