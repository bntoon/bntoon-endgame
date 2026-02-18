import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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
  ongoing: { color: "text-emerald-300", label: "Ongoing" },
  completed: { color: "text-blue-300", label: "Completed" },
  hiatus: { color: "text-amber-300", label: "Hiatus" },
  cancelled: { color: "text-red-300", label: "Cancelled" },
  dropped: { color: "text-gray-300", label: "Dropped" },
};

export function FeaturedHero({ series }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  const featuredSeries = series.slice(0, 5);

  const scheduleAutoplayResume = () => {
    setIsAutoPlaying(false);

    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsAutoPlaying(true);
    }, 8000);
  };

  useEffect(() => {
    if (!isAutoPlaying || featuredSeries.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSeries.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [isAutoPlaying, featuredSeries.length]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  const handleTransition = (newIndex: number) => {
    setIsTransitioning(true);
    window.setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 160);
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + featuredSeries.length) % featuredSeries.length;
    handleTransition(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % featuredSeries.length;
    handleTransition(newIndex);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    handleTransition(index);
    scheduleAutoplayResume();
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

    scheduleAutoplayResume();
  };

  const handleKeyNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handlePrev();
      scheduleAutoplayResume();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleNext();
      scheduleAutoplayResume();
    }
  };

  if (featuredSeries.length === 0) return null;

  const current = featuredSeries[currentIndex];
  const status = statusConfig[current.status] || statusConfig.ongoing;

  return (
    <section
      className="overflow-hidden rounded-xl border border-white/10 bg-[#110b12] shadow-[0_0_40px_rgba(31,9,32,0.45)]"
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
      <div className="relative border-b border-white/10 bg-gradient-to-r from-[#190810] via-[#16070f] to-[#0f0f18] px-4 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,38,96,0.2),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_95%_10%,rgba(67,56,202,0.2),transparent_45%)]" />

        <Link
          to={`/series/${current.id}`}
          className={`relative grid grid-cols-[96px_1fr] items-center gap-4 sm:grid-cols-[128px_1fr] sm:gap-6 transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-md ring-1 ring-white/20">
            <img
              src={current.cover_url || current.banner_url || ""}
              alt={current.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          <div className="min-w-0 space-y-2 text-white">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-300 ring-1 ring-yellow-300/30">
                <Star className="h-4 w-4 fill-current" />
              </div>
              <span className="text-sm font-semibold text-yellow-300">9.3</span>
            </div>

            <h2 className="font-display text-lg font-bold uppercase leading-tight tracking-wide sm:text-2xl">
              {current.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {current.type && (
                <Badge className="border-0 bg-yellow-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-yellow-300">
                  {current.type}
                </Badge>
              )}
              <span className={`text-sm font-semibold ${status.color}`}>Status: {status.label}</span>
            </div>

            {current.genres && current.genres.length > 0 && (
              <p className="line-clamp-1 text-sm text-white/80">{current.genres.slice(0, 4).map((genre) => genre.name).join(", ")}</p>
            )}

            {current.description && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Summary</p>
                <p className="line-clamp-2 text-sm text-white/85">{current.description}</p>
              </div>
            )}

            {current.chaptersCount !== undefined && current.chaptersCount > 0 && (
              <p className="text-sm text-white/70">Chapters: {current.chaptersCount}</p>
            )}
          </div>
        </Link>
      </div>

      {featuredSeries.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#11131a]">
          <button
            onClick={(event) => {
              event.preventDefault();
              handlePrev();
              scheduleAutoplayResume();
            }}
            className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Previous featured series"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {featuredSeries.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-4 bg-yellow-400" : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}

          <button
            onClick={(event) => {
              event.preventDefault();
              handleNext();
              scheduleAutoplayResume();
            }}
            className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Next featured series"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
