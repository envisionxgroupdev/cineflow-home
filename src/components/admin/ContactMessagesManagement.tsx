import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, Mail, MessageSquare, ExternalLink, CheckCircle2 } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  telegram: string;
  email: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
}

export const ContactMessagesManagement = () => {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "replied">("new");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar: " + error.message);
    else setItems((data || []) as ContactMessage[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: ContactMessage["status"]) => {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems(items.map(i => i.id === id ? { ...i, status } : i));
    toast.success("Atualizado");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems(items.filter(i => i.id !== id));
    toast.success("Removido");
  };

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  const counts = {
    all: items.length,
    new: items.filter(i => i.status === "new").length,
    read: items.filter(i => i.status === "read").length,
    replied: items.filter(i => i.status === "replied").length,
  };

  const labels = { new: "Novas", read: "Lidas", replied: "Respondidas", all: "Todas" } as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["new", "read", "replied", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {labels[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
          Nenhuma mensagem encontrada.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground truncate">{m.subject}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      m.status === "new" ? "bg-primary/15 text-primary" :
                      m.status === "read" ? "bg-yellow-500/15 text-yellow-500" :
                      "bg-green-500/15 text-green-500"
                    }`}>{labels[m.status]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">{m.name}</span> ·{" "}
                    <a href={`https://t.me/${m.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="text-[#0088cc] hover:underline inline-flex items-center gap-1">
                      {m.telegram} <ExternalLink className="h-3 w-3" />
                    </a>
                    {m.email && <> · <a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a></>}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-sm text-foreground/90 bg-secondary/50 rounded p-3 whitespace-pre-wrap mb-3">{m.message}</p>
              <div className="flex gap-2 flex-wrap">
                {m.status !== "read" && (
                  <button onClick={() => updateStatus(m.id, "read")}
                    className="text-xs px-3 py-1.5 rounded bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 transition-colors flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Marcar lida
                  </button>
                )}
                {m.status !== "replied" && (
                  <button onClick={() => updateStatus(m.id, "replied")}
                    className="text-xs px-3 py-1.5 rounded bg-green-500/15 text-green-500 hover:bg-green-500/25 transition-colors flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Respondida
                  </button>
                )}
                <a href={`https://t.me/${m.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded bg-[#0088cc]/15 text-[#0088cc] hover:bg-[#0088cc]/25 transition-colors flex items-center gap-1 ml-auto">
                  <ExternalLink className="h-3 w-3" /> Abrir Telegram
                </a>
                <button onClick={() => remove(m.id)}
                  className="text-xs px-3 py-1.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
