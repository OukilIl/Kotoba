"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, BookOpen, Brain, Crop, Globe, Settings, Server } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("features");

  // Set page title
  useEffect(() => {
    document.title = "Kotoba | Japanese Learning Toolkit";
  }, []);

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
      {/* Hero section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
          Kotoba
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
          A browser-based Japanese language learning toolkit with powerful analysis and practice tools
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/breakdown">
            <Button size="lg" className="gap-2">
              Try Text Breakdown <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="lg" className="gap-2">
              Setup <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <a href="https://kotoba-app.xyz" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" className="gap-2">
              Live Version <Globe className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* Main content */}
      <Tabs defaultValue="features" className="max-w-5xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="getStarted">Get Started</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Text Breakdown</CardTitle>
                <CardDescription>Analyze Japanese sentences in detail</CardDescription>
              </CardHeader>
              <CardContent>
                Get comprehensive breakdowns of grammar, vocabulary, and language nuances powered by Google's Gemini AI.
              </CardContent>
              <CardFooter>
                <Link href="/breakdown">
                  <Button variant="ghost" className="gap-2">
                    Try it <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Vocabulary Practice</CardTitle>
                <CardDescription>Practice with your JPDB vocabulary</CardDescription>
              </CardHeader>
              <CardContent>
                Create sentences using your vocabulary decks and get AI-powered feedback to improve your Japanese writing skills.
              </CardContent>
              <CardFooter>
                <Link href="/decks">
                  <Button variant="ghost" className="gap-2">
                    View decks <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Browser-Only</CardTitle>
                <CardDescription>No server, no login required</CardDescription>
              </CardHeader>
              <CardContent>
                Everything runs in your browser. No accounts to create, no servers to connect to. Just open and start learning.
              </CardContent>
              <CardFooter>
                <Link href="/settings">
                  <Button variant="ghost" className="gap-2">
                    Setup keys <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="getStarted" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started Guide</CardTitle>
              <CardDescription>Follow these steps to set up Kotoba</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">1. Set up your API keys</h3>
                  <p className="text-muted-foreground">
                    Go to the <Link href="/settings" className="text-primary underline">Settings page</Link> to configure your API keys:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Add your JPDB API key to access your vocabulary decks</li>
                    <li>Add your Google API key for text breakdown and analysis features</li>
                    <li>Select your preferred Gemini model (Flash models are faster, Pro models are more accurate)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2. Explore text breakdown</h3>
                  <p className="text-muted-foreground">
                    Visit the <Link href="/breakdown" className="text-primary underline">Breakdown page</Link> to analyze any Japanese text:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Enter or paste Japanese text</li>
                    <li>Get detailed analysis of grammar, vocabulary and structure</li>
                    <li>See JLPT grammar points with explanations</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">3. Practice with your vocabulary</h3>
                  <p className="text-muted-foreground">
                    Browse your <Link href="/decks" className="text-primary underline">Vocabulary Decks</Link> and create practice sessions:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Select words by part of speech (verbs, nouns, adjectives, etc.)</li>
                    <li>Create sentences using the words provided</li>
                    <li>Get feedback and improve your writing skills</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>About Kotoba</CardTitle>
              <CardDescription>
                An open-source Japanese learning tool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Kotoba is a free, open-source application designed to help Japanese language learners analyze and practice
                with their vocabulary. It connects with JPDB for vocabulary management and uses Google's Gemini models for
                advanced text analysis.
              </p>
              <p>
                The application runs entirely in your browser - no server-side processing, no user accounts, and no data stored
                except in your browser's local storage.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="https://kotoba-app.xyz" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Live Version
                  </Button>
                </a>
                <a href="https://github.com/yourusername/kotoba" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21C9.5 20.77 9.5 20.14 9.5 19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26C14.5 19.6 14.5 20.68 14.5 21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.477 17.523 2 12 2Z" fill="currentColor"/>
                    </svg>
                    GitHub
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Testimonial-style section */}
      <div className="mt-20 p-6 bg-muted/40 rounded-xl border shadow-sm max-w-4xl mx-auto">
        <blockquote className="text-xl md:text-2xl italic text-center">
          "Improve your Japanese through instant analysis and targeted practice"
        </blockquote>
        <div className="flex justify-center mt-6">
          <div className="px-8 py-2 bg-primary/30 rounded-full text-sm font-medium">
            Browser-based · Open Source · No Account Required
          </div>
        </div>
      </div>
    </div>
  );
}
