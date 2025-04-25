"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Settings, RefreshCw, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Type definitions
type Deck = {
  id: string;
  name: string;
  vocabulary_count: number;
  word_count: number;
  vocabulary_known_coverage: number;
  vocabulary_in_progress_coverage: number;
  is_built_in: boolean;
};

type VocabularyItem = [number, number]; // [vid, sid]
type VocabularyInfo = any[]; // Full vocabulary item with all requested fields

// Map field indexes
const FIELD_INDICES = {
  vid: 0,
  sid: 1,
  spelling: 2,
  reading: 3,
  frequency_rank: 4,
  meanings: 5,
  card_level: 6,
  card_state: 7,
  due_at: 8,
  part_of_speech: 9
};

// Word types (parts of speech)
const POS_CATEGORIES = [
  {
    name: "Verbs",
    types: ["v1", "v1-s", "v5", "v5aru", "v5b", "v5g", "v5k", "v5k-s", "v5m", "v5n", "v5r", "v5r-i", "v5s", "v5t", "v5u", "v5u-s", "va", "vi", "vk", "vs", "vt"]
  },
  {
    name: "Adjectives",
    types: ["adj-i", "adj-na", "adj-no", "adj-pn", "aux-adj"]
  },
  {
    name: "Nouns",
    types: ["n", "pn", "ctr"]
  },
  {
    name: "Adverbs",
    types: ["adv"]
  },
  {
    name: "Other",
    types: ["aux-v", "conj", "cop", "exp", "int", "num", "pref", "prt", "suf"]
  }
];

