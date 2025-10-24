import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield } from 'lucide-react';

interface FlaggedMessage {
  id: string;
  severity: string;
  flagged_at: string;
  messages: {
    content: string;
    toxicity_score: number;
    created_at: string;
    profiles?: {
      username: string;
    } | null;
    chat_rooms?: {
      name: string;
    } | null;
  };
}

export const ModeratorPanel = () => {
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);

  useEffect(() => {
    loadFlaggedMessages();
    subscribeToFlaggedMessages();
  }, []);

  const loadFlaggedMessages = async () => {
    const { data } = await supabase
      .from('flagged_messages')
      .select(`
        *,
        messages (
          content,
          toxicity_score,
          created_at,
          profiles (username),
          chat_rooms (name)
        )
      `)
      .order('flagged_at', { ascending: false })
      .limit(50);

    setFlaggedMessages((data as any) || []);
  };

  const subscribeToFlaggedMessages = () => {
    const channel = supabase
      .channel('flagged-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'flagged_messages',
        },
        async (payload) => {
          const { data: message } = await supabase
            .from('flagged_messages')
            .select(`
              *,
              messages (
                content,
                toxicity_score,
                created_at,
                profiles (username),
                chat_rooms (name)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            setFlaggedMessages((prev) => [(message as any), ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Moderation Panel</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {flaggedMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No flagged messages
              </p>
            ) : (
              flaggedMessages.map((item) => (
                <Card key={item.id} className="border-2">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(item.severity)}>
                            {item.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.messages.profiles?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            in {item.messages.chat_rooms?.name || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm">{item.messages.content}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            Toxicity: {(item.messages.toxicity_score * 100).toFixed(1)}%
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(item.flagged_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};