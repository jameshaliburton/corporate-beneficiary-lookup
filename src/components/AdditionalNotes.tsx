import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AdditionalNotesProps {
  notes: string[];
}

export const AdditionalNotes = ({ notes }: AdditionalNotesProps) => {
  const [showAll, setShowAll] = useState(false);
  
  if (notes.length === 0) return null;

  const displayedNotes = showAll ? notes : notes.slice(0, 3);
  const hasMoreNotes = notes.length > 3;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">📝 Additional Ownership Notes</h2>
      <div className="p-4 bg-muted/50 rounded-lg space-y-3">
        {displayedNotes.map((note, index) => (
          <p key={index} className="text-sm text-muted-foreground leading-relaxed">
            {note}
          </p>
        ))}
        
        {hasMoreNotes && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 w-full justify-center mt-3 p-0 h-auto text-xs"
          >
            {showAll ? (
              <>
                Show fewer notes
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show {notes.length - 3} more notes
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};