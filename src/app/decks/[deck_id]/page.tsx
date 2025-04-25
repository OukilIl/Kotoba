"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// Define the Deck type
type Deck = {
  id: string;
  name: string;
  vocabulary_count: number;
  word_count: number;
  vocabulary_known_coverage: number;
  vocabulary_in_progress_coverage: number;
  is_built_in: boolean;
};

export default function DeckDetailPage() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const deckId = params.deck_id as string;

  useEffect(() => {
    // Fetch the specific deck from localStorage
    try {
      const savedDecks = localStorage.getItem("jpdbDecks");
      console.log(savedDecks);
      if (savedDecks) {
        const parsedDecks = JSON.parse(savedDecks) as Deck[];
        // Compare as strings to handle type differences (URL params are always strings)
        const foundDeck = parsedDecks.find(d => String(d.id) === deckId);
        
        if (foundDeck) {
          setDeck(foundDeck);
        }
      }
    } catch (error) {
      console.error("Error loading deck data:", error);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  const goBack = () => {
    router.push("/decks");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="container mx-auto py-10">
        <Button onClick={goBack} variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Decks
        </Button>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <p className="text-lg mb-4">Deck not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Button onClick={goBack} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Decks
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">{deck.name}</h1>
      
      <div className="p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="font-medium">Vocabulary</p>
            <p>{Math.floor(deck.vocabulary_count * deck.vocabulary_known_coverage / 100)} / {deck.vocabulary_count} words</p>
          </div>
          
          <div>
            <p className="font-medium">Vocabulary Coverage</p>
            <div className="flex justify-between text-sm mb-1">
              <span>Known: {deck.vocabulary_known_coverage.toFixed(2)}%</span>
              <span>In Progress: {(deck.vocabulary_in_progress_coverage - deck.vocabulary_known_coverage).toFixed(2)}%</span>
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
            </div>
          </div>
          
          {deck.is_built_in && (
            <div>
              <p className="text-sm text-muted-foreground">This is a built-in JPDB deck</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 