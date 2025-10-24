import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChatRoom } from './ChatRoom';
import { ModeratorPanel } from './ModeratorPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, MessageSquare, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Room {
  id: string;
  name: string;
}

export const ChatInterface = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showModeration, setShowModeration] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    loadRooms();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
    }
  };

  const loadRooms = async () => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('name');

    if (data) {
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoom(data[0]);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged out successfully' });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">ChatSecure</h1>
          </div>
          <Button
            variant={showModeration ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowModeration(!showModeration)}
            className="w-full"
          >
            <Shield className="w-4 h-4 mr-2" />
            {showModeration ? 'Hide' : 'Show'} Moderation
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Chat Rooms
            </h3>
            {rooms.map((room) => (
              <Button
                key={room.id}
                variant={selectedRoom?.id === room.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedRoom(room)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {room.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {selectedRoom && (
          <div className={showModeration ? 'w-2/3' : 'w-full'}>
            <ChatRoom
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              userId={userId}
            />
          </div>
        )}
        
        {showModeration && (
          <div className="w-1/3 border-l p-4">
            <ModeratorPanel />
          </div>
        )}
      </div>
    </div>
  );
};