"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

// Define types for the breakdown result
interface TokenAnalysis {
  morpheme: string;
  base: string;
  reading: string;
  romaji: string;
  part_of_speech: string;
  meaning: string;
  etymology?: {
    origin: "native" | "sino-japanese" | "foreign" | "hybrid";
    source?: string;
  };
}

interface Token {
  surface: string;
  base: string;
  reading: string;
  romaji: string;
  part_of_speech: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  meaning: {
    primary: string;
    alternative?: string[];
  };
  formality?: "plain" | "polite" | "honorific" | "humble" | "super-polite" | "neutral";
  polarity?: "positive" | "negative" | "neutral";
  tense?: "present" | "past" | "non-past" | "future" | "timeless";
  aspect?: "perfect" | "progressive" | "resultative" | "habitual" | "simple";
  voice?: "active" | "passive" | "causative" | "causative-passive";
  conjugation_type?: string;
  conjugation_form?: string;
  analysis?: TokenAnalysis[];
  functions?: ("subject" | "topic" | "direct_object" | "indirect_object" | "adverbial" | 
    "modifier" | "predicate" | "auxiliary" | "conjunction" | "filler")[];
}

interface GrammarPoint {
  pattern: string;
  description: string;
  jlpt_level?: "N5" | "N4" | "N3" | "N2" | "N1";
  tokens_involved?: number[];
}

interface BreakdownResult {
  original: string;
  translation: string;
  transliteration?: string;
  sentence_type?: "statement" | "question" | "command" | "request" | "suggestion" | "wish" | "exclamation";
  tokens: Token[];
  grammar_points?: GrammarPoint[];
  structure?: {
    clauses: {
      type: "main" | "subordinate" | "relative" | "quotative";
      function: string;
      token_range: number[];
      local_translation: string;
      mood: string;
      polarity: string;
      subject: string;
      time_reference: string;
      discourse_function: string;
    }[];
  };
  notes?: {
    register?: string;
    tone?: string;
    nuance?: string;
    context?: string;
    gender_association?: "neutral" | "feminine" | "masculine" | "elderly" | "childish";
    regional_dialect?: string;
    cultural_references?: string[];
  };
  error?: string;
  rawResponse?: string;
}

// Color mapping for parts of speech using shadcn-compatible classes with more vibrant colors
const posColors: Record<string, string> = {
  noun: "bg-pink-200 dark:bg-pink-800/70 border-pink-400 dark:border-pink-600",
  pronoun: "bg-fuchsia-200 dark:bg-fuchsia-800/70 border-fuchsia-400 dark:border-fuchsia-600",
  verb: "bg-rose-200 dark:bg-rose-800/70 border-rose-400 dark:border-rose-600",
  auxiliary: "bg-purple-200 dark:bg-purple-800/70 border-purple-400 dark:border-purple-600",
  adjective: "bg-blue-200 dark:bg-blue-800/70 border-blue-400 dark:border-blue-600",
  adverb: "bg-amber-200 dark:bg-amber-800/70 border-amber-400 dark:border-amber-600",
  determiner: "bg-yellow-200 dark:bg-yellow-800/70 border-yellow-400 dark:border-yellow-600",
  preposition: "bg-green-200 dark:bg-green-800/70 border-green-400 dark:border-green-600",
  particle: "bg-emerald-200 dark:bg-emerald-800/70 border-emerald-400 dark:border-emerald-600",
  conjunction: "bg-teal-200 dark:bg-teal-800/70 border-teal-400 dark:border-teal-600",
  interjection: "bg-cyan-200 dark:bg-cyan-800/70 border-cyan-400 dark:border-cyan-600",
  punctuation: "bg-gray-200 dark:bg-gray-700/70 border-gray-400 dark:border-gray-500",
  numeral: "bg-orange-200 dark:bg-orange-800/70 border-orange-400 dark:border-orange-600",
  counter: "bg-orange-200 dark:bg-orange-800/70 border-orange-400 dark:border-orange-600",
  suffix: "bg-indigo-200 dark:bg-indigo-800/70 border-indigo-400 dark:border-indigo-600",
  prefix: "bg-violet-200 dark:bg-violet-800/70 border-violet-400 dark:border-violet-600",
  expression: "bg-fuchsia-200 dark:bg-fuchsia-800/70 border-fuchsia-400 dark:border-fuchsia-600",
  "proper noun": "bg-red-200 dark:bg-red-800/70 border-red-400 dark:border-red-600",
  default: "bg-slate-200 dark:bg-slate-700/70 border-slate-400 dark:border-slate-500"
};

