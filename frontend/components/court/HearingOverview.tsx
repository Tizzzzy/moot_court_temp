import { UserProfileButton } from '@/components/UserProfileButton';
import type { CaseData } from '../App';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface HearingOverviewProps {
  onStartHearing: () => void;
  caseData?: CaseData | null;
  onBackToDashboard?: () => void;
  tokensUsed?: number;
  tokenLimit?: number;
  username?: string;
  onLogout?: () => void;
}

const hearingSteps = [
  { id: 1, title: 'Judge Introduction', description: 'The judge explains the hearing process and sets ground rules for the proceeding.' },
  { id: 2, title: 'Plaintiff Presents Case', description: 'As the plaintiff, you present your evidence, witnesses, and arguments supporting your claim.' },
  { id: 3, title: 'Defendant Presents Case', description: 'The defendant presents their counter-arguments, evidence, and witnesses.' },
  { id: 4, title: "Judge's Questions", description: 'The judge may ask clarifying questions to both parties about the evidence and testimony.' },
  { id: 5, title: 'Judgment', description: 'The judge delivers their decision and explains the reasoning behind it.' },
];

export function HearingOverview({ onStartHearing, caseData, onBackToDashboard, tokensUsed = 0, tokenLimit = 3000, username = '', onLogout }: HearingOverviewProps) {
  const tokensRemaining = tokenLimit - tokensUsed;
  const percentageUsed = Math.round((tokensUsed / tokenLimit) * 100);
  const barColor = tokensUsed >= tokenLimit * 0.9 ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.1)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]">
        <div className="max-w-[1344px] mx-auto px-12 h-20 flex items-center justify-between">
          {/* Left: back button + title */}
          <div>
            <button
              onClick={onBackToDashboard}
              className="flex gap-3 items-center px-3 py-1.5 rounded-lg mb-1 hover:bg-[#f8fafc] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#0a0a0a]" />
              <span className="font-medium text-sm text-[#0a0a0a] tracking-[-0.15px]">Back to case dashboard</span>
            </button>
            <h1 className="font-semibold text-[20px] text-[#0f172b] leading-tight tracking-[-0.02em] pl-3">Practice Session</h1>
          </div>

          {/* Center: Token Progress Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Tokens available</span>
              <span className="text-sm font-semibold text-gray-900">
                {tokensRemaining.toLocaleString()}/{tokenLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${barColor}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Right: username + profile */}
          <div className="flex items-center gap-2">
            {username && <span className="text-sm font-medium text-gray-900">{username}</span>}
            <UserProfileButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center py-8 px-6">
        <div className="w-full max-w-[800px] space-y-6">
          {/* Case Overview */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
            <h2 className="text-[20px] font-semibold text-[#1e293b] mb-4 tracking-[-0.01em]">Case Overview</h2>
            {!caseData ? (
              <div className="text-center py-4 text-[#64748b]">
                <p className="text-sm">Loading case information...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {caseData.case_number && (
                  <div className="flex">
                    <span className="font-semibold text-[15px] text-[#475569] min-w-[140px]">Case Number:</span>
                    <span className="text-[15px] text-[#64748b]">{caseData.case_number}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-semibold text-[15px] text-[#475569] min-w-[140px]">Case Type:</span>
                  <span className="text-[15px] text-[#64748b] capitalize">{caseData.case_type?.replace(/-/g, ' ') || 'Small Claims'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-[15px] text-[#475569] min-w-[140px]">Plaintiff:</span>
                  <span className="text-[15px] text-[#64748b]">{caseData.plaintiffs?.[0]?.name || 'Not specified'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-[15px] text-[#475569] min-w-[140px]">Defendant:</span>
                  <span className="text-[15px] text-[#64748b]">{caseData.defendants?.[0]?.name || 'Not specified'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-[15px] text-[#475569] min-w-[140px]">Amount Sought:</span>
                  <span className="text-[15px] text-[#64748b]">${caseData.amount_sought?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-[15px] text-[#475569] min-w-[140px]">Claim:</span>
                  <span className="text-[15px] text-[#64748b]">{caseData.claim_summary || 'No summary available'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Hearing Process Overview */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
            <h2 className="text-[20px] font-semibold text-[#1e293b] mb-4 tracking-[-0.01em]">Hearing Process Overview</h2>
            
            <div className="space-y-3">
              {hearingSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#334155] text-white text-[13px] flex-shrink-0 font-semibold">
                      {step.id}
                    </div>
                    {index < hearingSteps.length - 1 && (
                      <div className="w-[2px] h-5 bg-[#e2e8f0] my-0.5" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-[2px]">
                    <h3 className="text-[15px] text-[#1e293b] mb-1 font-semibold">{step.title}</h3>
                    <p className="text-[13px] text-[#64748b] leading-[20px]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- NEW: Before You Begin Notice --- */}
          <div className="bg-[#eff6ff] rounded-2xl p-6 border border-[#bfdbfe]">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[18px] font-semibold text-[#1e3a8a] mb-2 tracking-[-0.01em]">
                  Before You Begin
                </h2>
                <div className="text-[14px] text-[#1e3a8a]/80 space-y-1">
                  <p>This simulation requires both a live conversation with the Judge and evidence submission.</p>
                  <p>Please make sure you are ready before starting the court simulation.</p>
                </div>
              </div>
            </div>
          </div>
          {/* ------------------------------------- */}

          {/* Start Button */}
          <div className="text-center pt-2">
            <button
              onClick={onStartHearing}
              className="bg-[#155dfc] text-white px-10 py-[14px] rounded-[12px] text-[16px] font-semibold hover:bg-[#1047d0] transition-colors shadow-sm hover:shadow-md"
            >
              Begin Hearing Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}