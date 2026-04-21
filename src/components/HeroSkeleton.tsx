export function HeroSkeleton() {
  return (
    <section className="relative h-[70vh] min-h-[420px] md:h-[80vh] flex items-end overflow-hidden bg-background">
      {/* Animated shimmer backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-secondary/20 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      <div className="relative container mx-auto px-4 pb-10 md:pb-16 z-10">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-primary/20 rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 md:h-14 w-3/4 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 md:h-14 w-1/2 bg-muted rounded-lg animate-pulse" />
          <div className="flex gap-3">
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-primary/30 rounded-lg animate-pulse mt-6" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
}

export function ContentSectionSkeleton({ title }: { title: string }) {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl md:text-4xl text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] bg-secondary/60 rounded-lg animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReleasesSkeleton() {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="h-8 w-48 bg-muted rounded mb-6 animate-pulse" />
        <div className="flex gap-3 md:gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px] aspect-[2/3] bg-secondary/60 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
