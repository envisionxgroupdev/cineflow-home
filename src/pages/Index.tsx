import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { Footer } from "@/components/Footer";
import { mockMovies, mockSeries, mockReleases } from "@/data/mockContent";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <div className="cinema-gradient">
        <ContentSection id="lancamentos" title="LANÇAMENTOS" items={mockReleases} />
        <ContentSection id="filmes" title="FILMES" items={mockMovies} />
        <ContentSection id="series" title="SÉRIES" items={mockSeries} />
      </div>

      <Footer />
    </div>
  );
};

export default Index;
