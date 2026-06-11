ALTER TABLE public.movies
  ADD CONSTRAINT movies_tmdb_id_key UNIQUE (tmdb_id);

ALTER TABLE public.series
  ADD CONSTRAINT series_tmdb_id_key UNIQUE (tmdb_id);