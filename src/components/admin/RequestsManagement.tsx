import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Film, Tv, Check, X, Trash2, Mail, User, Calendar } from "lucide-react";
import type { ContentRequest } from "@/types/database";

type Filter = "all" | "pending" | "fulfilled" | "rejected";

export function RequestsManagement() {
  const [items, setItems] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("requests").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar: " + error.message);
    else setItems((data || []) as ContentRequest[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: ContentRequest["status"]) => {
    const { error } = await supabase.from("requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Atualizado");
    setItems(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído");
    setItems(prev => prev.filter(r => r.id !== id));
  };

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const pendingCount = items.filter(i => i.status === "pending").length;

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pendentes" },
    { key: "fulfilled", label: "Atendidos" },
    { key: "rejected", label: "Recusados" },
    { key: "all", label: "Todos" },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {f.label}
            {f.key === "pending" && pendingCount > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"}`}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                      r.type === "movie" ? "bg-primary/10 text-primary" : "bg-accent/20 text-accent-foreground"
                    }`}>
                      {r.type === "movie" ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                      {r.type === "movie" ? "Filme" : "Série"}
                    </span>
                    {r.year && <span className="text-xs text-muted-foreground">{r.year}</span>}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      r.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                      r.status === "fulfilled" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                    }`}>
                      {r.status === "pending" ? "Pendente" : r.status === "fulfilled" ? "Atendido" : "Recusado"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{r.title}</h3>
                  {r.notes && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.notes}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {r.requester_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.requester_name}</span>}
                    {r.requester_email && (
                      <a href={`mailto:${r.requester_email}`} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3 w-3" />{r.requester_email}
                      </a>
                    )}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(r.id, "fulfilled")} title="Marcar como atendido"
                        className="p-2 text-muted-foreground hover:text-green-500 transition-colors">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => updateStatus(r.id, "rejected")} title="Recusar"
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => remove(r.id)} title="Excluir"
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
