import { Scale, User, Users, Briefcase, Edit2, Lightbulb } from 'lucide-react';

interface ChatMessageProps {
  speaker: 'judge' | 'plaintiff' | 'defendant' | 'clerk' | 'system';
  text: string;
  isUser?: boolean;
  feedback?: {
    positive: string;
    improvements: string[];
  };
  isLastUserMessage?: boolean;
  onEdit?: () => void;
}

const speakerConfig = {
  judge: {
    label: 'Judge',
    badgeColor: 'bg-[#f1f5f9] text-[#314158] border-[#cad5e2]',
    cardColor: 'bg-white border-[#e2e8f0]',
    textColor: 'text-[#0f172b]',
  },
  plaintiff: {
    label: 'You',
    badgeColor: 'bg-[#dbeafe] text-[#1447e6] border-[#8ec5ff]',
    cardColor: 'bg-[#155dfc] border-[#155dfc]',
    textColor: 'text-white',
  },
  defendant: {
    label: 'Defendant',
    badgeColor: 'bg-[#ffe2e2] text-[#c10007] border-[#ffa2a2]',
    cardColor: 'bg-[#fef2f2] border-[#ffc9c9]',
    textColor: 'text-[#0f172b]',
  },
  clerk: {
    label: 'Court clerk',
    badgeColor: 'bg-[#f1f5f9] text-[#314158] border-[#cad5e2]',
    cardColor: 'bg-white border-[#e2e8f0]',
    textColor: 'text-[#0f172b]',
  },
  system: {
    label: '',
    badgeColor: '',
    cardColor: '',
    textColor: 'text-[#45556c]',
  },
};

export function ChatMessage({ speaker, text, isUser, feedback, isLastUserMessage, onEdit }: ChatMessageProps) {
  const config = speakerConfig[speaker];

  if (speaker === 'system') {
    return (
      <div className="text-center py-2">
        <p className="text-[#45556c]">{text}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.badgeColor}`}>
        <span className="text-xs">{config.label}</span>
      </div>
      
      <div className="flex items-start gap-2 group">
        {isLastUserMessage && onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center w-8 h-8 text-[#45556c] hover:text-[#155dfc] hover:bg-[#f1f5f9] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 mt-2"
            title="Edit message"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        <div className={`${config.cardColor} border rounded-[14px] max-w-[672px] px-[16px] py-[12px]`}>
          <p className={`${config.textColor} leading-relaxed whitespace-pre-wrap`}>{text}</p>
        </div>
      </div>

      {feedback && (
        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#e6f7ed] border border-[#86efac] rounded-xl p-5 max-w-[672px] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00A63E] rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00A63E]"></div>
                  <p className="text-sm font-semibold text-[#0d542b]">What you did well</p>
                </div>
                <p className="text-sm text-[#047857] leading-relaxed">{feedback.positive}</p>
              </div>
              <div className="pt-4 border-t border-[#86efac]/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></div>
                  <p className="text-sm font-semibold text-[#0d542b]">Areas for improvement</p>
                </div>
                <ul className="text-sm text-[#047857] leading-relaxed space-y-2 list-disc list-inside">
                  {feedback.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}