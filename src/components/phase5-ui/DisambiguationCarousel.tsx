import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHashColor } from "@/lib/utils/colorUtils";
import { fetchLogoWithTimeout } from "@/lib/utils/fetchLogoWithTimeout";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./ui/swiper-styles.css";

interface DisambiguationEntity {
  id: string;
  name: string;
  type: string;
  country: string;
  countryFlag: string;
  description: string;
  suggested: boolean;
  logo?: string;
  confidence?: number;
  confidence_score?: number;
  financial_beneficiary?: string;
  tagline?: string;
}

interface DisambiguationScreenProps {
  entities: DisambiguationEntity[];
  searchTerm: string;
  onChoose: (entity: DisambiguationEntity) => void;
  onNotSure: () => void;
}

// Logo component with search and serif fallback
const EntityLogo = ({ entity }: { entity: DisambiguationEntity }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchLogoWithTimeout(entity.name).then((url) => {
      setLogoUrl(url);
      setIsLoading(false);
    });
  }, [entity.name]);

  if (isLoading) {
    return (
      <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
    );
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${entity.name} logo`}
        className="w-16 h-16 rounded-lg object-contain"
        onError={() => setLogoUrl(null)}
      />
    );
  }

  // Serif fallback with larger font
  return (
    <div
      className="w-16 h-16 flex items-center justify-center rounded-lg text-4xl font-serif"
      style={{
        backgroundColor: getHashColor(entity.name || "?"),
        fontFamily: "'Noto Serif Display', serif",
      }}
    >
      {entity.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

export const DisambiguationScreen = ({ 
  entities, 
  searchTerm, 
  onChoose, 
  onNotSure 
}: DisambiguationScreenProps) => {
  const suggestedIndex = entities.findIndex(e => e.suggested);
  const [activeIndex, setActiveIndex] = useState(suggestedIndex >= 0 ? suggestedIndex : 0);
  const [shouldNudge, setShouldNudge] = useState(false);

  const currentEntity = entities[activeIndex];

  // Nudge animation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldNudge(true);
      setTimeout(() => setShouldNudge(false), 1000);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Skip carousel if only one option
  if (entities.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">
            We found a match for {searchTerm}
          </h1>
          <p className="text-muted-foreground">
            Here's what we found
          </p>
        </div>

        <div className="w-full max-w-sm">
          <Card className="w-full bg-card border-2 shadow-lg">
            <CardContent className="p-6 h-full flex flex-col justify-between space-y-4">
              <div className="flex flex-col items-center text-center space-y-4">
                              <div className="flex justify-center">
                <EntityLogo entity={entities[0]} />
              </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">{entities[0].name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{entities[0].countryFlag}</span>
                    <Badge variant="secondary" className="capitalize">
                      {entities[0].type}
                    </Badge>
                  </div>
                  {entities[0].confidence_score !== undefined && (
                    <p className="text-xs text-muted-foreground">Confidence: {entities[0].confidence_score}%</p>
                  )}
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                        {entities[0].description || "No description available"}
                      </p>
                </div>
              </div>

              {entities[0].suggested && (
                <div className="flex justify-center">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ⭐ Suggested
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={() => onChoose(entities[0])}
          className="w-full max-w-sm h-12 text-base font-medium"
          size="lg"
        >
          ✅ Choose this one
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">
          We found multiple matches for {searchTerm}
        </h1>
        <p className="text-muted-foreground">
          Swipe or use arrows to pick the one that matches your product
        </p>
        <p className="text-sm text-muted-foreground">
          Option {activeIndex + 1} of {entities.length}
        </p>
      </div>

      {/* Carousel */}
      <div 
        className={`w-full max-w-md relative ${shouldNudge ? 'animate-pulse' : ''}`}
        style={{
          transform: shouldNudge ? 'translateX(-2px)' : 'translateX(0)',
          transition: 'transform 0.1s ease-in-out'
        }}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          slidesPerView={1.2}
          centeredSlides={true}
          spaceBetween={20}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{
            el: '.swiper-pagination-custom',
            clickable: true,
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          initialSlide={activeIndex}
          className="pb-12"
        >
          {entities.map((entity, index) => {
            return (
            <SwiperSlide key={`${entity.id || entity.name}-${index}`}>
              <Card className="w-full h-96 bg-card border-2 shadow-lg">
                <CardContent className="p-6 h-full flex flex-col justify-between">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Logo with search and serif fallback */}
                    <div className="flex justify-center">
                      <EntityLogo entity={entity} />
                    </div>

                    {/* Entity info */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold">{entity.name}</h3>
                      {entity.tagline && (
                        <p className="text-sm text-gray-400 mt-1">{entity.tagline}</p>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">{entity.countryFlag}</span>
                        <Badge variant="secondary" className="capitalize">
                          {entity.type}
                        </Badge>
                      </div>
                      {entity.confidence_score !== undefined && (
                        <p className="text-xs text-muted-foreground">Confidence: {entity.confidence_score}%</p>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {entity.description || "No description available"}
                      </p>
                    </div>
                  </div>

                  {/* Suggested badge */}
                  {entity.suggested && (
                    <div className="flex justify-center">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ⭐ Suggested
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </SwiperSlide>
          );
          })}
        </Swiper>

        {/* Custom Navigation Arrows */}
        <button 
          className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background border rounded-full shadow-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
          disabled={activeIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button 
          className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background border rounded-full shadow-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
          disabled={activeIndex === entities.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Custom Pagination */}
        <div className="swiper-pagination-custom flex justify-center mt-4"></div>
      </div>

      {/* Action button */}
      <div className="w-full max-w-sm">
        <Button 
          onClick={() => onChoose(currentEntity)}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          ✅ Choose this one
        </Button>
      </div>
    </div>
  );
};