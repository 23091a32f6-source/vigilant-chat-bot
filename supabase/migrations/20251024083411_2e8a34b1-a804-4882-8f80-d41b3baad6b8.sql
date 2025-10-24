-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  toxicity_score FLOAT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flagged messages table
CREATE TABLE public.flagged_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table for user display names
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms (everyone can view)
CREATE POLICY "Anyone can view chat rooms"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for flagged_messages
CREATE POLICY "Anyone can view flagged messages"
  ON public.flagged_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can flag messages"
  ON public.flagged_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_flagged_messages_message_id ON public.flagged_messages(message_id);
CREATE INDEX idx_messages_is_flagged ON public.messages(is_flagged);

-- Insert some default chat rooms
INSERT INTO public.chat_rooms (name) VALUES 
  ('General'),
  ('Gaming'),
  ('Technology'),
  ('Random');

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flagged_messages;