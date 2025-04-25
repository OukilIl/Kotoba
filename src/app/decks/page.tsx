"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Define types for JPDB deck data
type Deck = {
  id: string;
  name: string;
  vocabulary_count: number;
  word_count: number;
  vocabulary_known_coverage: number;
  vocabulary_in_progress_coverage: number;
  is_built_in: boolean;
};

export default function DecksPage() {
  const [hasJpdbKey, setHasJpdbKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDecks, setIsFetchingDecks] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if JPDB API key exists in localStorage
    const savedJpdbKey = localStorage.getItem("jpdbApiKey");
    setHasJpdbKey(!!savedJpdbKey);
    
    if (savedJpdbKey) {
      const savedDeckIds = localStorage.getItem("jpdbDeckIds");
      
      // If we have a key and no saved decks, fetch them automatically
      if (!savedDeckIds) {
        fetchDecks();
      } else {
        // Otherwise, load decks from localStorage
        try {
          const parsedDecks = JSON.parse(localStorage.getItem("jpdbDecks") || "[]");
          setDecks(parsedDecks);
        } catch (err) {
          console.error("Error parsing saved decks:", err);
          // If there was an error parsing, try to fetch again
          fetchDecks();
        }
      }
    }
    
    setIsLoading(false);
  }, []);

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const fetchDecks = async () => {
    setIsFetchingDecks(true);
    
    try {
      const jpdbApiKey = localStorage.getItem("jpdbApiKey");
      
      if (!jpdbApiKey) {
        toast.error("JPDB API key not found", {
          description: "Please configure your JPDB API key in settings",
        });
        setIsFetchingDecks(false);
        return;
      }
      
      const response = await fetch("https://jpdb.io/api/v1/list-user-decks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jpdbApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          fields: [
            "id", 
            "name", 
            "vocabulary_count", 
            "word_count", 
            "vocabulary_known_coverage", 
            "vocabulary_in_progress_coverage", 
            "is_built_in"
          ]
        })
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Invalid API key");
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please try again later");
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (data.decks && Array.isArray(data.decks)) {
        // Transform the response data to match our Deck type
        const transformedDecks: Deck[] = data.decks.map((deckData: any[]) => {
          return {
            id: deckData[0],
            name: deckData[1],
            vocabulary_count: deckData[2] || 0,
            word_count: deckData[3] || 0,
            vocabulary_known_coverage: deckData[4] || 0,
            vocabulary_in_progress_coverage: deckData[5] || 0,
            is_built_in: deckData[6] || false
          };
        });
        
        // Save the deck IDs and full deck data
        const deckIds = transformedDecks.map(deck => deck.id);
        localStorage.setItem("jpdbDeckIds", JSON.stringify(deckIds));
        localStorage.setItem("jpdbDecks", JSON.stringify(transformedDecks));
        
        setDecks(transformedDecks);
        
        toast.success("Decks fetched successfully", {
          description: `${transformedDecks.length} decks loaded from JPDB`,
        });
      } else {
        throw new Error("Invalid response format from JPDB API");
      }
    } catch (error) {
      console.error("Error fetching JPDB decks:", error);
      toast.error("Failed to fetch decks", {
        description: error instanceof Error ? error.message : "Please check your API key and try again",
      });
    } finally {
      setIsFetchingDecks(false);
    }
  };

  // Display loading state while fetching
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Format the percentage without multiplying by 100 (data comes as raw percentages)
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Decks</h1>
        
        {hasJpdbKey && (
          <Button 
            onClick={fetchDecks} 
            variant="outline" 
            disabled={isFetchingDecks}
            className="group"
          >
            {isFetchingDecks ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                Refresh Decks
              </>
            )}
          </Button>
        )}
      </div>
      
      {hasJpdbKey ? (
        <>
          {decks.length > 0 ? (
            <div className="flex flex-col space-y-4">
              {decks.map((deck, index) => (
                <div 
                  key={deck.id} 
                  className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">
                      {index + 1}. {deck.name} {deck.vocabulary_count >= 1000 
                        ? `${(deck.vocabulary_count / 1000).toFixed(1)}k` 
                        : deck.vocabulary_count}
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm mb-1">Vocabulary</p>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{Math.floor(deck.vocabulary_count * deck.vocabulary_known_coverage / 100)} / {deck.vocabulary_count}</span>
                      </div>
                      <div className="relative h-6 bg-muted/30 rounded-md overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-primary rounded-md"
                          style={{ width: `${deck.vocabulary_known_coverage}%` }}
                        />
                        <div 
                          className="absolute top-0 left-0 h-full bg-primary/30 rounded-md"
                          style={{ 
                            width: `${deck.vocabulary_in_progress_coverage}%`,
                            clipPath: `polygon(${deck.vocabulary_known_coverage}% 0, 100% 0, 100% 100%, ${deck.vocabulary_known_coverage}% 100%)`
                          }}
                        />
                        <div className="absolute top-0 left-0 w-full h-full flex items-center px-2">
                          <span className="text-xs font-medium text-primary-foreground">
                            {deck.vocabulary_known_coverage.toFixed(2)}% 
                            (<span className="text-primary-foreground/70">+{(deck.vocabulary_in_progress_coverage - deck.vocabulary_known_coverage).toFixed(2)}%</span>)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isFetchingDecks ? (
            <div className="p-6 bg-card rounded-lg border shadow-sm flex justify-center">
              <div className="flex items-center">
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                <p>Fetching your JPDB decks...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <p className="text-lg mb-4">No decks found. Click the refresh button to fetch your JPDB decks.</p>
              <Button onClick={fetchDecks} className="group">
                <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                Fetch Decks
              </Button>
            </div>
          )}
        </>
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
