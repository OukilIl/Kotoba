"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
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

// Define vocabulary types
type VocabularyItem = [number, number]; // [vid, sid]
type VocabularyInfo = any[]; // Full vocabulary item with all requested fields

// Card state constants
const CARD_STATES = [
  "new", "known", "due", "suspended", "locked",
  "learning", "never forget", "failed", "blacklisted", "redundant"
];

// Define the field mapping for display
const fieldLabels: Record<string, string> = {
  vid: "Vocabulary ID",
  sid: "Spelling ID",
  rid: "Reading ID",
  spelling: "Spelling",
  reading: "Reading",
  frequency_rank: "Frequency Rank",
  meanings: "Meanings",
  card_level: "Card Level",
  card_state: "Card State",
  due_at: "Due At",
  alt_sids: "Alt Spelling IDs",
  alt_spellings: "Alt Spellings",
  part_of_speech: "Type",
  meanings_part_of_speech: "Meanings Type",
  meanings_chunks: "Meanings Chunks"
};

// Type mapping
const posLabels: Record<string, string> = {
  "adj-i": "い-Adjective",
  "adj-na": "な-Adjective",
  "adj-no": "の-Adjective",
  "adj-pn": "Pre-noun Adjective",
  "adv": "Adverb",
  "aux-adj": "Auxiliary Adjective",
  "aux-v": "Auxiliary Verb",
  "conj": "Conjunction",
  "cop": "Copula",
  "ctr": "Counter",
  "exp": "Expression",
  "int": "Interjection",
  "n": "Noun",
  "num": "Numeral",
  "pn": "Pronoun",
  "pref": "Prefix",
  "prt": "Particle",
  "suf": "Suffix",
  "v1": "Ichidan Verb (一段動詞)",
  "v1-s": "Ichidan Verb Special (一段動詞)",
  "v5": "Godan Verb (五段動詞)",
  "v5aru": "Godan Verb ある Special",
  "v5b": "Godan Verb ぶ Ending",
  "v5g": "Godan Verb ぐ Ending",
  "v5k": "Godan Verb く Ending",
  "v5k-s": "Godan Verb く Special",
  "v5m": "Godan Verb む Ending",
  "v5n": "Godan Verb ぬ Ending",
  "v5r": "Godan Verb る Ending",
  "v5r-i": "Godan Verb る Irregular",
  "v5s": "Godan Verb す Ending",
  "v5t": "Godan Verb つ Ending",
  "v5u": "Godan Verb う Ending",
  "v5u-s": "Godan Verb う Special",
  "va": "Adjectival Verb",
  "vi": "Intransitive Verb (自動詞)",
  "vk": "来る Verb",
  "vs": "する Verb",
  "vt": "Transitive Verb (他動詞)"
};

