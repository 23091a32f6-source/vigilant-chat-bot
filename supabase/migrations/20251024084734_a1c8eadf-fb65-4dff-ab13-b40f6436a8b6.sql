-- Add foreign key relationship between messages and profiles
ALTER TABLE public.messages
ADD CONSTRAINT messages_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);