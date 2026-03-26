import { ArrowLeft, FileText } from 'lucide-react';
import { HearingStep, Message, EvidenceFile, CaseData } from '../App';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TipsBox } from './TipsBox';
import { EvidenceMessage } from './EvidenceMessage';
import { PerformanceReport } from './PerformanceReport';
import { UserProfileButton } from '@/components/UserProfileButton';
import { useEffect, useRef } from 'react';

interface ActiveHearingProps {
  currentStep: HearingStep;
  messages: Message[];
  evidenceCount: number;
  onNextStep: () => void;
  onSendMessage: (message: string) => void;
  onViewEvidence: () => void;
  onBackToDashboard: () => void;
  onPresentEvidence?: () => void;
  onUploadEvidence?: () => void;
  hasSubmittedEvidence?: boolean;
  onToggleSidePanel?: () => void;
  submittedEvidenceCount?: number;
  onEditMessage?: (index: number) => void;
  editingMessage?: string;
  caseData?: CaseData | null;
  currentSpeaker?: string;
  verdictIssued?: boolean;
  verdictOutcome?: string | null;
  tokensUsed?: number;
  tokenLimit?: number;
  username?: string;
  onLogout?: () => void;
}

const stepTitles: Record<HearingStep, string> = {
  1: 'Check-in & Case Call',
  2: 'Judge Introduction',
  3: 'Plaintiff Presents Case',
  4: 'Defendant Presents Case',
  5: "Judge's Questions",
  6: 'Closing Statements',
  7: 'Judgment',
};

const stepTips: Record<HearingStep, string[]> = {
  1: [],
  2: [],
  3: [
    'Speak clearly and confidently',
    'State your name first',
    "Briefly explain what you're claiming and why"
  ],
  4: [],
  5: [
    'Answer directly and honestly',
    'If you don\'t know, say so',
    'Keep your answers concise'
  ],
  6: [
    'Summarize your key points',
    'Restate what you\'re asking for',
    'Thank the judge for their time'
  ],
  7: [],
};

