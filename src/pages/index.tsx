import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useSeriesWithLatestChapters, useFeaturedSeries } from "@/hooks/useSeriesWithLatestChapters";
import { FeaturedHero } from "@/components/home/FeaturedHero";
import { LatestUpdateCard } from "@/components/home/LatestUpdateCard";
import { PopularSidebar } from "@/components/home/PopularSidebar";
import { NativeAd } from "@/components/ads/NativeAd";
import { BannerAd } from "@/components/ads/BannerAd";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, MessageCircle, Send } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: featuredData, isLoading: isFeaturedLoading } = useFeaturedSeries();
  const { data: latestSeriesData, isLoading: isLatestLoading } = useSeriesWithLatestChapters(12);
  const featuredSeries = featuredData || [];
  const latestSeries = latestSeriesData || [];

  useEffect(() => {
    const accessCode = searchParams.get("access");
    if (accessCode === "bntoonadmin") {
      navigate("/admin");
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (document.getElementById("adsterra-pop")) return;
    const script = document.createElement("script");
    script.id = "adsterra-pop";
    script.src =
      "https://pl28562281.effectivegatecpm.com/c1/b5/46/c1b546b49059ac9e88a2480f34e6bc7a.js";
    document.body.appendChild(script);
  }, []);

  const FeaturedSection = () => (
    <>
      {isFeaturedLoading ? (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex gap-5">
            <Skeleton className="w-36 aspect-[3/4] rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ) : featuredSeries.length > 0 ? (
        <FeaturedHero series={featuredSeries} />
      ) : null}
    </>
  );

  const LatestUpdatesSection = () => (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="font-display text-xl font-bold text-foreground">Latest Updates</h2>
        </div>
        <Link
          to="/browse"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group"
        >
          VIEW ALL
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {isLatestLoading ? (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <Skeleton className="w-[80px] aspect-[3/4] rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : latestSeries.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 divide-border">
            {latestSeries.map((s, index) => (
              <div
                key={s.id}
                className={`border-border ${
                  index < latestSeries.length - 2 ? "md:border-b" : ""
                } ${index % 2 === 0 ? "md:border-r" : ""} ${
                  index !== latestSeries.length - 1 ? "border-b md:border-b-0" : ""
                } ${Math.floor(index / 2) < Math.floor((latestSeries.length - 1) / 2) ? "md:border-b" : ""}`}
              >
                <LatestUpdateCard
                  id={s.id}
                  title={s.title}
                  coverUrl={s.cover_url}
                  status={s.status}
                  type={s.type}
                  chapters={s.chapters}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Welcome to BnToon!</h3>
            <p className="text-muted-foreground text-sm">
              Your comic library is ready. Add series via the admin panel to get started.
            </p>
          </div>
        </div>
      )}
    </section>
  );

  const JoinUsSection = () => (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="font-display text-xl font-bold text-foreground">Join Us</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Be part of our community! Get updates, discuss chapters, and connect with fellow readers.
      </p>
      <div className="space-y-2">
        <a
          href="https://t.me/bntoon"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(200,80%,50%)]/10 hover:bg-[hsl(200,80%,50%)]/20 border border-[hsl(200,80%,50%)]/20 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-[hsl(200,80%,50%)] flex items-center justify-center shrink-0">
            <Send className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Telegram</p>
            <p className="text-xs text-muted-foreground">@bntoon</p>
          </div>
        </a>
        <a
          href="https://discord.gg/bntoon"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(235,86%,65%)]/10 hover:bg-[hsl(235,86%,65%)]/20 border border-[hsl(235,86%,65%)]/20 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-[hsl(235,86%,65%)] flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Discord</p>
            <p className="text-xs text-muted-foreground">BnToon Community</p>
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pt-8 pb-8">
          {/* Desktop: 3-col grid | Mobile: stacked in specific order */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-3 space-y-6">
              <FeaturedSection />
              <BannerAd className="my-0" />
              <LatestUpdatesSection />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-5">
                <PopularSidebar />
              </div>
              <JoinUsSection />
              <NativeAd />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
