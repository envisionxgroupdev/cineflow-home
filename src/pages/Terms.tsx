import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Termos de Uso — PipocaMax</title>
      <meta name="description" content="Termos de uso do PipocaMax: leia as condições e responsabilidades para utilização do site, conteúdo e serviços oferecidos." />
      <link rel="canonical" href="https://pipocamax.cc/termos" />
      <meta property="og:title" content="Termos de Uso — PipocaMax" />
      <meta property="og:description" content="Condições e responsabilidades para utilização do PipocaMax." />
      <meta property="og:url" content="https://pipocamax.cc/termos" />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content="Termos de Uso — PipocaMax" />
      <meta name="twitter:description" content="Condições para utilização do PipocaMax." />
    </Helmet>
    <Navbar />
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Termos de Uso</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>Ao acessar e usar o PipocaMax, você concorda com os seguintes termos e condições.</p>

        <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>Ao utilizar nosso site, você confirma que leu, entendeu e concorda em ficar vinculado a estes Termos de Uso. Se você não concordar com algum destes termos, não utilize o site.</p>

        <h2 className="text-xl font-semibold text-foreground">2. Uso do Serviço</h2>
        <p>Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. Você não deve usar o serviço de qualquer maneira que possa danificar, desativar ou prejudicar o site.</p>

        <h2 className="text-xl font-semibold text-foreground">3. Conteúdo</h2>
        <p>O PipocaMax atua como um agregador de conteúdo e não hospeda nenhum arquivo de mídia em seus servidores. Todo o conteúdo é fornecido por terceiros e está disponível publicamente na internet.</p>

        <h2 className="text-xl font-semibold text-foreground">4. Contas de Usuário</h2>
        <p>Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em aceitar a responsabilidade por todas as atividades que ocorram em sua conta.</p>

        <h2 className="text-xl font-semibold text-foreground">5. Limitação de Responsabilidade</h2>
        <p>O PipocaMax não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou da incapacidade de usar o serviço.</p>

        <h2 className="text-xl font-semibold text-foreground">6. Modificações</h2>
        <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação no site.</p>

        <h2 className="text-xl font-semibold text-foreground">7. Contato</h2>
        <p>Para dúvidas sobre estes termos, entre em contato: <span className="text-primary">pipocamax@proton.me</span></p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