// Define colors for clause types with more vibrant colors
const clauseColors: Record<string, string> = {
  main: "bg-sky-100 dark:bg-sky-900/50 border-sky-400 dark:border-sky-600",
  subordinate: "bg-indigo-100 dark:bg-indigo-900/50 border-indigo-400 dark:border-indigo-600",
  relative: "bg-violet-100 dark:bg-violet-900/50 border-violet-400 dark:border-violet-600",
  quotative: "bg-fuchsia-100 dark:bg-fuchsia-900/50 border-fuchsia-400 dark:border-fuchsia-600",
  default: "bg-slate-100 dark:bg-slate-800/50 border-slate-400 dark:border-slate-600"
};

// Define colors for grammatical functions with more vibrant colors
const functionColors: Record<string, string> = {
  statement: "bg-blue-200 dark:bg-blue-700/60",
  question: "bg-violet-200 dark:bg-violet-700/60",
  command: "bg-rose-200 dark:bg-rose-700/60",
  request: "bg-purple-200 dark:bg-purple-700/60",
  suggestion: "bg-indigo-200 dark:bg-indigo-700/60",
  wish: "bg-sky-200 dark:bg-sky-700/60",
  exclamation: "bg-amber-200 dark:bg-amber-700/60",
  condition: "bg-teal-200 dark:bg-teal-700/60",
  causative: "bg-emerald-200 dark:bg-emerald-700/60",
  result: "bg-green-200 dark:bg-green-700/60",
  reason: "bg-yellow-200 dark:bg-yellow-700/60",
  default: "bg-slate-200 dark:bg-slate-700/60"
};

