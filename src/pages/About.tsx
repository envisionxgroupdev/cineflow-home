import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Film } from "lucide-react";

const About = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Sobre — Cineflow</title>
      <meta name="description" content="Conheça o Cineflow, sua plataforma de filmes e séries online." />
    </Helmet>
    <Navbar />
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Film className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground">
          Sobre o CINE<span className="text-gradient-cinema">FLOW</span>
        </h1>
      </div>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>O Cineflow é uma plataforma dedicada a oferecer a melhor experiência para os amantes de cinema e séries de TV. Nossa missão é conectar pessoas ao entretenimento de qualidade.</p>

        <h2 className="text-xl font-semibold text-foreground">Nossa Missão</h2>
        <p>Facilitar o acesso ao melhor conteúdo audiovisual, oferecendo uma plataforma intuitiva, rápida e organizada para que você encontre exatamente o que procura.</p>

        <h2 className="text-xl font-semibold text-foreground">O que Oferecemos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Catálogo extenso de filmes e séries atualizados diariamente.</li>
          <li>Informações detalhadas com sinopse, elenco e avaliações.</li>
          <li>Sistema de busca inteligente para encontrar rapidamente o que você quer assistir.</li>
          <li>Interface moderna e responsiva, otimizada para todos os dispositivos.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">Aviso Legal</h2>
        <p>O Cineflow não hospeda nenhum conteúdo em seus servidores. Todo o conteúdo disponível é fornecido por serviços de terceiros. Somos apenas um agregador de links disponíveis publicamente na internet.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default About;
