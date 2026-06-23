import { useRef, useState } from "react";
import { checkAntiSpam, markSubmitted, honeypotInputProps } from "@/lib/antiSpam";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Film, Tv, Loader2, CheckCircle2, Sparkles, Clock, Heart, Lock, LogIn } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200),
  type: z.enum(["movie", "series"]),
  year: z.string().trim().max(10).optional(),
  notes: z.string().trim().max(500).optional(),
  requester_name: z.string().trim().max(100).optional(),
  requester_email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
});

const Requests = () => {
  const [type, setType] = useState<"movie" | "series">("movie");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hp, setHp] = useState("");
  const openedAtRef = useRef<number>(Date.now());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guard = checkAntiSpam({ formKey: "requests", honeypotValue: hp, openedAt: openedAtRef.current });
    if (!guard.ok) { toast.error(guard.reason || "Bloqueado."); return; }
    const parsed = schema.safeParse({ title, type, year, notes, requester_name: name, requester_email: email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("requests").insert({
      title: parsed.data.title,
      type: parsed.data.type,
      year: parsed.data.year || null,
      notes: parsed.data.notes || null,
      requester_name: parsed.data.requester_name || null,
      requester_email: parsed.data.requester_email || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar pedido: " + error.message);
      return;
    }
    setDone(true);
    setTitle(""); setYear(""); setNotes(""); setName(""); setEmail("");
    markSubmitted("requests");
    toast.success("Pedido enviado! Obrigado 🎬");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Pedidos de Filmes e Séries | PipocaMax</title>
        <meta name="description" content="Não encontrou o filme ou série que queria? Faça um pedido para o PipocaMax e adicionamos para você." />
        <link rel="canonical" href="https://pipocamax.sbs/pedidos" />
      </Helmet>
      <Navbar />

      {/* Hero do pedido */}
      <main className="flex-1 pt-24 pb-16 relative overflow-hidden">
        {/* Backdrop cinematográfico */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,hsl(var(--primary)/0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,hsl(var(--primary)/0.10),transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.025] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />
        </div>

        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Início</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Pedidos</span>
          </nav>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold uppercase tracking-wider mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Pedidos da comunidade
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-foreground leading-tight mb-4">
              FAÇA SEU <span className="text-gradient-cinema">PEDIDO</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Nosso catálogo cresce com você. Não achou um filme ou série? Diga o que quer assistir e adicionamos no PipocaMax.
            </p>
          </div>

          {/* How it works */}
          {!done && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Send, title: "Envie", desc: "Diga o título" },
                { icon: Clock, title: "Avaliamos", desc: "Verificamos a fonte" },
                { icon: Heart, title: "Adicionamos", desc: "Disponível em breve" },
              ].map(s => (
                <div key={s.title} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary mb-2">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {done ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center cinema-glow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 text-primary mb-5">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-2">PEDIDO RECEBIDO!</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Recebemos seu pedido e ele já está na fila do nosso painel. Em breve você poderá assistir no PipocaMax.
              </p>
              <button onClick={() => setDone(false)}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                <Send className="h-4 w-4" /> Fazer outro pedido
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl shadow-primary/5">
              <input {...honeypotInputProps} value={hp} onChange={e => setHp(e.target.value)} name="website" />

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setType("movie")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium border transition-all ${
                      type === "movie"
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                        : "border-border text-muted-foreground hover:bg-secondary hover:border-border/60"
                    }`}>
                    <Film className="h-4 w-4" /> Filme
                  </button>
                  <button type="button" onClick={() => setType("series")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium border transition-all ${
                      type === "series"
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                        : "border-border text-muted-foreground hover:bg-secondary hover:border-border/60"
                    }`}>
                    <Tv className="h-4 w-4" /> Série
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-[1fr,140px] gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Título *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required
                    placeholder="Ex.: Interestelar"
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Ano</label>
                  <input value={year} onChange={e => setYear(e.target.value)} maxLength={10}
                    placeholder="2014"
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Observações</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={3}
                  placeholder="Diretor, temporada específica, dublagem, etc."
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Seu nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} maxLength={100}
                    placeholder="Como te chamamos?"
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={255}
                    placeholder="para retorno"
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 hover:shadow-[0_0_28px_hsl(var(--primary)/0.45)]">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Enviando..." : "Enviar pedido"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Requests;
