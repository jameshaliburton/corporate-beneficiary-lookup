import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  onInfoClick?: () => void;
}

export function AppHeader({ onInfoClick }: AppHeaderProps) {
  const router = useRouter();

  const handleInfoClick = () => {
    if (onInfoClick) {
      onInfoClick();
    } else {
      router.push('/about');
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">O</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">OwnedBy</h1>
          <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
            Beta
          </span>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInfoClick}
        className="text-muted-foreground hover:text-foreground"
      >
        <Info className="h-4 w-4" />
      </Button>
    </header>
  );
}