import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './ChatMessage';
import { detectToxicity } from '@/utils/toxicityDetector';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  user_id: string;
  toxicity_score: number;
  is_flagged: boolean;
  created_at: string;
  profiles?: {
    username: string;
  } | null;
}

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  userId: string;
}

export const ChatRoom = ({ roomId, roomName, userId }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (username)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading messages',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMessages((data as any) || []);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...payload.new, profiles: profile } as Message,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      // Detect toxicity
      const { score, isToxic, severity } = await detectToxicity(newMessage);
      
      // Block high toxicity messages
      if (score > 0.9) {
        toast({
          title: 'Message blocked',
          description: 'This message contains highly toxic content and cannot be sent.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Insert message
      const { error: messageError } = await supabase.from('messages').insert([
        {
          room_id: roomId,
          user_id: userId,
          content: newMessage,
          toxicity_score: score,
          is_flagged: isToxic,
        },
      ]);

      if (messageError) throw messageError;

      // If flagged, add to flagged_messages
      if (isToxic) {
        const { data: messageData } = await supabase
          .from('messages')
          .select('id')
          .eq('user_id', userId)
          .eq('content', newMessage)
          .single();

        if (messageData) {
          await supabase.from('flagged_messages').insert([
            {
              message_id: messageData.id,
              severity,
            },
          ]);
        }

        toast({
          title: 'Message flagged',
          description: `Your message was flagged for ${severity} toxicity.`,
          variant: 'default',
        });
      }

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card px-6 py-4">
        <h2 className="text-xl font-bold text-card-foreground">{roomName}</h2>
        <p className="text-sm text-muted-foreground">
          {messages.length} messages
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              username={message.profiles?.username || 'Anonymous'}
              isOwn={message.user_id === userId}
              toxicityScore={message.toxicity_score}
              isFlagged={message.is_flagged}
              createdAt={message.created_at}
            />
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};