"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
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
  noun: "bg-pink-200 border-pink-400",
  pronoun: "bg-fuchsia-200 border-fuchsia-400",
  verb: "bg-rose-200 border-rose-400",
  auxiliary: "bg-purple-200 border-purple-400",
  adjective: "bg-blue-200 border-blue-400",
  adverb: "bg-amber-200 border-amber-400",
  determiner: "bg-yellow-200 border-yellow-400",
  preposition: "bg-green-200 border-green-400",
  particle: "bg-emerald-200 border-emerald-400",
  conjunction: "bg-teal-200 border-teal-400",
  interjection: "bg-cyan-200 border-cyan-400",
  punctuation: "bg-gray-200 border-gray-400",
  numeral: "bg-orange-200 border-orange-400",
  counter: "bg-orange-200 border-orange-400",
  suffix: "bg-indigo-200 border-indigo-400",
  prefix: "bg-violet-200 border-violet-400",
  expression: "bg-fuchsia-200 border-fuchsia-400",
  "proper noun": "bg-red-200 border-red-400",
  default: "bg-slate-200 border-slate-400"
};

// Define colors for clause types with more vibrant colors
const clauseColors: Record<string, string> = {
  main: "bg-sky-100 border-sky-400",
  subordinate: "bg-indigo-100 border-indigo-400",
  relative: "bg-violet-100 border-violet-400",
  quotative: "bg-fuchsia-100 border-fuchsia-400",
  default: "bg-slate-100 border-slate-400"
};

// Define colors for grammatical functions with more vibrant colors
const functionColors: Record<string, string> = {
  statement: "bg-blue-200",
  question: "bg-violet-200",
  command: "bg-rose-200",
  request: "bg-purple-200",
  suggestion: "bg-indigo-200",
  wish: "bg-sky-200",
  exclamation: "bg-amber-200",
  condition: "bg-teal-200",
  causative: "bg-emerald-200",
  result: "bg-green-200",
  reason: "bg-yellow-200",
  default: "bg-slate-200"
};

export default function BreakdownPage() {
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingBreakdown, setProcessingBreakdown] = useState(false);
  const [japaneseText, setJapaneseText] = useState("");
  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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
              maxOutputTokens: 8192,
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
      let jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
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
              }
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

Japanese Text to analyze:
${text}

Return ONLY the JSON object without any extra text or explanation.
`;
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
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 bg-card p-3 rounded-md shadow-lg border z-10 min-w-56 max-w-72">
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
            <div className="grid gap-4 max-w-2xl mx-auto">
              {breakdownResult.grammar_points.map((point, idx) => {
                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-primary">{point.pattern}</div>
                      {point.jlpt_level && (
                        <div className="text-xs font-medium px-2 py-0.5 bg-accent/50 rounded-full">
                          JLPT {point.jlpt_level}
                        </div>
                      )}
                    </div>
                    
                    {point.tokens_involved && point.tokens_involved.length > 0 && (
                      <div className="flex gap-1 justify-center mb-2">
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
                    
                    <div className="text-sm text-muted-foreground max-w-md">
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
      <div className="container mx-auto py-10">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Breakdown</h1>
      
      {hasGoogleKey ? (
        <div className="space-y-6">
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <p className="text-lg mb-4">Paste Japanese text to Breakdown:</p>
            
            <div className="space-y-4">
              <textarea
                value={japaneseText}
                onChange={(e) => setJapaneseText(e.target.value)}
                placeholder="Enter Japanese text here..."
                className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <Button 
                onClick={handleBreakdown} 
                disabled={!japaneseText.trim() || processingBreakdown}
                className="w-full md:w-auto"
              >
                {processingBreakdown ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Breakdown Text"
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
              Error: {error}
            </div>
          )}
          
          {breakdownResult && (
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Breakdown Result</h2>
              {renderBreakdownResult()}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <p className="text-lg mb-4">You need to set up your Google API key to use breakdown features.</p>
          <Button onClick={navigateToSettings} className="group">
            Set up Google API Key
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