// Detailed labels for parts of speech
const POS_LABELS: { [key: string]: string } = {
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

export default function PracticePage() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [vocabularyLoading, setVocabularyLoading] = useState(false);
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [vocabularyDetails, setVocabularyDetails] = useState<VocabularyInfo[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<VocabularyInfo[]>([]);
  const [practiceWords, setPracticeWords] = useState<VocabularyInfo[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  
  // Practice settings
  const [wordCountByCategory, setWordCountByCategory] = useState<Record<string, number>>(
    POS_CATEGORIES.reduce((acc, category) => ({ ...acc, [category.name]: 0 }), {})
  );
  const [showMeanings, setShowMeanings] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const router = useRouter();
  const params = useParams();
  const deckId = params.deck_id as string;

  useEffect(() => {
    // Fetch the specific deck from localStorage
    try {
      const savedDecks = localStorage.getItem("jpdbDecks");
      if (savedDecks) {
        const parsedDecks = JSON.parse(savedDecks) as Deck[];
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
    // Fetch vocabulary when deck is loaded
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
          const fieldsToFetch = [
            "vid", "sid", "spelling", "reading", "frequency_rank", 
            "meanings", "card_level", "card_state", "due_at", "part_of_speech"
          ];
          
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
          console.log("Vocabulary details loaded:", lookupData.vocabulary_info.length);
        }
      } catch (error) {
        console.error("Error fetching vocabulary data:", error);
      } finally {
        setVocabularyLoading(false);
      }
    };
    
    fetchVocabulary();
  }, [deck]);

  // Filter vocabulary by selected word types
  useEffect(() => {
    if (vocabularyDetails.length === 0) return;

    let filtered = [...vocabularyDetails];
    
    // Apply part of speech filters if any are selected
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(vocab => {
        const pos = vocab[FIELD_INDICES.part_of_speech];
        if (!pos || !Array.isArray(pos)) return false;
        return pos.some(type => selectedTypes.includes(type));
      });
    }

    setFilteredVocabulary(filtered);
  }, [selectedTypes, vocabularyDetails]);

  // Generate practice words
  const generatePracticeWords = () => {
    if (filteredVocabulary.length === 0) return;
    
    // Group vocabulary by category
    const vocabByCategory: Record<string, VocabularyInfo[]> = {};
    
    // Initialize empty arrays for each category
    POS_CATEGORIES.forEach(category => {
      vocabByCategory[category.name] = [];
    });
    
    // Categorize vocabulary items
    filteredVocabulary.forEach(vocab => {
      const pos = vocab[FIELD_INDICES.part_of_speech];
      if (!pos || !Array.isArray(pos)) return;
      
      // Find which category this word belongs to
      for (const category of POS_CATEGORIES) {
        const belongsToCategory = pos.some(type => category.types.includes(type));
        if (belongsToCategory) {
          vocabByCategory[category.name].push(vocab);
          break; // Assign to first matching category
        }
      }
    });
    
    // Select requested number of words from each category
    let selectedWords: VocabularyInfo[] = [];
    
    Object.entries(wordCountByCategory).forEach(([category, count]) => {
      // Only include words if category has types selected AND count > 0
      const hasSelectedTypes = POS_CATEGORIES.find(c => c.name === category)?.types.some(
        type => selectedTypes.includes(type)
      ) || false;
      
      if (count > 0 && hasSelectedTypes && vocabByCategory[category].length > 0) {
        // Shuffle the words in this category
        const shuffled = [...vocabByCategory[category]].sort(() => 0.5 - Math.random());
        // Take requested number or all available if less
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        selectedWords = [...selectedWords, ...selected];
      }
    });
    
    // Final shuffle to mix categories
    selectedWords = selectedWords.sort(() => 0.5 - Math.random());
    
    setPracticeWords(selectedWords);
    setSubmittedAnswer('');
    setIsAnswerCorrect(null);
    setIsReady(true);
  };
  
  // Update count for a specific category
  const updateCategoryCount = (category: string, count: number) => {
    // Check if this category has any selected types
    const hasSelectedTypes = POS_CATEGORIES.find(c => c.name === category)?.types.some(
      type => selectedTypes.includes(type)
    ) || false;
    
    // If category has selected types, enforce a minimum of 1
    const minCount = hasSelectedTypes ? 1 : 0;
    
    setWordCountByCategory(prev => ({
      ...prev,
      [category]: Math.max(minCount, count) // Ensure count respects minimum
    }));
  };

  // Handle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const categoryData = POS_CATEGORIES.find(c => c.name === category);
      if (!categoryData) return prev;
      
      // Check if category is already selected
      if (prev.includes(category)) {
        // Remove category and its types
        const updatedCategories = prev.filter(c => c !== category);
        setSelectedTypes(current => 
          current.filter(type => !categoryData.types.includes(type))
        );
        
        // Reset the count to 0 for this category
        updateCategoryCount(category, 0);
        
        return updatedCategories;
      } else {
        // Add category
        return [...prev, category];
      }
    });
  };

  // Check if we have selected any words
  const hasSelectedWords = () => {
    return Object.entries(wordCountByCategory).some(([category, count]) => {
      // Check if category has any selected types AND count > 0
      const hasSelectedTypes = POS_CATEGORIES.find(c => c.name === category)?.types.some(
        type => selectedTypes.includes(type)
      ) || false;
      
      return count > 0 && hasSelectedTypes;
    });
  };

  // Handle type selection
  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      let newSelectedTypes;
      if (prev.includes(type)) {
        // Remove type
        newSelectedTypes = prev.filter(t => t !== type);
      } else {
        // Add type
        newSelectedTypes = [...prev, type];
      }
      
      // Find which category this type belongs to
      for (const category of POS_CATEGORIES) {
        if (category.types.includes(type)) {
          // Check if this was the first type selected in this category
          const wasEmpty = !category.types.some(t => prev.includes(t));
          const isEmpty = !category.types.some(t => newSelectedTypes.includes(t));
          
          // If we're adding the first type in this category, set count to 1
          if (wasEmpty && !isEmpty) {
            updateCategoryCount(category.name, 1);
          }
          
          // If we're removing the last type in this category, allow count to be 0
          if (!wasEmpty && isEmpty) {
            setWordCountByCategory(prev => ({
              ...prev,
              [category.name]: 0
            }));
          }
          
          break;
        }
      }
      
      return newSelectedTypes;
    });
  };

  // Handle category checkbox change
  const handleCategoryCheckboxChange = (category: string) => {
    const isPartial = isCategoryPartiallySelected(category);
    const isFull = isCategoryFullySelected(category);
    
    const categoryData = POS_CATEGORIES.find(c => c.name === category);
    if (!categoryData) return;
    
    if (isPartial || !isFull) {
      // Select all types in this category
      setSelectedTypes(prev => {
        const currentTypes = new Set(prev);
        categoryData.types.forEach(type => currentTypes.add(type));
        return Array.from(currentTypes);
      });
      
      // Make sure the category is selected too
      if (!selectedCategories.includes(category)) {
        setSelectedCategories(prev => [...prev, category]);
      }
      
      // Set count to 1 when selecting this category
      updateCategoryCount(category, 1);
    } else {
      // Deselect all types in this category
      setSelectedTypes(prev => 
        prev.filter(type => !categoryData.types.includes(type))
      );
      
      // Remove the category selection too
      setSelectedCategories(prev => prev.filter(c => c !== category));
      
      // Reset the count to 0 for this category
      updateCategoryCount(category, 0);
    }
  };

  // Start practice with current settings
  const startPractice = () => {
    generatePracticeWords();
    setShowSettings(false);
  };

  // Check if a category is fully selected (all its types are selected)
  const isCategoryFullySelected = (category: string) => {
    const categoryData = POS_CATEGORIES.find(c => c.name === category);
    if (!categoryData) return false;
    
    return categoryData.types.every(type => selectedTypes.includes(type));
  };

  // Check if a category is partially selected
  const isCategoryPartiallySelected = (category: string) => {
    const categoryData = POS_CATEGORIES.find(c => c.name === category);
    if (!categoryData) return false;
    
    const hasSelected = categoryData.types.some(type => selectedTypes.includes(type));
    return hasSelected && !isCategoryFullySelected(category);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const goBack = () => {
    router.push(`/decks/${deckId}`);
  };

  const handleSubmitAnswer = () => {
    // Simple validation - we'd need more sophisticated validation in a real app
    setIsAnswerCorrect(submittedAnswer.trim().length > 0);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="container mx-auto py-10">
        <Button onClick={goBack} variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deck
        </Button>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <p className="text-lg mb-4">Deck not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={goBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deck
        </Button>
        
        <Button onClick={openSettings} variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Practice: {deck.name}</h1>
      
      {vocabularyLoading ? (
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg">Loading vocabulary...</p>
          </div>
        </div>
      ) : (
        <>
          {showSettings ? (
            <div className="p-6 bg-card rounded-lg border shadow-sm mb-6">
              <h2 className="text-xl font-semibold mb-4">Practice Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="show-meanings" className="font-medium">Show word meanings</Label>
                  <Switch 
                    id="show-meanings"
                    checked={showMeanings}
                    onCheckedChange={setShowMeanings}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-base font-medium mb-2">Select word types and count:</h3>
                  <div className="space-y-2">
                    {POS_CATEGORIES.map((category) => (
                      <div key={category.name} className="rounded-md border">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`category-${category.name}`}
                              checked={isCategoryFullySelected(category.name) || isCategoryPartiallySelected(category.name)}
                              data-state={isCategoryPartiallySelected(category.name) ? "indeterminate" : isCategoryFullySelected(category.name) ? "checked" : "unchecked"}
                              className={isCategoryPartiallySelected(category.name) ? "opacity-80" : ""}
                              onCheckedChange={() => handleCategoryCheckboxChange(category.name)}
                            />
                            <Label 
                              htmlFor={`category-${category.name}`}
                              className="text-base font-medium"
                            >
                              {category.name}
                            </Label>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateCategoryCount(category.name, wordCountByCategory[category.name] - 1)}
                                disabled={wordCountByCategory[category.name] <= 1 || !selectedTypes.some(type => category.types.includes(type))}
                              >
                                -
                              </Button>
                              <Input
                                id={`count-${category.name}`}
                                type="number"
                                min={selectedTypes.some(type => category.types.includes(type)) ? 1 : 0}
                                max="10"
                                className="w-12 h-7 text-center"
                                value={wordCountByCategory[category.name]}
                                onChange={(e) => updateCategoryCount(category.name, parseInt(e.target.value) || 0)}
                                disabled={!selectedTypes.some(type => category.types.includes(type))}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateCategoryCount(category.name, wordCountByCategory[category.name] + 1)}
                                disabled={!selectedTypes.some(type => category.types.includes(type))}
                              >
                                +
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleCategoryExpansion(category.name)}
                            >
                              {expandedCategories[category.name] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {expandedCategories[category.name] && (
                          <div className="px-3 pb-3 pt-1 border-t">
                            <div className="grid grid-cols-2 gap-2">
                              {category.types.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`type-${type}`}
                                    checked={selectedTypes.includes(type)}
                                    onCheckedChange={() => toggleType(type)}
                                  />
                                  <Label 
                                    htmlFor={`type-${type}`}
                                    className="text-sm"
                                  >
                                    {POS_LABELS[type]}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            
                            {selectedTypes.filter(type => category.types.includes(type)).length > 0 && (
                              <div className="mt-2 flex justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {selectedTypes.filter(type => category.types.includes(type)).length} of {category.types.length} types selected
                                </p>
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto text-xs"
                                  onClick={() => handleCategoryCheckboxChange(category.name)}
                                >
                                  {isCategoryFullySelected(category.name) ? "Deselect all" : "Select all"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!expandedCategories[category.name] && isCategoryPartiallySelected(category.name) && (
                          <div className="px-3 pb-3 pt-1 border-t">
                            <div className="flex flex-wrap gap-1">
                              {selectedTypes.filter(type => category.types.includes(type)).map(type => (
                                <div key={type} className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                                  {POS_LABELS[type]}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={startPractice} 
                  className="w-full"
                  disabled={filteredVocabulary.length === 0 || selectedTypes.length === 0 || !hasSelectedWords()}
                >
                  Start Practice
                </Button>
                
                {selectedTypes.length === 0 && (
                  <p className="text-sm text-destructive mt-2">
                    Please select at least one word type
                  </p>
                )}
                
                {!hasSelectedWords() && selectedTypes.length > 0 && (
                  <p className="text-sm text-destructive mt-2">
                    Please select at least one word to practice
                  </p>
                )}
                
                {filteredVocabulary.length === 0 && selectedTypes.length > 0 && (
                  <p className="text-sm text-destructive mt-2">
                    No vocabulary items match your selected criteria
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {isReady && (
                <div className="p-6 bg-card rounded-lg border shadow-sm mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create a sentence with these words:</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={generatePracticeWords}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-4 w-4" /> New words
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 my-6">
                    {practiceWords.map((word, index) => (
                      <div key={index} className="p-3 bg-muted/40 rounded-lg border">
                        <p className="text-lg font-semibold">{word[FIELD_INDICES.spelling]}</p>
                        <p className="text-sm text-muted-foreground">{word[FIELD_INDICES.reading]}</p>
                        {showMeanings && (
                          <p className="mt-1 text-sm">
                            {Array.isArray(word[FIELD_INDICES.meanings]) 
                              ? word[FIELD_INDICES.meanings].join("; ") 
                              : word[FIELD_INDICES.meanings]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="sentence">Write your sentence:</Label>
                    <Textarea 
                      id="sentence"
                      placeholder="Type your sentence using the words above..."
                      className="min-h-32"
                      value={submittedAnswer}
                      onChange={(e) => setSubmittedAnswer(e.target.value)}
                    />
                    
                    <div className="flex justify-end">
                      <Button onClick={handleSubmitAnswer}>Submit</Button>
                    </div>
                    
                    {isAnswerCorrect !== null && (
                      <div className={`p-4 rounded-lg flex items-center gap-2 ${
                        isAnswerCorrect ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      }`}>
                        {isAnswerCorrect ? (
                          <>
                            <Check className="h-5 w-5" />
                            <p>Great job! Your sentence uses the required words.</p>
                          </>
                        ) : (
                          <>
                            <X className="h-5 w-5" />
                            <p>Please make sure your sentence includes all the required words.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 