import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist, type WatchlistAddInput } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  item: WatchlistAddInput;
  className?: string;
}

export function WatchlistButton({ item, className }: Props) {
  const { user } = useAuth();
  const { isInList, toggle } = useWatchlist();
  const navigate = useNavigate();
  const inList = isInList(item.content_id, item.content_type);

  const handleClick = () => {
    if (!user) {
      toast.error('Faça login para salvar na sua lista');
      navigate('/login');
      return;
    }
    toggle(item);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        `inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border transition-all ${
          inList
            ? 'bg-primary/15 text-primary border-primary/40 hover:bg-primary/20'
            : 'bg-foreground/10 text-foreground border-foreground/15 hover:bg-foreground/15'
        }`
      }
    >
      {inList ? <BookmarkCheck className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
      {inList ? 'Na lista' : 'Listar'}
    </button>
  );
}
