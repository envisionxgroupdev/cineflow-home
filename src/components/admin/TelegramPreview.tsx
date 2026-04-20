import { renderTemplate, buildContentLink } from "@/lib/telegramNotify";

interface Props {
  template: string;
  sendPhoto: boolean;
  buttonLabel: string;
  type: "movie" | "series";
}

const SAMPLE = {
  movie: { title: "Duna: Parte Dois", year: "2024", rating: 8.5, genre: "Ficção Científica", overview: "Paul Atreides se une aos Fremen para vingar sua família e impedir um futuro terrível que apenas ele consegue prever.", imageUrl: "https://image.tmdb.org/t/p/w500/eHEdZHxrNibrH2lODjmKvkUKwgL.jpg" },
  series: { title: "The Last of Us", year: "2023", rating: 8.7, genre: "Drama, Ação", overview: "20 anos após a civilização moderna ser destruída, Joel é contratado para tirar Ellie de uma zona de quarentena opressiva.", imageUrl: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg" },
};

export function TelegramPreview({ template, sendPhoto, buttonLabel, type }: Props) {
  const sample = SAMPLE[type];
  const link = buildContentLink(type, sample.title);
  const text = renderTemplate(template, { ...sample, type }, link);

  // Markdown muito básico para preview: *bold* e [link](url)
  const renderMd = (s: string) => {
    const parts: Array<string | JSX.Element> = [];
    let key = 0;
    const lines = s.split("\n");
    lines.forEach((line, li) => {
      let remaining = line;
      const lineParts: Array<string | JSX.Element> = [];
      const regex = /\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(remaining)) !== null) {
        if (m.index > lastIndex) lineParts.push(remaining.slice(lastIndex, m.index));
        if (m[1]) lineParts.push(<strong key={key++} className="font-semibold">{m[1]}</strong>);
        else if (m[2]) lineParts.push(<a key={key++} href={m[3]} target="_blank" rel="noreferrer" className="text-[#3390ec] hover:underline">{m[2]}</a>);
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < remaining.length) lineParts.push(remaining.slice(lastIndex));
      parts.push(<span key={key++}>{lineParts}</span>);
      if (li < lines.length - 1) parts.push(<br key={key++} />);
    });
    return parts;
  };

  return (
    <div className="bg-[#0e1621] rounded-xl p-4 border border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Pré-visualização (Telegram)</p>
      <div className="flex justify-end">
        <div className="max-w-sm w-full bg-[#182533] rounded-2xl rounded-tr-sm overflow-hidden shadow-lg">
          {sendPhoto && (
            <img src={sample.imageUrl} alt="" className="w-full aspect-video object-cover" />
          )}
          <div className="p-3 space-y-2">
            <p className="text-[13px] text-white whitespace-pre-wrap leading-snug">{renderMd(text)}</p>
            <a href={link} target="_blank" rel="noreferrer"
              className="block w-full text-center bg-[#2b5278] hover:bg-[#3a6a96] text-white text-sm font-medium py-2 rounded transition-colors">
              {buttonLabel || "▶️ Assistir Agora"}
            </a>
            <p className="text-[10px] text-white/40 text-right">22:14</p>
          </div>
        </div>
      </div>
    </div>
  );
}
