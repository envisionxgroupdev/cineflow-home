import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Send, CheckCircle2, Loader2, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { checkAntiSpam, markSubmitted, honeypotInputProps } from "@/lib/antiSpam";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  telegram: z.string().trim().min(2, "Informe seu Telegram").max(64)
    .regex(/^@?[A-Za-z0-9_]{2,}$/, "Use seu @username do Telegram"),
  email: z.string().trim().email("E-mail inválido").max(255),
  subject: z.string().trim().min(3, "Assunto muito curto").max(150),
  message: z.string().trim().min(10, "Mensagem muito curta").max(2000),
});

const CONTACT_EMAIL = "pipocamax@proton.me";
const CONTACT_TELEGRAM = "https://t.me/+ABLySKDmGy4zNDcx";

const Contact = () => {
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hp, setHp] = useState("");
  const openedAtRef = useRef<number>(Date.now());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guard = checkAntiSpam({ formKey: "contact", honeypotValue: hp, openedAt: openedAtRef.current });
    if (!guard.ok) { toast.error(guard.reason); return; }
    const parsed = schema.safeParse({ name, telegram, email, subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const tg = parsed.data.telegram.startsWith("@") ? parsed.data.telegram : `@${parsed.data.telegram}`;
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      telegram: tg,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) { toast.error("Erro ao enviar: " + error.message); return; }
    markSubmitted("contact");
    toast.success("Mensagem enviada!");
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Contato - PipocaMax</title>
        <meta name="description" content="Entre em contato com a PipocaMax. Envie sua mensagem informando seu Telegram para resposta." />
        <link rel="canonical" href="https://pipocamax.com/contato" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3">
              FALE <span className="text-gradient-cinema">CONOSCO</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Dúvidas, sugestões ou parcerias? Envie sua mensagem.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                <Mail className="h-3.5 w-3.5" /> {CONTACT_EMAIL}
              </a>
              <a href={CONTACT_TELEGRAM} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] text-xs font-semibold hover:bg-[#0088cc]/20 transition-colors">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Canal no Telegram
              </a>
            </div>
          </div>

          {done ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle2 className="h-14 w-14 mx-auto text-primary mb-4" />
              <h2 className="font-display text-2xl text-foreground mb-2">MENSAGEM ENVIADA!</h2>
              <p className="text-muted-foreground mb-6">Recebemos sua mensagem e entraremos em contato em breve.</p>
              <button onClick={() => { setDone(false); setName(""); setTelegram(""); setEmail(""); setSubject(""); setMessage(""); }}
                className="text-sm text-primary hover:underline">Enviar outra mensagem</button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-4">
              <input {...honeypotInputProps} value={hp} onChange={e => setHp(e.target.value)} name="website" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Seu nome *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={100}
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Telegram *</label>
                  <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} required maxLength={64} placeholder="@seuusuario"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">E-mail *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={255}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Assunto *</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required maxLength={150}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mensagem *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required maxLength={2000} rows={6}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
