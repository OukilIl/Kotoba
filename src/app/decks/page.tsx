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
  description: string;
  cards_count: number;
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
          fields: ["id", "name", "vocabulary_count", "is_built_in"]
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
            cards_count: deckData[2] || 0,
            description: deckData[3] === true ? "Built-in deck" : "Custom deck"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <div 
                  key={deck.id} 
                  className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-medium mb-2">{deck.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {deck.description || "No description available"}
                  </p>
                  <div className="text-sm font-medium">
                    Cards: {deck.cards_count}
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