export function ActiveHearing({
  currentStep,
  messages,
  evidenceCount,
  onNextStep,
  onSendMessage,
  onViewEvidence,
  onBackToDashboard,
  onPresentEvidence,
  onUploadEvidence,
  hasSubmittedEvidence,
  onToggleSidePanel,
  submittedEvidenceCount,
  onEditMessage,
  editingMessage,
  caseData,
  currentSpeaker = "Plaintiff",
  verdictIssued,
  verdictOutcome,
  tokensUsed = 0,
  tokenLimit = 3000,
  username = '',
  onLogout,
}: ActiveHearingProps) {
  const progress = (currentStep / 7) * 100;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tokensRemaining = tokenLimit - tokensUsed;
  const percentageUsed = Math.round((tokensUsed / tokenLimit) * 100);
  const barColor = tokensUsed >= tokenLimit * 0.9 ? 'bg-red-500' : 'bg-green-500';
  
  // Find the last user message index
  const lastUserMessageIndex = messages.map((m, i) => ({ ...m, index: i }))
    .filter(m => m.isUser && !m.evidenceFiles)
    .pop()?.index;

  // Check if we're waiting for plaintiff's response and get dynamic tips
  const lastMessage = messages[messages.length - 1];
  let isWaitingForPlaintiff = false;
  let dynamicTips: string[] = [];

  if (lastMessage) {
    if (currentStep === 3 && lastMessage.speaker === 'system' && lastMessage.text.includes('Plaintiff Present your case')) {
      // Initial plaintiff presentation
      isWaitingForPlaintiff = true;
      dynamicTips = [
        'Speak clearly and confidently',
        'State your name first',
        "Briefly explain what you're claiming and why",
        'Reference your evidence if you have any'
      ];
    } else if (currentStep === 3 && lastMessage.speaker === 'judge' && lastMessage.text.includes('rephrase')) {
      // Responding to objection
      isWaitingForPlaintiff = true;
      dynamicTips = [
        'Focus on facts you can personally verify',
        'Avoid speculation or assumptions',
        'Reference specific evidence or documents',
        'Be direct and concise'
      ];
    } else if (currentStep === 5 && lastMessage.speaker === 'judge' && lastMessage.text.includes('move-in inspection')) {
      // Answering judge's specific question
      isWaitingForPlaintiff = true;
      dynamicTips = [
        'Answer both parts of the question directly',
        'Mention if you have documentation',
        'Be honest if you don\'t remember something',
        'Keep your answer focused on the question asked'
      ];
    } else if (currentStep === 6 && lastMessage.speaker === 'judge' && lastMessage.text.includes('closing statement')) {
      // Closing statement
      isWaitingForPlaintiff = true;
      dynamicTips = [
        'Summarize your key points briefly',
        'Restate the amount you\'re claiming',
        'Mention your strongest evidence',
        'Thank the judge for their time'
      ];
    }
  }
  
  // Show tips only when waiting for plaintiff's response
  const showTips = isWaitingForPlaintiff && dynamicTips.length > 0;
  const showPresentEvidenceButton = currentStep === 3;
  const showUploadButton = currentStep === 5; // Show upload evidence button during judge's questions

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-[#0a0a0a] hover:text-[#155dfc] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to case dashboard</span>
          </button>

          {/* Token Progress Card */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 w-56 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Tokens available</span>
              <span className="text-xs font-semibold text-gray-900">
                {tokensRemaining.toLocaleString()}/{tokenLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${barColor}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {username && <span className="text-sm font-medium text-gray-900">{username}</span>}
            <UserProfileButton />
          </div>
        </div>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        {/* Case Info */}
        <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-6 mb-6">
          <p className="text-[#0f172b] leading-relaxed whitespace-pre-wrap">
            Case: {caseData
              ? `${caseData.plaintiffs?.[0]?.name || 'Plaintiff'} vs. ${caseData.defendants?.[0]?.name || 'Defendant'}`
              : 'Case information loading...'}
            {'\n'}
            Claim: {caseData
              ? caseData.claim_summary
              : 'Plaintiff seeks compensation for damages.'}
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-6 mb-6">
          {messages.map((message, index) => (
            message.isPerformanceReport && message.performanceData ? (
              <PerformanceReport
                key={index}
                overallScore={message.performanceData.overallScore}
                strengths={message.performanceData.strengths}
                toImprove={message.performanceData.toImprove}
                difficulty={message.performanceData.difficulty}
              />
            ) : message.evidenceFiles ? (
              <EvidenceMessage
                key={index}
                files={message.evidenceFiles}
              />
            ) : (
              <ChatMessage
                key={index}
                speaker={message.speaker}
                text={message.text}
                isUser={message.isUser}
                feedback={message.feedback}
                isLastUserMessage={index === lastUserMessageIndex}
                onEdit={onEditMessage ? () => onEditMessage(index) : undefined}
              />
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        {verdictIssued && (
          <div className="mt-8 bg-[#f0f7ff] border border-[#155dfc] rounded-[14px] p-6 text-center">
            <h3 className="text-lg font-semibold text-[#0f172b] mb-2">Trial Concluded</h3>
            {verdictOutcome === 'win' && (
              <p className="text-[#00a63e] font-semibold text-base mb-1">You Won!</p>
            )}
            {(verdictOutcome === 'lose' || verdictOutcome === 'loss') && (
              <p className="text-[#f54900] font-semibold text-base mb-1">You Lost</p>
            )}
            <p className="text-[#64748b] text-sm mb-4">The judge has issued a verdict. Your session has been saved.</p>
            <button
              onClick={onBackToDashboard}
              className="bg-[#155dfc] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1248c7] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Tips Box */}
        {showTips && (
          <div className="mt-8">
            <TipsBox tips={dynamicTips} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={onSendMessage}
        disabled={verdictIssued || currentSpeaker !== "Plaintiff"}
        currentSpeaker={currentSpeaker}
        evidenceCount={evidenceCount}
        onViewEvidence={onViewEvidence}
        hasSubmittedEvidence={hasSubmittedEvidence}
        onToggleSidePanel={onToggleSidePanel}
        submittedEvidenceCount={submittedEvidenceCount}
        initialMessage={editingMessage}
      />
    </div>
  );
}