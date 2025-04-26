"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";

type Model = {
  name: string;
  displayName: string;
  description: string;
  version: string;
};

export default function Settings() {
  const [jpdbApiKey, setJpdbApiKey] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = "Settings | Kotoba";
  }, []);

  // Load saved keys from localStorage on component mount
  useEffect(() => {
    const savedJpdbKey = localStorage.getItem("jpdbApiKey");
    const savedGoogleKey = localStorage.getItem("googleApiKey");
    const savedModel = localStorage.getItem("selectedGeminiModel");
    
    if (savedJpdbKey) setJpdbApiKey(savedJpdbKey);
    if (savedGoogleKey) setGoogleApiKey(savedGoogleKey);
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  // Fetch models when Google API key is available
  useEffect(() => {
    const fetchModels = async () => {
      if (!googleApiKey) return;
      
      try {
        setIsLoadingModels(true);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleApiKey}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        
        const data = await response.json();
        
        // Filter for only Gemini 2.0 and 2.5 models
        const filteredModels = data.models.filter((model: any) => {
          const name = model.name.toLowerCase();
          return (name.includes('gemini-2.0') || name.includes('gemini-2.5'));
        });
        
        // Deduplicate models by displayName
        // Prioritize non-experimental models
        const modelMap = new Map<string, Model>();
        
        filteredModels.forEach((model: Model) => {
          const existingModel = modelMap.get(model.displayName);
          
          // Skip the models that have names that don't match their base model ID
          // For example, models falsely labeled as 2.5 but still have 2.0 in their name
          if (
            (model.displayName.includes("2.5") && model.name.includes("2.0")) ||
            (model.displayName.includes("2.0") && model.name.includes("1.5"))
          ) {
            return;
          }
          
          // If the model doesn't exist yet, add it
          if (!existingModel) {
            modelMap.set(model.displayName, model);
            return;
          }
          
          // Prefer stable models over experimental models
          const currentIsExp = existingModel.name.includes("-exp-");
          const newIsExp = model.name.includes("-exp-");
          
          if (!newIsExp && currentIsExp) {
            modelMap.set(model.displayName, model);
            return;
          }
          
          // If both are experimental or both are stable, prefer the newer version
          if (newIsExp === currentIsExp) {
            // Check version number - higher is better
            const currentVersion = existingModel.version;
            const newVersion = model.version;
            
            if (newVersion > currentVersion) {
              modelMap.set(model.displayName, model);
            }
          }
        });
        
        // Convert map back to array and sort
        const uniqueModels = Array.from(modelMap.values());
        
        // Sort models: 2.5 before 2.0, Pro before Flash, stable before experimental
        uniqueModels.sort((a, b) => {
          // 2.5 models before 2.0 models
          if (a.name.includes("2.5") && b.name.includes("2.0")) return -1;
          if (a.name.includes("2.0") && b.name.includes("2.5")) return 1;
          
          // Pro before Flash
          if (a.name.includes("-pro-") && b.name.includes("-flash-")) return -1;
          if (a.name.includes("-flash-") && b.name.includes("-pro-")) return 1;
          
          // Standard models before Lite models
          if (!a.name.includes("-lite-") && b.name.includes("-lite-")) return -1;
          if (a.name.includes("-lite-") && !b.name.includes("-lite-")) return 1;
          
          // Non-experimental before experimental
          if (!a.name.includes("-exp-") && b.name.includes("-exp-")) return -1;
          if (a.name.includes("-exp-") && !b.name.includes("-exp-")) return 1;
          
          return a.displayName.localeCompare(b.displayName);
        });
        
        setModels(uniqueModels);
        
        // If no model selected yet but we have models, select the first one
        if (!selectedModel && uniqueModels.length > 0) {
          setSelectedModel(uniqueModels[0].name);
        } else if (uniqueModels.length > 0 && !uniqueModels.some(m => m.name === selectedModel)) {
          // If the previously selected model no longer exists, select the first one
          setSelectedModel(uniqueModels[0].name);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error("Failed to fetch models", {
          description: "Please check your Google API key and try again.",
        });
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [googleApiKey, selectedModel]);

  const saveKeys = () => {
    setIsSaving(true);
    
    // Simulate saving delay for animation
    setTimeout(() => {
      localStorage.setItem("jpdbApiKey", jpdbApiKey);
      localStorage.setItem("googleApiKey", googleApiKey);
      
      if (selectedModel) {
        localStorage.setItem("selectedGeminiModel", selectedModel);
      }
      
      // Show success toast
      toast.success("Settings saved successfully", {
        description: "Your API keys have been saved to local storage",
        duration: 3000,
      });
      
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="jpdbApiKey" className="text-sm font-medium leading-none">
            JPDB API Key
          </label>
          <input
            id="jpdbApiKey"
            type="password"
            value={jpdbApiKey}
            onChange={(e) => setJpdbApiKey(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your JPDB API key"
          />
          <p className="text-sm text-muted-foreground">
            Used for JPDB integration features
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="googleApiKey" className="text-sm font-medium leading-none">
            Google API Key
          </label>
          <input
            id="googleApiKey"
            type="password"
            value={googleApiKey}
            onChange={(e) => setGoogleApiKey(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your Google API key"
          />
          <p className="text-sm text-muted-foreground">
            Used for Google translation services
          </p>
        </div>

        {googleApiKey && (
          <div className="space-y-2">
            <label htmlFor="geminiModel" className="text-sm font-medium leading-none">
              Gemini Model
            </label>
            {isLoadingModels ? (
              <div className="text-sm">Loading models...</div>
            ) : models.length > 0 ? (
              <select
                id="geminiModel"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground">No models available</div>
            )}
            {selectedModel && models.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {models.find(m => m.name === selectedModel)?.description || ''}
              </p>
            )}
            
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">What model do I choose?</h3>
              <p className="text-sm">
                It all depends on the degree of accuracy you want and how much time you're willing to wait. While all models perform well, the Pro models tend to be more accurate and better at picking up nuance, but have longer response times. The Flash models are faster but may miss some subtleties. 
                For most users, the latest Flash model provides a good balance of speed and accuracy.
              </p>
            </div>
          </div>
        )}

        <div>
          <Button 
            onClick={saveKeys} 
            disabled={isSaving}
            className="relative group"
          >
            {isSaving ? (
              <>
                <span className="opacity-0">Save Settings</span>
                <svg 
                  className="absolute inset-0 m-auto h-4 w-4 animate-spin" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110 group-hover:rotate-12" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