export default function DeckDetailPage() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [vocabularyLoading, setVocabularyLoading] = useState(false);
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [vocabularyDetails, setVocabularyDetails] = useState<VocabularyInfo[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<VocabularyInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCardStateFilters, setActiveCardStateFilters] = useState<string[]>([]);
  const [fieldsToFetch, setFieldsToFetch] = useState<string[]>([
    "vid", "sid", "rid", "spelling", "reading", "frequency_rank", 
    "meanings", "card_level", "card_state", "due_at", "alt_sids", 
    "alt_spellings", "part_of_speech", "meanings_part_of_speech", "meanings_chunks"
  ]);
  const itemsPerPage = 50;

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

  useEffect(() => {
    // Fetch vocabulary list when deck is loaded
    const fetchVocabulary = async () => {
      if (!deck) return;
      
      try {
        setVocabularyLoading(true);
        
        // Get API key from localStorage
        const apiKey = localStorage.getItem("jpdbApiKey");
        if (!apiKey) {
          console.error("JPDB API key not found");
          return;
        }
        
        // Step 1: Fetch vocabulary list
        const vocabResponse = await fetch("https://jpdb.io/api/v1/deck/list-vocabulary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            id: Number(deck.id),
            fetch_occurences: false
          })
        });
        
        if (!vocabResponse.ok) {
          throw new Error(`Error fetching vocabulary: ${vocabResponse.status}`);
        }
        
        const vocabData = await vocabResponse.json();
        setVocabularyList(vocabData.vocabulary);
        
        // Step 2: Lookup vocabulary details
        if (vocabData.vocabulary && vocabData.vocabulary.length > 0) {
          const lookupResponse = await fetch("https://jpdb.io/api/v1/lookup-vocabulary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              list: vocabData.vocabulary,
              fields: fieldsToFetch
            })
          });
          
          if (!lookupResponse.ok) {
            throw new Error(`Error looking up vocabulary: ${lookupResponse.status}`);
          }
          
          const lookupData = await lookupResponse.json();
          setVocabularyDetails(lookupData.vocabulary_info);
          setFilteredVocabulary(lookupData.vocabulary_info);
          console.log(lookupData.vocabulary_info);
        }
      } catch (error) {
        console.error("Error fetching vocabulary data:", error);
      } finally {
        setVocabularyLoading(false);
      }
    };
    
    fetchVocabulary();
  }, [deck, fieldsToFetch]);

  // Filter vocabulary based on search term and card state filters
  useEffect(() => {
    if (vocabularyDetails.length === 0) return;

    const spellingIndex = fieldsToFetch.indexOf("spelling");
    const readingIndex = fieldsToFetch.indexOf("reading");
    const meaningIndex = fieldsToFetch.indexOf("meanings");
    const cardStateIndex = fieldsToFetch.indexOf("card_state");

    let filtered = [...vocabularyDetails];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vocab => {
        // Search in spelling
        if (vocab[spellingIndex] && vocab[spellingIndex].toLowerCase().includes(term)) {
          return true;
        }
        // Search in reading
        if (vocab[readingIndex] && vocab[readingIndex].toLowerCase().includes(term)) {
          return true;
        }
        // Search in meanings
        if (vocab[meaningIndex] && Array.isArray(vocab[meaningIndex])) {
          return vocab[meaningIndex].some(meaning => 
            meaning.toLowerCase().includes(term)
          );
        }
        return false;
      });
    }

    // Filter by card states
    if (activeCardStateFilters.length > 0) {
      filtered = filtered.filter(vocab => {
        if (!vocab[cardStateIndex] || !Array.isArray(vocab[cardStateIndex])) {
          return false;
        }
        // Check if any of the vocab's card states match any of the active filters
        const vocabStates = vocab[cardStateIndex].map(state => 
          typeof state === 'string' ? state.toLowerCase() : state
        );
        return activeCardStateFilters.some(filter => 
          vocabStates.includes(filter.toLowerCase())
        );
      });
    }

    setFilteredVocabulary(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, activeCardStateFilters, vocabularyDetails, fieldsToFetch]);

  // Calculate pagination
  const totalPages = Math.ceil((filteredVocabulary?.length || 0) / itemsPerPage);
  const paginatedVocabulary = filteredVocabulary.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goBack = () => {
    router.push("/decks");
  };

  // Toggle card state filter
  const toggleCardStateFilter = (state: string) => {
    setActiveCardStateFilters(prev => {
      if (prev.includes(state)) {
        return prev.filter(s => s !== state);
      } else {
        return [...prev, state];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setActiveCardStateFilters([]);
  };

  // Helper function to format field value for display
  const formatFieldValue = (field: string, value: any) => {
    if (field === "meanings" && Array.isArray(value)) {
      return value.join("; ");
    }
    if (field === "alt_spellings" && Array.isArray(value)) {
      return value.join(", ");
    }
    if (field === "alt_sids" && Array.isArray(value)) {
      return value.join(", ");
    }
    if (field === "due_at" && value) {
      // Convert timestamp to readable date if it exists
      return new Date(value * 1000).toLocaleString();
    }
    if (field === "card_state") {
      const states: Record<number, string> = {
        0: "New", 
        1: "Learning", 
        2: "Due", 
        3: "Buried", 
        4: "Suspended"
      };
      return states[value] || value;
    }
    if (field === "part_of_speech" && Array.isArray(value)) {
      return value.map(pos => posLabels[pos] || pos).join(", ");
    }
    return value?.toString() || "N/A";
  };

  // Set page title
  useEffect(() => {
    document.title = deck 
      ? `${deck.name} | Deck | Kotoba` 
      : "Deck Detail | Kotoba";
  }, [deck]);

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
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{deck.name}</h1>
        <Button 
          onClick={() => router.push(`/practice/${deckId}`)} 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6"
        >
          Practice Now
        </Button>
      </div>
      
      <div className="p-6 bg-card rounded-lg border shadow-sm mb-6">
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

      {/* Vocabulary List Section */}
      <div className="p-6 bg-card rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Vocabulary List</h2>
        
        {/* Search and Filter Controls */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2.5"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Card State Filters */}
          <div>
            <p className="text-sm font-medium mb-2">Filter by card state:</p>
            <div className="flex flex-wrap gap-2">
              {CARD_STATES.map(state => (
                <button
                  key={state}
                  onClick={() => toggleCardStateFilter(state)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeCardStateFilters.includes(state)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </button>
              ))}
              
              {(searchTerm || activeCardStateFilters.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 ml-auto"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          
          {/* Filter Results Count */}
          {(searchTerm || activeCardStateFilters.length > 0) && (
            <p className="text-sm text-muted-foreground">
              Found {filteredVocabulary.length} out of {vocabularyDetails.length} total terms
            </p>
          )}
        </div>
        
        {vocabularyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p>Loading vocabulary...</p>
          </div>
        ) : filteredVocabulary.length > 0 ? (
          <>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-
                {Math.min(currentPage * itemsPerPage, filteredVocabulary.length)} of {filteredVocabulary.length} terms
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Vocabulary Cards */}
            <div className="space-y-6">
              {paginatedVocabulary.map((vocab, index) => {
                // Find the indexes of the spelling and reading in the fields array
                const spellingIndex = fieldsToFetch.indexOf("spelling");
                const readingIndex = fieldsToFetch.indexOf("reading");
                const meaningIndex = fieldsToFetch.indexOf("meanings");
                const cardStateIndex = fieldsToFetch.indexOf("card_state");
                
                return (
                  <div key={index} className="p-4 bg-card/50 rounded-lg border">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="text-xl font-medium mr-3">{vocab[spellingIndex]}</span>
                        <span className="text-sm text-muted-foreground">{vocab[readingIndex]}</span>
                      </div>
                      {vocab[cardStateIndex] && Array.isArray(vocab[cardStateIndex]) && (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {vocab[cardStateIndex].map((state: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                              {state}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="mb-3 font-medium">{Array.isArray(vocab[meaningIndex]) ? vocab[meaningIndex].join("; ") : vocab[meaningIndex]}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {fieldsToFetch.map((field, fieldIndex) => {
                        // Skip primary display fields that we've already shown above
                        // Also skip meanings_chunks and other unneeded fields
                        if (field === "spelling" || 
                            field === "reading" || 
                            field === "meanings" || 
                            field === "meanings_chunks" || 
                            field === "card_state" ||
                            field === "meanings_part_of_speech" ||
                            field === "sid" ||
                            field === "rid" ||
                            field === "vid") {
                          return null;
                        }
                        
                        return (
                          <div key={field} className="flex">
                            <span className="font-medium mr-2">{fieldLabels[field]}:</span>
                            <span className="text-muted-foreground">{formatFieldValue(field, vocab[fieldIndex])}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination Controls (Bottom) */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            {vocabularyDetails.length > 0 
              ? "No vocabulary matches your filters." 
              : "No vocabulary available for this deck."}
          </p>
        )}
      </div>
    </div>
  );
} 