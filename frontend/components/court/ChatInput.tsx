import { Send, FolderOpen, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import svgPaths from '../../imports/svg-to9nw6zppq';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  currentSpeaker?: string;
  evidenceCount?: number;
  onViewEvidence?: () => void;
  hasSubmittedEvidence?: boolean;
  onToggleSidePanel?: () => void;
  submittedEvidenceCount?: number;
  initialMessage?: string;
  onMessageChange?: (message: string) => void;
}

export function ChatInput({ onSend, disabled, currentSpeaker = "Plaintiff", evidenceCount = 0, onViewEvidence, hasSubmittedEvidence, onToggleSidePanel, submittedEvidenceCount = 0, initialMessage = '', onMessageChange }: ChatInputProps) {
  const [message, setMessage] = useState(initialMessage || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update message when initialMessage prop changes
  useEffect(() => {
    setMessage(initialMessage || '');
  }, [initialMessage]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';            // collapse first so shrinking works
    el.style.height = `${el.scrollHeight}px`; // expand to fit content
  }, [message]);

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    if (onMessageChange) {
      onMessageChange(newMessage);
    }
  };

  const handleSend = () => {
    if (message && message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] z-30">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-3 items-end">
          {/* Beautiful Upload Evidence Button */}
          <button
            onClick={onViewEvidence}
            className="relative group"
            title="Upload evidence"
            disabled={disabled}
          >
            {/* Main Button Container */}
            <div className={`
              relative flex items-center justify-center
              w-9 h-9 rounded-lg
              ${evidenceCount > 0 
                ? 'bg-gradient-to-br from-[#155dfc] to-[#0d4fd6]' 
                : 'bg-gradient-to-br from-[#1e293b] to-[#334155]'
              }
              shadow-sm hover:shadow-md
              transition-all duration-200
              hover:scale-105 active:scale-95
              border border-white/10
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              <Upload className={`
                w-4 h-4 
                ${evidenceCount > 0 ? 'text-white' : 'text-white/90'}
              `} />
            </div>

            {/* Evidence Badge (for pending uploads) */}
            {evidenceCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg border-2 border-white">
                {evidenceCount}
              </div>
            )}
          </button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={disabled}
            rows={1}
            placeholder={
              disabled
                ? currentSpeaker === "Verdict"
                  ? "Trial has concluded"
                  : `Waiting for ${currentSpeaker} to speak...`
                : "Type your response to the judge..."
            }
            className="flex-1 bg-[#f3f3f5] px-3 py-2 min-h-[36px] max-h-32 rounded-lg text-sm text-[#0a0a0a] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#155dfc] disabled:opacity-50 resize-none overflow-y-auto leading-normal"
          />
          <button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            className="bg-[#030213] text-white px-4 h-9 rounded-lg hover:bg-[#1a1a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm font-medium">Send</span>
          </button>
        </div>
      </div>

      {/* Floating Evidence Panel Toggle - Bottom Right */}
      {submittedEvidenceCount > 0 && onToggleSidePanel && (
        <button
          onClick={onToggleSidePanel}
          className="fixed bottom-24 right-6 bg-[#155dfc] text-white rounded-full shadow-lg hover:bg-[#0d4fd6] transition-all duration-200 flex items-center gap-3 px-5 py-3 z-40 hover:scale-105"
          title="View submitted evidence"
        >
          <FolderOpen className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium">Evidence</span>
            <span className="text-xs opacity-90">{submittedEvidenceCount} {submittedEvidenceCount === 1 ? 'file' : 'files'}</span>
          </div>
        </button>
      )}
    </div>
  );
}