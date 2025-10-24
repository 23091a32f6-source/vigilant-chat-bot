import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  username: string;
  isOwn: boolean;
  toxicityScore: number;
  isFlagged: boolean;
  createdAt: string;
}

export const ChatMessage = ({
  content,
  username,
  isOwn,
  toxicityScore,
  isFlagged,
  createdAt,
}: ChatMessageProps) => {
  const getSeverityColor = () => {
    if (toxicityScore > 0.8) return 'border-destructive';
    if (toxicityScore > 0.5) return 'border-warning';
    return 'border-transparent';
  };

  const getSeverityIcon = () => {
    if (toxicityScore > 0.8) return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (toxicityScore > 0.5) return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <CheckCircle className="w-4 h-4 text-success" />;
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-1 animate-fade-in',
        isOwn ? 'items-end' : 'items-start'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{username}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleTimeString()}
        </span>
      </div>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 border-2 transition-all',
          isOwn ? 'bg-chat-bubble-own text-primary-foreground' : 'bg-chat-bubble text-foreground',
          isFlagged && 'bg-chat-bubble-flagged',
          getSeverityColor()
        )}
      >
        <div className="flex items-start gap-2">
          <p className="text-sm break-words">{content}</p>
          {toxicityScore > 0 && (
            <div className="flex-shrink-0 mt-0.5">
              {getSeverityIcon()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};