export default function BreakdownPage() {
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingBreakdown, setProcessingBreakdown] = useState(false);
  const [japaneseText, setJapaneseText] = useState("");
  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [error, setError] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const router = useRouter();

  // Set page title
  useEffect(() => {
    document.title = "Text Breakdown | Kotoba";
  }, []);

  useEffect(() => {
    // Check if Google API key exists in localStorage
    const savedGoogleKey = localStorage.getItem("googleApiKey");
    const savedModel = localStorage.getItem("selectedGeminiModel");
    setHasGoogleKey(!!savedGoogleKey);
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    setIsLoading(false);
  }, []);

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const handleBreakdown = async () => {
    if (!japaneseText.trim()) return;
    
    setProcessingBreakdown(true);
    setError("");
    
    try {
      const googleApiKey = localStorage.getItem("googleApiKey");
      const modelName = selectedModel || "models/gemini-1.5-pro";
      
      // Create the prompt with examples and instructions
      const prompt = createGeminiPrompt(japaneseText);
      
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
        throw new Error(data.error?.message || "Failed to get breakdown");
      }

      // Parse the response to extract the JSON
      const textResponse = data.candidates[0]?.content?.parts[0]?.text || "";
      
      // Extract JSON from the response
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                     textResponse.match(/{[\s\S]*}/);
                     
      let parsedResult: BreakdownResult;
      
      if (jsonMatch) {
        // If we found JSON in markdown format or plain format
        const jsonString = jsonMatch[1] || jsonMatch[0];
        parsedResult = JSON.parse(jsonString);
      } else {
        // Try to parse the entire response as JSON
        try {
          parsedResult = JSON.parse(textResponse);
        } catch (e) {
          // If not valid JSON, use it as a text response
          parsedResult = { 
            original: japaneseText,
            translation: "",
            tokens: [],
            error: "Invalid response format", 
            rawResponse: textResponse 
          };
        }
      }
      
      setBreakdownResult(parsedResult);
    } catch (err: any) {
      console.error("Error in breakdown:", err);
      setError(err.message || "Failed to breakdown the text");
    } finally {
      setProcessingBreakdown(false);
    }
  };

  // Create a detailed prompt for the Gemini model
  const createGeminiPrompt = (text: string) => {
    return `
You are a Japanese language expert. I want you to analyze the following Japanese text and provide a detailed breakdown of its grammatical structure, vocabulary, and meaning.

Please format your response as a valid JSON object according to this schema:

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "JapaneseSentence",
  "type": "object",
  "properties": {
    "original": { "type": "string", "description": "Original Japanese sentence" },
    "translation": { "type": "string", "description": "English translation" },
    "transliteration": { "type": "string", "description": "Romanized transliteration of the full sentence" },
    "sentence_type": { 
      "type": "string", 
      "enum": ["statement", "question", "command", "request", "suggestion", "wish", "exclamation"],
      "description": "The function of the sentence" 
    },
    "tokens": {
      "type": "array",
      "description": "Word-level segments of the sentence",
      "items": {
        "type": "object",
        "properties": {
          "surface": { "type": "string", "description": "Surface-level word or expression" },
          "base": { "type": "string", "description": "Base dictionary form" },
          "reading": { "type": "string", "description": "Reading in hiragana" },
          "romaji": { "type": "string", "description": "Romanized reading" },
          "part_of_speech": { 
            "type": "object",
            "properties": {
              "primary": { "type": "string", "description": "Primary part of speech" },
              "secondary": { "type": "string", "description": "Secondary classification" },
              "tertiary": { "type": "string", "description": "Tertiary classification" }
            },
            "required": ["primary"]
          },
          "meaning": { 
            "type": "object",
            "properties": {
              "primary": { "type": "string", "description": "Main English meaning" },
              "alternative": { 
                "type": "array", 
                "items": { "type": "string" },
                "description": "Alternative meanings"
              }
            },
            "required": ["primary"]
          },
          "formality": { 
            "type": "string", 
            "enum": ["plain", "polite", "honorific", "humble", "super-polite", "neutral"], 
            "description": "Level of formality" 
          },
          "polarity": { 
            "type": "string", 
            "enum": ["positive", "negative", "neutral"], 
            "description": "Polarity of the expression" 
          },
          "tense": {
            "type": "string",
            "enum": ["present", "past", "non-past", "future", "timeless"],
            "description": "Temporal aspect"
          },
          "aspect": {
            "type": "string",
            "enum": ["perfect", "progressive", "resultative", "habitual", "simple"],
            "description": "Aspect of the action"
          },
          "voice": {
            "type": "string",
            "enum": ["active", "passive", "causative", "causative-passive"],
            "description": "Grammatical voice"
          },
          "conjugation_type": { "type": "string", "description": "Conjugation pattern, if applicable" },
          "conjugation_form": { "type": "string", "description": "Form the word is conjugated into" },
          "analysis": {
            "type": "array",
            "description": "Internal morphemes (if compound word)",
            "items": {
              "type": "object",
              "properties": {
                "morpheme": { "type": "string" },
                "base": { "type": "string" },
                "reading": { "type": "string" },
                "romaji": { "type": "string" },
                "part_of_speech": { "type": "string" },
                "meaning": { "type": "string" },
                "etymology": {
                  "type": "object",
                  "properties": {
                    "origin": { "type": "string", "enum": ["native", "sino-japanese", "foreign", "hybrid"] },
                    "source": { "type": "string", "description": "Source word if borrowed" }
                  }
                }
              },
              "required": ["morpheme", "base", "reading", "part_of_speech", "meaning"]
            }
          },
          "functions": {
            "type": "array",
            "description": "Grammatical functions this token serves in the sentence",
            "items": {
              "type": "string",
              "enum": [
                "subject", "topic", "direct_object", "indirect_object", "adverbial", 
                "modifier", "predicate", "auxiliary", "conjunction", "filler"
              ]
            }
          }
        },
        "required": ["surface", "base", "reading", "part_of_speech", "meaning"]
      }
    },
    "grammar_points": {
      "type": "array",
      "description": "Grammar patterns used in the sentence",
      "items": {
        "type": "object",
        "properties": {
          "pattern": { "type": "string", "description": "The grammar pattern" },
          "description": { "type": "string", "description": "Explanation of the pattern" },
          "jlpt_level": { "type": "string", "enum": ["N5", "N4", "N3", "N2", "N1"] },
          "tokens_involved": { 
            "type": "array", 
            "items": { "type": "integer" },
            "description": "Index references to tokens that form this pattern"
          }
        },
        "required": ["pattern", "description"]
      }
    },
    "structure": {
      "type": "object",
      "description": "Sentence structure information",
      "properties": {
        "clauses": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["main", "subordinate", "relative", "quotative"] },
              "function": { "type": "string", "description": "What role this clause serves" },
              "token_range": { 
                "type": "array",
                "items": { "type": "integer" },
                "description": "Start and end indices of tokens in this clause"
              },
              "local_translation": { "type": "string", "description": "English translation of just this clause" },
              "mood": { "type": "string", "enum": ["declarative", "interrogative", "imperative", "subjunctive", "conditional"], "description": "Grammatical mood of the clause" },
              "polarity": { "type": "string", "enum": ["positive", "negative", "neutral"], "description": "Whether the clause is affirmative or negative" },
              "subject": { "type": "string", "description": "The subject of this clause (which might be omitted in Japanese)" },
              "time_reference": { "type": "string", "enum": ["present", "past", "future", "habitual", "timeless"], "description": "When the action in this clause occurs" },
              "discourse_function": { "type": "string", "description": "How this clause connects to the overall discourse (introduces topic, gives reason, states condition, etc.)" }
            }
          }
        }
      }
    },
    "notes": {
      "type": "object",
      "properties": {
        "register": { "type": "string", "description": "Formal/casual/archaic/etc." },
        "tone": { "type": "string", "description": "Emotional or cultural tone (angry, cute, respectful...)" },
        "nuance": { "type": "string", "description": "Subtle implications or how the sentence may come across" },
        "context": { "type": "string", "description": "Typical contexts where this expression would be used" },
        "gender_association": { 
          "type": "string", 
          "enum": ["neutral", "feminine", "masculine", "elderly", "childish"],
          "description": "Whether the expression is associated with particular genders or age groups" 
        },
        "regional_dialect": { "type": "string", "description": "If the expression is dialectal" },
        "cultural_references": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Cultural concepts or references needed to understand the sentence"
        }
      }
    }
  },
  "required": ["original", "translation", "tokens"]
}
Here's an example of the JSON object you should return:
{
  "original": "この書類に記入していただけますか？",
  "translation": "Could you please fill out this form?",
  "transliteration": "Kono shorui ni kinyū shite itadakemasu ka?",
  "sentence_type": "request",
  "tokens": [
    {
      "surface": "この",
      "base": "この",
      "reading": "この",
      "romaji": "kono",
      "part_of_speech": {
        "primary": "determiner",
        "secondary": "demonstrative"
      },
      "meaning": {
        "primary": "this"
      },
      "formality": "neutral",
      "polarity": "neutral",
      "functions": ["modifier"]
    },
    {
      "surface": "書類",
      "base": "書類",
      "reading": "しょるい",
      "romaji": "shorui",
      "part_of_speech": {
        "primary": "noun",
        "secondary": "common"
      },
      "meaning": {
        "primary": "document",
        "alternative": ["form", "paperwork"]
      },
      "formality": "neutral",
      "polarity": "neutral",
      "analysis": [
        {
          "morpheme": "書",
          "base": "書",
          "reading": "しょ",
          "romaji": "sho",
          "part_of_speech": "noun prefix",
          "meaning": "writing",
          "etymology": {
            "origin": "sino-japanese",
            "source": "書 (shū)"
          }
        },
        {
          "morpheme": "類",
          "base": "類",
          "reading": "るい",
          "romaji": "rui",
          "part_of_speech": "noun suffix",
          "meaning": "type, category",
          "etymology": {
            "origin": "sino-japanese",
            "source": "類 (rui)"
          }
        }
      ],
      "functions": ["direct_object"]
    },
    {
      "surface": "に",
      "base": "に",
      "reading": "に",
      "romaji": "ni",
      "part_of_speech": {
        "primary": "particle",
        "secondary": "case"
      },
      "meaning": {
        "primary": "to, in"
      },
      "formality": "neutral",
      "polarity": "neutral",
      "functions": ["adverbial"]
    },
    {
      "surface": "記入して",
      "base": "記入する",
      "reading": "きにゅうして",
      "romaji": "kinyū shite",
      "part_of_speech": {
        "primary": "verb",
        "secondary": "suru-verb",
        "tertiary": "te-form"
      },
      "meaning": {
        "primary": "fill out"
      },
      "formality": "neutral",
      "polarity": "positive",
      "conjugation_type": "suru-verb",
      "conjugation_form": "te-form",
      "analysis": [
        {
          "morpheme": "記入",
          "base": "記入",
          "reading": "きにゅう",
          "romaji": "kinyū",
          "part_of_speech": "noun",
          "meaning": "entry, filling in",
          "etymology": {
            "origin": "sino-japanese"
          }
        },
        {
          "morpheme": "して",
          "base": "する",
          "reading": "して",
          "romaji": "shite",
          "part_of_speech": "verb auxiliary",
          "meaning": "to do (te-form)"
        }
      ],
      "functions": ["predicate"]
    },
    {
      "surface": "いただけます",
      "base": "いただける",
      "reading": "いただけます",
      "romaji": "itadakemasu",
      "part_of_speech": {
        "primary": "auxiliary verb",
        "secondary": "polite potential"
      },
      "meaning": {
        "primary": "can receive (humble)",
        "alternative": ["could you please", "would you mind"]
      },
      "formality": "polite",
      "polarity": "positive",
      "tense": "non-past",
      "aspect": "simple",
      "voice": "humble",
      "conjugation_type": "potential humble auxiliary",
      "conjugation_form": "polite (masu) form",
      "analysis": [
        {
          "morpheme": "いただ",
          "base": "いただく",
          "reading": "いただ",
          "romaji": "itada",
          "part_of_speech": "verb stem",
          "meaning": "to receive (humble)"
        },
        {
          "morpheme": "け",
          "base": "ける",
          "reading": "け",
          "romaji": "ke",
          "part_of_speech": "potential suffix",
          "meaning": "can, able to"
        },
        {
          "morpheme": "ます",
          "base": "ます",
          "reading": "ます",
          "romaji": "masu",
          "part_of_speech": "auxiliary suffix",
          "meaning": "polite ending"
        }
      ],
      "functions": ["auxiliary"]
    },
    {
      "surface": "か",
      "base": "か",
      "reading": "か",
      "romaji": "ka",
      "part_of_speech": {
        "primary": "particle",
        "secondary": "question"
      },
      "meaning": {
        "primary": "question marker"
      },
      "formality": "neutral",
      "polarity": "neutral",
      "functions": ["auxiliary"]
    }
  ],
  "grammar_points": [
    {
      "pattern": "～ていただけますか",
      "description": "Polite request pattern using the potential form of the humble verb 'itadaku'",
      "jlpt_level": "N4",
      "tokens_involved": [3, 4, 5]
    }
  ],
  "structure": {
    "clauses": [
      {
        "type": "main",
        "function": "request",
        "token_range": [0, 5],
        "local_translation": "Could you please fill out this form?",
        "mood": "declarative",
        "polarity": "neutral",
        "subject": "you",
        "time_reference": "present",
        "discourse_function": "request"
      }
    ]
  },
  "notes": {
    "register": "polite business",
    "tone": "respectful, considerate",
    "nuance": "Softens the request with humble language and potential form",
    "context": "Service encounters, office setting, or formal requests",
    "gender_association": "neutral",
    "cultural_references": [
      "Japanese keigo (honorific language) system",
      "Business etiquette emphasizing politeness"
    ]
  }
}

Make sure to include all tokens in structures/clauses don't skip any, meaning you shouldn't skip numbers when giving the token range.

Japanese Text to analyze:
${text}

Return ONLY the JSON object without any extra text or explanation.
`;
  };

  // Function to copy JSON result to clipboard
  const copyJsonToClipboard = () => {
    if (breakdownResult) {
      navigator.clipboard.writeText(JSON.stringify(breakdownResult, null, 2));
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  // Function to render the breakdown result
  const renderBreakdownResult = () => {
    if (!breakdownResult) return null;
    
    if (breakdownResult.error) {
      return (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {breakdownResult.error}
        </div>
      );
    }

    // For visual breakdown display in a single line
    const renderVisualBreakdown = () => {
      // Render the linear sentence breakdown with nested components
      const renderLinearStructure = () => {
        // If we have structure information, use it to create the hierarchical display
        if (breakdownResult.structure && breakdownResult.structure.clauses && breakdownResult.structure.clauses.length > 0) {
          return (
            <div className="flex flex-col space-y-8">
              {/* Main breakdown display */}
              <div className="flex flex-wrap justify-center gap-3 py-4">
                {breakdownResult.structure.clauses.map((clause, clauseIdx) => {
                  const startIdx = clause.token_range[0];
                  const endIdx = clause.token_range[1] || breakdownResult.tokens.length - 1;
                  const clauseType = clause.type || "default";
                  const clauseFunction = clause.function?.toLowerCase() || "default";
                  
                  const clauseColorClass = clauseColors[clauseType] || clauseColors.default;
                  const functionColorClass = functionColors[clauseFunction] || functionColors.default;
                  
                  return (
                    <div
                      key={clauseIdx}
                      className={`${clauseColorClass} rounded-lg border-2 p-3 relative flex flex-col items-center`}
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium bg-card px-2 py-0.5 rounded border">
                        {clause.type} clause
                      </div>
                      
                      <div className={`${functionColorClass} p-2 px-4 rounded-md mb-2 text-xs font-medium text-center w-full`}>
                        {clause.function}
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-2">
                        {breakdownResult.tokens.slice(startIdx, endIdx + 1).map((token, tokenIdx) => {
                          const posType = token.part_of_speech.primary.toLowerCase();
                          const bgColorClass = posColors[posType] || posColors.default;
                          
                          return (
                            <div 
                              key={tokenIdx} 
                              className="group relative"
                            >
                              <div 
                                className={`${bgColorClass} p-2 px-3 rounded border flex flex-col items-center text-center min-w-16`}
                              >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-1 bg-card border rounded-sm">
                                  {token.part_of_speech.primary}
                                </div>
                                <div className="text-lg font-medium">{token.surface}</div>
                                <div className="text-xs text-muted-foreground">{token.reading}</div>
                              </div>
                              
                              {/* Hover details */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 bg-card p-3 rounded-md shadow-lg border z-10 min-w-56 max-w-72 dark:bg-gray-800 dark:border-gray-700">
                                <div className="grid gap-1">
                                  <div><span className="font-semibold">Base:</span> {token.base}</div>
                                  <div><span className="font-semibold">Reading:</span> {token.reading}</div>
                                  <div><span className="font-semibold">Romaji:</span> {token.romaji}</div>
                                  <div>
                                    <span className="font-semibold">Meaning:</span> {token.meaning.primary}
                                    {token.meaning.alternative && token.meaning.alternative.length > 0 && (
                                      <div className="text-xs text-muted-foreground">{token.meaning.alternative.join(", ")}</div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Part of Speech:</span> {token.part_of_speech.primary}
                                    {token.part_of_speech.secondary && (
                                      <div className="text-xs text-muted-foreground">{token.part_of_speech.secondary}</div>
                                    )}
                                  </div>
                                  {token.formality && (
                                    <div><span className="font-semibold">Formality:</span> {token.formality}</div>
                                  )}
                                  {token.tense && (
                                    <div><span className="font-semibold">Tense:</span> {token.tense}</div>
                                  )}
                                  {token.voice && (
                                    <div><span className="font-semibold">Voice:</span> {token.voice}</div>
                                  )}
                                  {token.functions && token.functions.length > 0 && (
                                    <div><span className="font-semibold">Function:</span> {token.functions.join(", ")}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Display local translation */}
                      {clause.local_translation && (
                        <div className="mt-3 p-2 bg-white/30 dark:bg-gray-800/40 rounded-md w-full text-center text-sm border border-slate-200 dark:border-slate-600">
                          <span className="font-medium">Translation:</span> {clause.local_translation}
                        </div>
                      )}
                      
                      {/* Clause hover details */}
                      <div className="absolute bottom-0 right-1 cursor-help group">
                        <div className="text-xs font-medium bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded-full">
                          i
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 bg-card p-3 rounded-md shadow-lg border z-10 min-w-56 max-w-72 dark:bg-gray-800 dark:border-gray-700">
                          <div className="grid gap-1 text-sm">
                            {clause.mood && (
                              <div><span className="font-semibold">Mood:</span> {clause.mood}</div>
                            )}
                            {clause.polarity && (
                              <div><span className="font-semibold">Polarity:</span> {clause.polarity}</div>
                            )}
                            {clause.subject && (
                              <div><span className="font-semibold">Subject:</span> {clause.subject}</div>
                            )}
                            {clause.time_reference && (
                              <div><span className="font-semibold">Time Reference:</span> {clause.time_reference}</div>
                            )}
                            {clause.discourse_function && (
                              <div><span className="font-semibold">Discourse Function:</span> {clause.discourse_function}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Grammar points section */}
              {renderGrammarPhrases()}
            </div>
          );
        } else {
          // If we don't have structure info, just group tokens by basic phrases
          // This is a fallback for when we don't have the full structural analysis
          const renderBasicPhrases = () => {
            // Group tokens into basic phrases (very simple algorithm)
            // This tries to group particles with their preceding nouns/verbs
            const groupedTokens: Token[][] = [];
            let currentGroup: Token[] = [];
            
            breakdownResult.tokens.forEach((token, idx) => {
              const posType = token.part_of_speech.primary.toLowerCase();
              
              // Start a new group if:
              // - Current token is a major word (verb, noun) and we already have tokens
              // - Current token is punctuation
              // - Previous group is already large
              if (
                (["verb", "noun", "pronoun", "adjective"].includes(posType) && currentGroup.length > 0 && 
                 !(currentGroup[currentGroup.length-1].part_of_speech.primary.toLowerCase() === "particle")) ||
                posType === "punctuation" ||
                currentGroup.length >= 3
              ) {
                if (currentGroup.length > 0) {
                  groupedTokens.push([...currentGroup]);
                  currentGroup = [];
                }
              }
              
              currentGroup.push(token);
              
              // After pushing punctuation, always start a new group
              if (posType === "punctuation") {
                groupedTokens.push([...currentGroup]);
                currentGroup = [];
              }
            });
            
            // Add any remaining tokens
            if (currentGroup.length > 0) {
              groupedTokens.push(currentGroup);
            }
            
            return (
              <div className="flex flex-wrap justify-center gap-3 py-4">
                {groupedTokens.map((group, groupIdx) => {
                  // Determine a color for the group based on the main word
                  // Usually the first non-particle is the main word, or the first word if all are particles
                  const mainToken = group.find(t => !["particle", "punctuation"].includes(t.part_of_speech.primary.toLowerCase())) || group[0];
                  const posType = mainToken.part_of_speech.primary.toLowerCase();
                  const bgColorClass = posColors[posType] || posColors.default;
                  
                  return (
                    <div
                      key={groupIdx}
                      className={`${bgColorClass} rounded-lg border p-3 relative`}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-card px-2 py-0.5 rounded border">
                        {mainToken.part_of_speech.primary} Phrase
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-2">
                        {group.map((token, tokenIdx) => {
                          const tokenPosType = token.part_of_speech.primary.toLowerCase();
                          const tokenColorClass = posColors[tokenPosType] || posColors.default;
                          
                          return (
                            <div 
                              key={tokenIdx} 
                              className="group relative"
                            >
                              <div 
                                className={`${tokenColorClass} p-2 px-3 rounded border flex flex-col items-center text-center min-w-16`}
                              >
                                <div className="text-lg font-medium">{token.surface}</div>
                                <div className="text-xs text-muted-foreground">{token.reading}</div>
                              </div>
                              
                              {/* Hover details */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 bg-card p-3 rounded-md shadow-lg border z-10 min-w-56 max-w-72">
                                <div className="grid gap-1">
                                  <div><span className="font-semibold">Base:</span> {token.base}</div>
                                  <div><span className="font-semibold">Reading:</span> {token.reading}</div>
                                  <div><span className="font-semibold">Romaji:</span> {token.romaji}</div>
                                  <div><span className="font-semibold">Meaning:</span> {token.meaning.primary}</div>
                                  <div><span className="font-semibold">Part:</span> {token.part_of_speech.primary}</div>
                                  {token.functions && token.functions.length > 0 && (
                                    <div><span className="font-semibold">Function:</span> {token.functions.join(", ")}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          };
          
          return (
            <div className="flex flex-col space-y-8">
              {renderBasicPhrases()}
              {renderGrammarPhrases()}
            </div>
          );
        }
      };

      // Group tokens into grammar phrases if we have that info
      const renderGrammarPhrases = () => {
        if (!breakdownResult.grammar_points || breakdownResult.grammar_points.length === 0) {
          return null;
        }

        return (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-center">Grammar Patterns</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {breakdownResult.grammar_points.map((point, idx) => {
                return (
                  <div key={idx} className="flex flex-col p-4 bg-card border rounded-lg shadow-sm w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-primary">{point.pattern}</div>
                      {point.jlpt_level && (
                        <div className="text-xs font-medium px-2 py-0.5 bg-accent/50 rounded-full">
                          JLPT {point.jlpt_level}
                        </div>
                      )}
                    </div>
                    
                    {point.tokens_involved && point.tokens_involved.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {point.tokens_involved.map((tokenIdx) => {
                          const token = breakdownResult.tokens[tokenIdx];
                          if (!token) return null;
                          
                          const posType = token.part_of_speech.primary.toLowerCase();
                          const bgColorClass = posColors[posType] || posColors.default;
                          
                          return (
                            <div 
                              key={tokenIdx} 
                              className={`${bgColorClass} p-1 px-2 rounded-md text-sm border-2 border-primary/40 text-center`}
                            >
                              {token.surface}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground mt-auto">
                      {point.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      };

      return (
        <div className="space-y-8">
          {/* Full sentence display */}
          <div className="mb-8 text-center">
            <h3 className="text-lg font-medium mb-2">Original Sentence</h3>
            <div className="text-2xl font-medium p-4 bg-muted/40 rounded-lg border mx-auto max-w-3xl">
              {breakdownResult.original}
            </div>
            <div className="mt-2 text-foreground">
              {breakdownResult.translation}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {breakdownResult.transliteration}
            </div>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary-foreground">
              {breakdownResult.sentence_type}
            </div>
          </div>
          
          {/* Linear structure visualization */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-center">Sentence Structure</h3>
            {renderLinearStructure()}
          </div>
          
          {/* Notes section */}
          {breakdownResult.notes && (
            <div className="space-y-2 mt-8 p-4 bg-accent/20 rounded-lg border border-accent/40 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-center">Notes</h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {breakdownResult.notes.register && (
                  <div className="py-1"><span className="font-semibold">Register:</span> {breakdownResult.notes.register}</div>
                )}
                {breakdownResult.notes.tone && (
                  <div className="py-1"><span className="font-semibold">Tone:</span> {breakdownResult.notes.tone}</div>
                )}
                {breakdownResult.notes.nuance && (
                  <div className="py-1 sm:col-span-2"><span className="font-semibold">Nuance:</span> {breakdownResult.notes.nuance}</div>
                )}
                {breakdownResult.notes.context && (
                  <div className="py-1 sm:col-span-2"><span className="font-semibold">Context:</span> {breakdownResult.notes.context}</div>
                )}
                {breakdownResult.notes.gender_association && (
                  <div className="py-1"><span className="font-semibold">Gender Association:</span> {breakdownResult.notes.gender_association}</div>
                )}
              </div>
              {breakdownResult.notes.cultural_references && breakdownResult.notes.cultural_references.length > 0 && (
                <div className="py-1">
                  <span className="font-semibold">Cultural References:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {breakdownResult.notes.cultural_references.map((ref, index) => (
                      <li key={index}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return renderVisualBreakdown();
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
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Text Breakdown</h1>
      
      {hasGoogleKey ? (
        <div className="space-y-8">
          <div className="p-8 bg-card rounded-xl border shadow-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="bg-primary/20 text-primary p-2 rounded-md mr-2">
                <ArrowRight className="w-5 h-5" />
              </span>
              Japanese Text Analysis
            </h2>
            
            <div className="space-y-6">
              <textarea
                value={japaneseText}
                onChange={(e) => setJapaneseText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && japaneseText.trim() && !processingBreakdown) {
                    e.preventDefault();
                    handleBreakdown();
                  }
                }}
                placeholder="Enter Japanese text here..."
                className="w-full min-h-[120px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all bg-background/50"
              />
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Paste any Japanese sentence to get a detailed grammatical breakdown
                </p>
                <Button 
                  onClick={handleBreakdown} 
                  disabled={!japaneseText.trim() || processingBreakdown}
                  className="px-6"
                >
                  {processingBreakdown ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Analyze Text</>
                  )}
                </Button>
              </div>
            </div>
            
            {!breakdownResult && (
              <div className="mt-10 border-t pt-6">
                <div className="flex flex-col space-y-8">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">What You'll Get</h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Our AI-powered breakdown analyzes any Japanese text to provide a comprehensive 
                      understanding of vocabulary, grammar, and nuance.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-muted/40 p-5 rounded-lg border flex flex-col items-center text-center">
                      <div className="bg-primary/20 p-2 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                      </div>
                      <h4 className="font-medium mb-2">Word Analysis</h4>
                      <p className="text-sm text-muted-foreground">Detailed breakdown of every word including readings, meanings, and parts of speech</p>
                    </div>
                    
                    <div className="bg-muted/40 p-5 rounded-lg border flex flex-col items-center text-center">
                      <div className="bg-primary/20 p-2 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/><path d="M19 3h-4"/><path d="M19 21h-4"/><line x1="3" y1="9" x2="7" y2="9"/><line x1="3" y1="15" x2="7" y2="15"/><line x1="17" y1="9" x2="21" y2="9"/><line x1="17" y1="15" x2="21" y2="15"/></svg>
                      </div>
                      <h4 className="font-medium mb-2">Grammar Patterns</h4>
                      <p className="text-sm text-muted-foreground">Identification of key grammar structures with JLPT levels and explanations</p>
                    </div>
                    
                    <div className="bg-muted/40 p-5 rounded-lg border flex flex-col items-center text-center">
                      <div className="bg-primary/20 p-2 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8V5a2 2 0 0 0-2-2h-5.5"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="3" y1="7" x2="7" y2="7"/><line x1="21" y1="12" x2="21" y2="16"/><line x1="16" y1="20" x2="16" y2="16"/><line x1="21" y1="16" x2="16" y2="16"/><line x1="7" y1="12" x2="7" y2="20"/></svg>
                      </div>
                      <h4 className="font-medium mb-2">Sentence Structure</h4>
                      <p className="text-sm text-muted-foreground">Visual representation of sentence structure with clauses and grammatical functions</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-6 border border-dashed mt-4">
                    <h4 className="font-medium mb-3 text-center">Example Breakdown</h4>
                    <div className="flex flex-wrap justify-center gap-3 py-2">
                      <div className="bg-pink-200 dark:bg-pink-800/70 border-pink-400 dark:border-pink-600 p-2 px-3 rounded border flex flex-col items-center text-center min-w-16">
                        <div className="text-lg font-medium">私は</div>
                        <div className="text-xs text-muted-foreground">わたしは</div>
                      </div>
                      <div className="bg-blue-200 dark:bg-blue-800/70 border-blue-400 dark:border-blue-600 p-2 px-3 rounded border flex flex-col items-center text-center min-w-16">
                        <div className="text-lg font-medium">日本語を</div>
                        <div className="text-xs text-muted-foreground">にほんごを</div>
                      </div>
                      <div className="bg-rose-200 dark:bg-rose-800/70 border-rose-400 dark:border-rose-600 p-2 px-3 rounded border flex flex-col items-center text-center min-w-16">
                        <div className="text-lg font-medium">勉強して</div>
                        <div className="text-xs text-muted-foreground">べんきょうして</div>
                      </div>
                      <div className="bg-purple-200 dark:bg-purple-800/70 border-purple-400 dark:border-purple-600 p-2 px-3 rounded border flex flex-col items-center text-center min-w-16">
                        <div className="text-lg font-medium">います</div>
                        <div className="text-xs text-muted-foreground">います</div>
                      </div>
                    </div>
                    <p className="text-center mt-4 text-muted-foreground text-sm italic">
                      "I am studying Japanese."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              Error: {error}
            </div>
          )}
          
          {breakdownResult && (
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Breakdown Result</h2>
                <Button 
                  onClick={copyJsonToClipboard}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {hasCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
              </div>
              {renderBreakdownResult()}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 bg-card rounded-xl border shadow-md max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-primary/20 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">API Key Required</h2>
              <p className="text-muted-foreground mb-6 max-w-lg">
                To use the text breakdown feature, you need to set up your Google API key. 
                This enables our AI-powered analysis of Japanese sentences.
              </p>
            </div>
            <Button onClick={navigateToSettings} className="group px-6 py-6 h-auto text-lg">
              Set up Google API Key
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          
          <div className="mt-10 pt-8 border-t">
            <h3 className="text-lg font-medium mb-4 text-center">What the Breakdown Feature Offers:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-1.5 rounded mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-sm">Complete morphological analysis of every word and particle</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-1.5 rounded mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-sm">Visual breakdown of sentence structure and grammar</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-1.5 rounded mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-sm">Identification of JLPT grammar points with explanations</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-1.5 rounded mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-sm">Cultural notes and nuance explanations for accurate understanding</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
