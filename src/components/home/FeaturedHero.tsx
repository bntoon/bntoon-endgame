import { useState, useEffect, useRef, type KeyboardEvent, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface FeaturedSeries {
  id: string;
  title: string;
  cover_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  status: string;
  type?: string;
  chaptersCount?: number;
  genres?: Genre[];
}

interface FeaturedHeroProps {
  series: FeaturedSeries[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ongoing: { color: "bg-emerald-500", label: "Ongoing" },
  completed: { color: "bg-blue-500", label: "Completed" },
  hiatus: { color: "bg-amber-500", label: "Hiatus" },
  cancelled: { color: "bg-red-500", label: "Cancelled" },
  dropped: { color: "bg-gray-500", label: "Dropped" },
};

export function FeaturedHero({ series }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const featuredSeries = series.slice(0, 5);

  useEffect(() => {
    if (!isAutoPlaying || featuredSeries.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredSeries.length, currentIndex]);

  const handleTransition = (newIndex: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + featuredSeries.length) % featuredSeries.length;
    handleTransition(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % featuredSeries.length;
    handleTransition(newIndex);
  };

  const temporarilyPauseAutoplay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (Math.abs(swipeDistance) < minSwipeDistance) return;

    if (swipeDistance > 0) {
      handleNext();
    } else {
      handlePrev();
    }

    temporarilyPauseAutoplay();
  };

  const handleKeyNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handlePrev();
      temporarilyPauseAutoplay();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleNext();
      temporarilyPauseAutoplay();
    }
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    handleTransition(index);
    temporarilyPauseAutoplay();
  };

  if (featuredSeries.length === 0) return null;

  const current = featuredSeries[currentIndex];
  const status = statusConfig[current.status] || statusConfig.ongoing;

  return (
    <div
      className="rounded-xl shadow-md border border-border overflow-hidden bg-card"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onFocus={() => setIsAutoPlaying(false)}
      onBlur={() => setIsAutoPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyNavigation}
      tabIndex={0}
      aria-label="Featured series carousel"
    >
      {/* Main clickable card */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent" />

      <Link
        to={`/series/${current.id}`}
        className={`relative flex flex-row items-stretch transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
      >
        {/* Cover image - left side */}
        <div className="w-28 sm:w-36 md:w-44 shrink-0 relative overflow-hidden">
          <img
            src={current.cover_url || current.banner_url || ""}
            alt={current.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/70" />
        </div>

        {/* Text content - right side */}
        <div className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col justify-center gap-2 min-w-0 bg-gradient-to-br from-card to-card/80">
          {/* Type + Status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {current.type && (
              <Badge
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border-0 shadow-sm ${
                  current.type === "manga"
                    ? "bg-rose-500 text-white"
                    : current.type === "manhua"
                    ? "bg-amber-500 text-white"
                    : "bg-sky-500 text-white"
                }`}
              >
                {current.type}
              </Badge>
            )}
            <Badge className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${status.color} text-white border-0 shadow-sm`}>
              {status.label}
            </Badge>
          </div>

          {/* Title */}
          <h2 className="font-display text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight line-clamp-2 tracking-tight">
            {current.title}
          </h2>

          {/* Genres */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {current.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.id}
                  className="text-[10px] font-medium text-muted-foreground bg-muted/80 rounded-full px-2 py-0.5 border border-border/60"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {current.description && (
            <p className="text-muted-foreground/90 text-xs leading-relaxed line-clamp-2 hidden sm:block">
              {current.description}
            </p>
          )}

          {/* Chapters count */}
          {current.chaptersCount !== undefined && current.chaptersCount > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 w-fit">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">{current.chaptersCount} Chapters</span>
            </div>
          )}
        </div>
      </Link>

      {/* Dots navigation */}
      {featuredSeries.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 border-t border-border/50">
          <button onClick={(e) => { e.preventDefault(); handlePrev(); temporarilyPauseAutoplay(); }} className="p-1 rounded-full hover:bg-accent text-muted-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1">
            {featuredSeries.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button onClick={(e) => { e.preventDefault(); handleNext(); temporarilyPauseAutoplay(); }} className="p-1 rounded-full hover:bg-accent text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
