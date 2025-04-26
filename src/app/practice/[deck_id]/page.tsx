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

// Type definition for sentence evaluation
type SentenceEvaluation = {
  request: {
    sentence: string;
    required_words: string[];
  };
  evaluation: {
    is_correct: boolean;
    grade: "good" | "passing" | "failure";
    uses_required_words: boolean;
    score?: number;
  };
  language_analysis: {
    translation: string;
    pronunciation: string;
    detected_issues?: {
      issue_type: string;
      description: string;
      severity?: "minor" | "moderate" | "major";
    }[];
    required_words_usage?: {
      word: string;
      used_form: string;
      correct_usage: boolean;
      notes?: string;
    }[];
  };
  feedback: {
    summary: string;
    specific_points?: string[];
    grammar_explanations?: {
      grammar_point: string;
      explanation: string;
      jlpt_level?: "N5" | "N4" | "N3" | "N2" | "N1";
    }[];
  };
  suggestions?: {
    improved_sentence: string;
    translation: string;
    explanation?: string;
  }[];
};

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
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<SentenceEvaluation | null>(null);
  
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
    
    // Filter for only "known" words
    filtered = filtered.filter(vocab => {
      const cardState = vocab[FIELD_INDICES.card_state];
      // Check if the card state includes "known"
      return Array.isArray(cardState) && cardState.some(state => 
        typeof state === 'string' && state.toLowerCase() === 'known'
      );
    });
    
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
    setEvaluationResult(null);
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

  const handleSubmitAnswer = async () => {
    if (!submittedAnswer.trim()) return;
    
    setEvaluationLoading(true);
    setIsAnswerCorrect(null);
    setEvaluationResult(null);
    
    try {
      // Get required words from practice words
      const requiredWords = practiceWords.map(word => word[FIELD_INDICES.spelling]);
      
      // Get Google API key from localStorage
      const googleApiKey = localStorage.getItem("googleApiKey");
      if (!googleApiKey) {
        throw new Error("Google API key not found");
      }
      
      // Get selected model from localStorage or use default
      const modelName = localStorage.getItem("selectedGeminiModel") || "models/gemini-1.5-pro";
      
      // Create the prompt for evaluation
      const prompt = createEvaluationPrompt(submittedAnswer, requiredWords);
      
      // Make request to Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${googleApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
            },
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to evaluate sentence");
      }

      // Parse the response to extract the JSON
      const textResponse = data.candidates[0]?.content?.parts[0]?.text || "";
      
      // Extract JSON from the response
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/{[\s\S]*}/);
                     
      let evaluationData: SentenceEvaluation;
      
      if (jsonMatch) {
        // If we found JSON in markdown format or plain format
        const jsonString = jsonMatch[1] || jsonMatch[0];
        evaluationData = JSON.parse(jsonString);
      } else {
        // Try to parse the entire response as JSON
        try {
          evaluationData = JSON.parse(textResponse);
        } catch (e) {
          // If not valid JSON, create a minimal result
          throw new Error("Invalid response format from API");
        }
      }
      
      setEvaluationResult(evaluationData);
      setIsAnswerCorrect(evaluationData.evaluation.uses_required_words && evaluationData.evaluation.is_correct);
      
    } catch (err: any) {
      console.error("Error evaluating sentence:", err);
      setIsAnswerCorrect(false);
    } finally {
      setEvaluationLoading(false);
    }
  };

  // Create a detailed prompt for the Gemini model
  const createEvaluationPrompt = (sentence: string, requiredWords: string[]) => {
    return `
You are a Japanese language expert. I want you to evaluate the following Japanese sentence and provide detailed feedback, especially regarding the use of specific required vocabulary words.

Please format your response as a valid JSON object according to this schema:

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "JapaneseSentenceEvaluation",
  "description": "Schema for evaluating Japanese sentences using required vocabulary words",
  "type": "object",
  "properties": {
    "request": {
      "type": "object",
      "properties": {
        "sentence": {
          "type": "string",
          "description": "The Japanese sentence submitted by the user"
        },
        "required_words": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Japanese words that must be used in the sentence"
        }
      },
      "required": ["sentence", "required_words"]
    },
    "evaluation": {
      "type": "object",
      "properties": {
        "is_correct": {
          "type": "boolean",
          "description": "Whether the sentence is grammatically correct"
        },
        "grade": {
          "type": "string",
          "enum": ["good", "passing", "failure"],
          "description": "Overall grade for the sentence"
        },
        "uses_required_words": {
          "type": "boolean",
          "description": "Whether the sentence uses all the required words"
        },
        "score": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Numerical score"
        }
      },
      "required": ["is_correct", "grade", "uses_required_words"]
    },
    "language_analysis": {
      "type": "object",
      "properties": {
        "translation": {
          "type": "string",
          "description": "English translation of the sentence"
        },
        "pronunciation": {
          "type": "string",
          "description": "Romanized pronunciation of the sentence"
        },
        "detected_issues": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "issue_type": {
                "type": "string",
                "enum": ["grammar", "vocabulary", "clarity", "natural_expression", "structure", "particle_usage", "conjugation", "word_form", "word_choice"],
                "description": "Type of issue detected"
              },
              "description": {
                "type": "string",
                "description": "Description of the issue"
              },
              "severity": {
                "type": "string",
                "enum": ["minor", "moderate", "major"],
                "description": "How severely this affects understanding"
              }
            },
            "required": ["issue_type", "description"]
          }
        },
        "required_words_usage": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "word": {
                "type": "string",
                "description": "The required word"
              },
              "used_form": {
                "type": "string",
                "description": "The form of the word as used in the sentence"
              },
              "correct_usage": {
                "type": "boolean",
                "description": "Whether the word was used correctly"
              },
              "notes": {
                "type": "string",
                "description": "Notes about usage of this word"
              }
            },
            "required": ["word", "used_form", "correct_usage"]
          }
        }
      },
      "required": ["translation", "pronunciation"]
    },
    "feedback": {
      "type": "object",
      "properties": {
        "summary": {
          "type": "string",
          "description": "Overall feedback about the sentence"
        },
        "specific_points": {
          "type": "array",
          "items": {
            "type": "string",
            "description": "Specific feedback points"
          }
        },
        "grammar_explanations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "grammar_point": {
                "type": "string",
                "description": "The grammar point being explained"
              },
              "explanation": {
                "type": "string",
                "description": "Explanation of the grammar point"
              },
              "jlpt_level": {
                "type": "string",
                "enum": ["N5", "N4", "N3", "N2", "N1"],
                "description": "JLPT level of this grammar point"
              }
            },
            "required": ["grammar_point", "explanation"]
          }
        }
      },
      "required": ["summary"]
    },
    "suggestions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "improved_sentence": {
            "type": "string",
            "description": "An improved version of the sentence"
          },
          "translation": {
            "type": "string",
            "description": "English translation of the improved sentence"
          },
          "explanation": {
            "type": "string",
            "description": "Explanation of the improvements made"
          }
        },
        "required": ["improved_sentence", "translation"]
      },
      "description": "Suggested improvements to the sentence"
    }
  },
  "required": ["request", "evaluation", "feedback"]
}

Here's an example of the expected JSON response format:

{
  "request": {
    "sentence": "先生はよく選んだ。",
    "required_words": ["選ぶ", "先生"]
  },
  "evaluation": {
    "is_correct": true,
    "grade": "passing",
    "uses_required_words": true,
    "score": 75
  },
  "language_analysis": {
    "translation": "The teacher chose well.",
    "pronunciation": "Sensei wa yoku eranda.",
    "detected_issues": [
      {
        "issue_type": "clarity",
        "description": "The sentence doesn't specify what was chosen, making the meaning ambiguous.",
        "severity": "moderate"
      },
      {
        "issue_type": "natural_expression",
        "description": "Using よく with 選ぶ without an object feels incomplete to native speakers.",
        "severity": "minor"
      }
    ],
    "required_words_usage": [
      {
        "word": "先生",
        "used_form": "先生",
        "correct_usage": true,
        "notes": "Used correctly as the subject/topic of the sentence."
      },
      {
        "word": "選ぶ",
        "used_form": "選んだ",
        "correct_usage": true,
        "notes": "Correctly conjugated to past tense form 選んだ."
      }
    ]
  },
  "feedback": {
    "summary": "Your sentence is grammatically correct and uses both required words properly. However, it lacks clarity because it doesn't specify what was chosen.",
    "specific_points": [
      "The sentence structure is correct with a topic (先生) and verb (選んだ).",
      "The verb 選ぶ is correctly conjugated to past tense form.",
      "Without context, it's unclear what the teacher chose, making the sentence feel incomplete.",
      "The adverb よく (well) is used correctly but would be more natural if what was being chosen was specified."
    ],
    "grammar_explanations": [
      {
        "grammar_point": "は as a topic marker",
        "explanation": "は (wa) marks the topic of the sentence, in this case establishing 先生 (teacher) as what the sentence is about.",
        "jlpt_level": "N5"
      },
      {
        "grammar_point": "Verb past tense conjugation",
        "explanation": "The verb 選ぶ (to choose) is conjugated to its past tense form 選んだ by changing the final う to ん and adding だ.",
        "jlpt_level": "N5"
      }
    ]
  },
  "suggestions": [
    {
      "improved_sentence": "先生は良い本を選んだ。",
      "translation": "The teacher chose a good book.",
      "explanation": "Adding an object (本/book) clarifies what was chosen, making the sentence more complete and natural."
    },
    {
      "improved_sentence": "私はいい先生を選びました。",
      "translation": "I chose a good teacher.",
      "explanation": "This alternative changes the role of 先生 from subject to object, providing a different way to use both required words naturally."
    },
    {
      "improved_sentence": "先生は慎重に学生を選んだ。",
      "translation": "The teacher carefully selected students.",
      "explanation": "Using an adverb like 慎重に (carefully) instead of よく and adding an object creates a more specific and natural sentence."
    }
  ]
}

Japanese Sentence to evaluate:
${sentence}

Required words that must be used in the sentence:
${JSON.stringify(requiredWords)}

Check if all required words (or their conjugated forms) are used in the sentence. Be strict but also recognize verb conjugations, adjective forms, and other grammatical variations.

Return ONLY the JSON object without any extra text or explanation.
`;
  };

  // Render evaluation result
  const renderEvaluationResult = () => {
    if (!evaluationResult) return null;
    
    return (
      <div className="mt-6 space-y-6">
        <div className={`p-4 rounded-lg ${
          evaluationResult.evaluation.grade === 'good' ? 'bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600' :
          evaluationResult.evaluation.grade === 'passing' ? 'bg-amber-100 dark:bg-amber-900/20 border border-amber-400 dark:border-amber-600' :
          'bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-lg">Evaluation Result</h3>
            <div className="flex items-center gap-2">
              {evaluationResult.evaluation.score && (
                <span className="px-2 py-1 bg-background/60 rounded-md text-sm font-medium">
                  Score: {evaluationResult.evaluation.score}/100
                </span>
              )}
              <span className={`px-2 py-1 rounded-md text-sm font-medium ${
                evaluationResult.evaluation.grade === 'good' ? 'bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200' :
                evaluationResult.evaluation.grade === 'passing' ? 'bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200' :
                'bg-red-200 dark:bg-red-800/60 text-red-800 dark:text-red-200'
              }`}>
                {evaluationResult.evaluation.grade === 'good' ? 'Good' :
                 evaluationResult.evaluation.grade === 'passing' ? 'Passing' : 'Needs Work'}
              </span>
            </div>
          </div>
          
          <p className="mb-3">{evaluationResult.feedback.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-1">Translation:</h4>
                <p className="bg-background/40 p-2 rounded">{evaluationResult.language_analysis.translation}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Pronunciation:</h4>
                <p className="bg-background/40 p-2 rounded">{evaluationResult.language_analysis.pronunciation}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Required Words Usage:</h4>
              <div className="space-y-2">
                {evaluationResult.language_analysis.required_words_usage?.map((wordUsage, index) => (
                  <div key={index} className={`p-2 rounded ${
                    wordUsage.correct_usage ? 'bg-green-100/50 dark:bg-green-900/10' : 'bg-red-100/50 dark:bg-red-900/10'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {wordUsage.correct_usage ? 
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> : 
                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      }
                      <span className="font-medium">{wordUsage.word}</span>
                      <span className="text-muted-foreground text-sm">→</span>
                      <span>{wordUsage.used_form}</span>
                    </div>
                    {wordUsage.notes && <p className="text-sm mt-1">{wordUsage.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {evaluationResult.language_analysis.detected_issues && evaluationResult.language_analysis.detected_issues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Identified Issues:</h4>
              <div className="space-y-2">
                {evaluationResult.language_analysis.detected_issues.map((issue, index) => (
                  <div key={index} className={`p-2 rounded ${
                    issue.severity === 'minor' ? 'bg-blue-100/50 dark:bg-blue-900/10' :
                    issue.severity === 'moderate' ? 'bg-amber-100/50 dark:bg-amber-900/10' :
                    'bg-red-100/50 dark:bg-red-900/10'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        issue.severity === 'minor' ? 'bg-blue-200 dark:bg-blue-800/60' :
                        issue.severity === 'moderate' ? 'bg-amber-200 dark:bg-amber-800/60' :
                        'bg-red-200 dark:bg-red-800/60'
                      }`}>
                        {issue.issue_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {issue.severity && `(${issue.severity})`}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{issue.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {evaluationResult.suggestions && evaluationResult.suggestions.length > 0 && (
          <div className="p-4 rounded-lg bg-card border shadow-sm">
            <h3 className="font-medium text-lg mb-3">Suggested Improvements</h3>
            <div className="space-y-4">
              {evaluationResult.suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 rounded-md bg-muted/40 border">
                  <p className="font-medium">{suggestion.improved_sentence}</p>
                  <p className="text-sm text-muted-foreground mt-1">{suggestion.translation}</p>
                  {suggestion.explanation && (
                    <p className="text-sm mt-2 bg-background/40 p-2 rounded">{suggestion.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {evaluationResult.feedback.grammar_explanations && evaluationResult.feedback.grammar_explanations.length > 0 && (
          <div className="p-4 rounded-lg bg-card border shadow-sm">
            <h3 className="font-medium text-lg mb-3">Grammar Explanations</h3>
            <div className="space-y-3">
              {evaluationResult.feedback.grammar_explanations.map((grammarPoint, index) => (
                <div key={index} className="p-3 rounded-md bg-muted/40 border">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{grammarPoint.grammar_point}</h4>
                    {grammarPoint.jlpt_level && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary-foreground">
                        JLPT {grammarPoint.jlpt_level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{grammarPoint.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Set page title
  useEffect(() => {
    document.title = deck 
      ? `Practice: ${deck.name} | Kotoba` 
      : "Vocabulary Practice | Kotoba";
  }, [deck]);

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
        
        <Button onClick={() => setShowSettings(true)} variant="outline" size="icon">
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
                      <Button 
                        onClick={handleSubmitAnswer}
                        disabled={!submittedAnswer.trim() || evaluationLoading}
                      >
                        {evaluationLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Evaluating...
                          </>
                        ) : 'Submit'}
                      </Button>
                    </div>
                    
                    {isAnswerCorrect !== null && !evaluationResult && !evaluationLoading && (
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
                    
                    {evaluationResult && renderEvaluationResult()}
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