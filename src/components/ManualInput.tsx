import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ManualInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function ManualInput({ onSearch, placeholder = "Enter product or brand name..." }: ManualInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-4">
            <Search className="h-8 w-8 text-primary-glow mx-auto" />
            <h3 className="text-2xl font-bold text-foreground">Manual Search</h3>
            <p className="text-base text-muted-foreground">
              Can't scan? Type the product name instead
            </p>
          </div>
          
          <div className="space-y-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="text-center h-12 bg-background/50 border-border/20 rounded-lg shadow-sm focus:shadow-md transition-shadow"
            />
            
            <Button 
              type="submit" 
              className="w-full h-[52px] font-bold"
              disabled={!query.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              Search Ownership
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}