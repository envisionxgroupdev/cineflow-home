import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const DMCA = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Política DMCA — PipocaMax</title>
      <meta name="description" content="Política DMCA do PipocaMax. Saiba como reportar violações de direitos autorais e solicitar a remoção de conteúdo." />
      <link rel="canonical" href="https://pipocamax.sbs/dmca" />
      <meta property="og:title" content="Política DMCA — PipocaMax" />
      <meta property="og:description" content="Como reportar violações de direitos autorais no PipocaMax." />
      <meta property="og:url" content="https://pipocamax.sbs/dmca" />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content="Política DMCA — PipocaMax" />
      <meta name="twitter:description" content="Como reportar violações de direitos autorais no PipocaMax." />
    </Helmet>
    <Navbar />
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Política DMCA</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>O PipocaMax respeita os direitos de propriedade intelectual de terceiros e espera que seus usuários façam o mesmo.</p>
        
        <h2 className="text-xl font-semibold text-foreground">Notificação de Violação</h2>
        <p>Se você acredita que seu trabalho protegido por direitos autorais foi copiado de uma maneira que constitui violação de direitos autorais, forneça as seguintes informações:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Uma assinatura eletrônica ou física da pessoa autorizada a agir em nome do proprietário dos direitos autorais.</li>
          <li>Uma descrição do trabalho protegido por direitos autorais que você alega ter sido violado.</li>
          <li>Uma descrição de onde o material que você alega estar infringindo está localizado no site.</li>
          <li>Seu endereço, número de telefone e endereço de e-mail.</li>
          <li>Uma declaração de que você acredita de boa-fé que o uso contestado não é autorizado pelo proprietário dos direitos autorais, seu agente ou pela lei.</li>
          <li>Uma declaração, feita sob pena de perjúrio, de que as informações em sua notificação são precisas e que você é o proprietário dos direitos autorais ou está autorizado a agir em nome do proprietário.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">Contra-notificação</h2>
        <p>Se você acredita que seu conteúdo foi removido por engano, pode enviar uma contra-notificação contendo as informações necessárias conforme descrito na legislação DMCA.</p>

        <h2 className="text-xl font-semibold text-foreground">Contato</h2>
        <p>Para enviar uma notificação DMCA, entre em contato conosco através do e-mail: <span className="text-primary">pipocamax@proton.me</span></p>
      </div>
    </div>
    <Footer />
  </div>
);

export default DMCA;
