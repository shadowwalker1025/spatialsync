import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Users,
  Smile,
  CheckCheck,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useSceneStore } from '../../store/useSceneStore';
import { getSocket } from '../../services/socket';

export function ChatDrawer() {
  const isChatOpen = useUIStore((s) => s.isChatOpen);
  const setChatOpen = useUIStore((s) => s.setChatOpen);

  const currentUser = useCollaborationStore((s) => s.currentUser);
  const users = useCollaborationStore((s) => s.users);
  const chatMessages = useCollaborationStore((s) => s.chatMessages);
  const scene = useSceneStore((s) => s.scene);

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !scene) return;

    const socket = getSocket();
    socket.emit('chat:send', {
      sceneId: scene.id,
      text: inputText.trim(),
    });

    setInputText('');
  };

  if (!isChatOpen) return null;

  return (
    <div className="absolute top-16 right-3 bottom-24 z-30 w-80 glass-panel-elevated rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-xs text-white uppercase tracking-wider font-['Outfit']">
            Spatial Chat & Activity
          </span>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Online Users Pill List */}
      <div className="px-3.5 py-2 bg-dark-800/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto">
        <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          {users.map((u) => (
            <span
              key={u.id}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap flex items-center gap-1 shadow"
              style={{ backgroundColor: u.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {u.name.split(' ')[0]} {u.id === currentUser.id && '(You)'}
            </span>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {chatMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isSystem = msg.type === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="px-2.5 py-1 rounded-full bg-dark-700/60 border border-white/5 text-[10px] text-slate-400">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                <span className="font-semibold" style={{ color: msg.senderColor }}>
                  {msg.senderName}
                </span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  isMe
                    ? 'bg-brand-600 text-white rounded-tr-xs shadow-lg shadow-brand-600/20'
                    : 'bg-dark-700/80 text-slate-100 rounded-tl-xs border border-white/10'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-dark-800/80 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message to room..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-2 glass-input rounded-xl text-xs placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-lg transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
