-- Extra image slots for the 3 "ideal" trades of the session
ALTER TABLE public.daily_recaps
  ADD COLUMN image_url_trade1 text,
  ADD COLUMN image_url_trade2 text,
  ADD COLUMN image_url_trade3 text;
