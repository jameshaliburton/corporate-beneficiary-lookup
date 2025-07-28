"use client";

import { Search, ArrowRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ManualInputProps {
  onSearch: (query: string, context?: string) => void;
  placeholder?: string;
  showContextAfterFailure?: boolean; // New prop
  initialValue?: string; // Add prop for initial value
}

export function ManualInput({
  onSearch,
  placeholder = "Enter product or brand name...",
  showContextAfterFailure = false, // Default to false
  initialValue = "" // Default to empty string
}: ManualInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 ManualInput: Form submitted', { query, context, showContext });
    if (query.trim()) {
      // Add a small delay to ensure context is captured
      setTimeout(() => {
        onSearch(query.trim(), context.trim() || undefined); // Pass context
      }, 100);
    }
  };

  const handleContextToggle = () => {
    console.log('🔍 ManualInput: Toggling context', { currentShowContext: showContext });
    setShowContext(!showContext);
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('🔍 ManualInput: Context changed', { value: e.target.value });
    setContext(e.target.value);
  };

  // Show context section if requested after failure
  if (showContextAfterFailure && !showContext) {
    setShowContext(true);
    toast({
      title: "Low confidence result", // Updated toast title
      description: "We found some information but with low confidence. Adding more context can help us find more accurate ownership details.", // Updated toast description
      duration: 5000,
    });
  }

  console.log('🔍 ManualInput: Rendering', { query, context, showContext, showContextAfterFailure });

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-headline mb-2">Manual Search</h1>
            <p className="text-body text-muted-foreground">Enter a brand or company name to find its ownership</p>
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-center h-12 bg-background/50 border-border/20 rounded-lg shadow-sm focus:shadow-md transition-shadow"
          />

          {/* Manual context toggle - only show if not already showing context */}
          {!showContext && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleContextToggle}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <Info className="h-4 w-4" />
                Add additional context (optional)
              </button>
            </div>
          )}

          {/* Context section - only show if explicitly requested or user toggled */}
          {showContext && (
            <div className="space-y-3 border-t border-border/20 pt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground mb-2">
                  {showContextAfterFailure
                    ? "Help us improve the search accuracy by adding more context:" // Updated text
                    : "Need better results?"
                  }
                </p>
              </div>
              <Textarea
                value={context}
                onChange={handleContextChange}
                placeholder="Help us find the right product! Examples:
• 'Bought in Sweden, it's a canned tuna brand'
• 'Think it's from Japan, some kind of snack'
• 'Maybe misspelled - could be 'Nike' instead of 'Nikee''
• 'Found in a local store, organic food brand'"
                className="min-h-[140px] bg-background/50 border-border/20 rounded-lg shadow-sm focus:shadow-md transition-shadow resize-none text-sm font-light text-muted-foreground placeholder:text-muted-foreground/50"
              />
              <p className="text-xs text-muted-foreground">
                Adding context helps our AI find the correct ownership information, especially for lesser-known brands.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-[52px] font-bold"
            disabled={!query.trim()}
          >
            <Search className="h-4 w-4 mr-2" />
            Search Ownership
            {context.trim() && (
              <span className="ml-2 text-xs bg-primary/20 px-2 py-1 rounded">
                + Context
              </span>
            )}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}