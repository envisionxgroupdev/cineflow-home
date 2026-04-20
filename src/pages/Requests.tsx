import { useRef, useState } from "react";
import { checkAntiSpam, markSubmitted, honeypotInputProps } from "@/lib/antiSpam";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Film, Tv, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    toast.success("Pedido enviado! Obrigado 🎬");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pedidos de Filmes e Séries | PipocaMax</title>
        <meta name="description" content="Não encontrou o filme ou série que queria? Faça um pedido para o PipocaMax e adicionamos para você." />
        <link rel="canonical" href="https://pipocamax.com/pedidos" />
      </Helmet>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Início</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Pedidos</span>
          </nav>

          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3">
            FAÇA SEU <span className="text-gradient-cinema">PEDIDO</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Não achou um filme ou série? Envie seu pedido e nossa equipe avaliará para adicionar ao catálogo.
          </p>

          {done ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle2 className="h-14 w-14 mx-auto mb-4 text-primary" />
              <h2 className="font-display text-2xl text-foreground mb-2">PEDIDO RECEBIDO!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Recebemos seu pedido e ele foi enviado ao painel do administrador.
              </p>
              <button onClick={() => setDone(false)}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                Fazer outro pedido
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setType("movie")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border transition-colors ${
                      type === "movie" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"
                    }`}>
                    <Film className="h-4 w-4" /> Filme
                  </button>
                  <button type="button" onClick={() => setType("series")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border transition-colors ${
                      type === "series" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"
                    }`}>
                    <Tv className="h-4 w-4" /> Série
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Título *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required
                  placeholder="Ex.: Interestelar" 
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Ano (opcional)</label>
                <input value={year} onChange={e => setYear(e.target.value)} maxLength={10}
                  placeholder="Ex.: 2014"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Observações (opcional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={3}
                  placeholder="Diretor, temporada específica, dublagem, etc."
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Seu nome (opcional)</label>
                  <input value={name} onChange={e => setName(e.target.value)} maxLength={100}
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">E-mail (opcional)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={255}
                    placeholder="para retorno"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
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
