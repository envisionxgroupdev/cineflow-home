import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Política de Privacidade — PipocaMax</title>
      <meta name="description" content="Política de privacidade do PipocaMax. Saiba como tratamos seus dados pessoais." />
    </Helmet>
    <Navbar />
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Política de Privacidade</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>Esta política descreve como o PipocaMax coleta, usa e protege suas informações pessoais.</p>

        <h2 className="text-xl font-semibold text-foreground">1. Informações Coletadas</h2>
        <p>Coletamos informações que você nos fornece diretamente, como nome e e-mail ao criar uma conta. Também coletamos dados de navegação automaticamente, incluindo endereço IP, tipo de navegador e páginas visitadas.</p>

        <h2 className="text-xl font-semibold text-foreground">2. Uso das Informações</h2>
        <p>Usamos suas informações para fornecer e melhorar nossos serviços, personalizar sua experiência, enviar comunicações relevantes e garantir a segurança da plataforma.</p>

        <h2 className="text-xl font-semibold text-foreground">3. Cookies</h2>
        <p>Utilizamos cookies e tecnologias semelhantes para melhorar a experiência do usuário, analisar o tráfego do site e personalizar conteúdo.</p>

        <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
        <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para fornecer o serviço ou quando exigido por lei.</p>

        <h2 className="text-xl font-semibold text-foreground">5. Segurança</h2>
        <p>Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.</p>

        <h2 className="text-xl font-semibold text-foreground">6. Seus Direitos</h2>
        <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco.</p>

        <h2 className="text-xl font-semibold text-foreground">7. Contato</h2>
        <p>Para questões sobre privacidade: <span className="text-primary">privacidade@pipocamax.com</span></p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Privacy;
