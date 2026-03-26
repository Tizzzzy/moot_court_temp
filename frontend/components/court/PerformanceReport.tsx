import { TrendingUp, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface PerformanceReportProps {
  overallScore: number;
  strengths: number;
  toImprove: number;
  difficulty: string;
}

export function PerformanceReport({ overallScore, strengths, toImprove, difficulty }: PerformanceReportProps) {
  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent work!";
    if (score >= 70) return "You're on the right track!";
    if (score >= 60) return "Good effort, room to improve";
    return "Keep practicing!";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Nearly";
    if (score >= 60) return "Getting There";
    return "Needs Work";
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#e2e8f0] pb-4">
        <h2 className="text-xl font-semibold text-[#0f172b] mb-1">Practice Session Results</h2>
        <p className="text-sm text-[#64748b]">100% Complete</p>
      </div>

      {/* Overall Readiness Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#155dfc]" />
            <span className="font-medium text-[#0f172b]">Overall Readiness Score</span>
          </div>
          <span className="text-sm text-[#155dfc] font-medium">{getScoreStatus(overallScore)}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#64748b]">{overallScore}%</span>
            <span className="text-[#64748b]">{getScoreMessage(overallScore)}</span>
          </div>
          <div className="w-full bg-[#e2e8f0] rounded-full h-2">
            <div 
              className="bg-[#0f172b] h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Strengths */}
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#16a34a]" />
            <span className="text-sm font-medium text-[#15803d]">Strengths</span>
          </div>
          <p className="text-2xl font-semibold text-[#15803d]">{strengths}</p>
        </div>

        {/* To Improve */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-sm font-medium text-[#d97706]">To Improve</span>
          </div>
          <p className="text-2xl font-semibold text-[#d97706]">{toImprove}</p>
        </div>

        {/* Difficulty */}
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-sm font-medium text-[#2563eb]">Difficulty</span>
          </div>
          <p className="text-2xl font-semibold text-[#2563eb]">{difficulty}</p>
        </div>
      </div>

      {/* What You Did Well */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#16a34a]" />
          <h3 className="font-medium text-[#0f172b]">What You Did Well</h3>
        </div>
        <p className="text-sm text-[#64748b] mb-3">Keep doing these things in your real hearing</p>
        
        <div className="space-y-3">
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#15803d]">Clear Communication</h4>
              <span className="text-xs bg-[#dcfce7] text-[#15803d] px-2 py-1 rounded">High Impact</span>
            </div>
            <p className="text-sm text-[#15803d]">You explained your case in plain language and stayed focused on the key facts.</p>
          </div>

          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#15803d]">Strong Evidence Presentation</h4>
              <span className="text-xs bg-[#dcfce7] text-[#15803d] px-2 py-1 rounded">High Impact</span>
            </div>
            <p className="text-sm text-[#15803d]">You referenced specific documents and photos at the right moments.</p>
          </div>

          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#15803d]">Respectful Tone</h4>
              <span className="text-xs bg-[#dcfce7] text-[#15803d] px-2 py-1 rounded">Medium Impact</span>
            </div>
            <p className="text-sm text-[#15803d]">Your responses were professional and appropriate for court.</p>
          </div>
        </div>
      </div>

      {/* Areas to Work On */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
          <h3 className="font-medium text-[#0f172b]">Areas to Work On</h3>
        </div>
        <p className="text-sm text-[#64748b] mb-3">Focus on these before your hearing</p>
        
        <div className="space-y-3">
          <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#d97706]">Be More Specific with Dates</h4>
              <span className="text-xs bg-[#fef9c3] text-[#d97706] px-2 py-1 rounded">High Priority</span>
            </div>
            <p className="text-sm text-[#92400e] mb-2">The judge asked about dates several times. Practice remembering key details in your case.</p>
            <div className="bg-[#fffbeb] rounded p-3 mt-2">
              <p className="text-xs text-[#78350f]"><span className="font-medium">Suggestion:</span></p>
              <p className="text-xs text-[#78350f] mt-1">Write down important dates before court: move-in, move-out, when you sent letters, etc.</p>
            </div>
          </div>

          <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#d97706]">Anticipate Follow-up Questions</h4>
              <span className="text-xs bg-[#fef9c3] text-[#d97706] px-2 py-1 rounded">Medium Priority</span>
            </div>
            <p className="text-sm text-[#92400e] mb-2">When you mentioned 'normal wear and tear,' the judge needed clarification.</p>
            <div className="bg-[#fffbeb] rounded p-3 mt-2">
              <p className="text-xs text-[#78350f]"><span className="font-medium">Suggestion:</span></p>
              <p className="text-xs text-[#78350f] mt-1">Prepare specific examples of what you mean by general terms.</p>
            </div>
          </div>

          <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-[#d97706]">Reference Your Lease More</h4>
              <span className="text-xs bg-[#fef9c3] text-[#d97706] px-2 py-1 rounded">Medium Priority</span>
            </div>
            <p className="text-sm text-[#92400e] mb-2">Your lease agreement is strong evidence. Mention specific sections that support your case.</p>
            <div className="bg-[#fffbeb] rounded p-3 mt-2">
              <p className="text-xs text-[#78350f]"><span className="font-medium">Suggestion:</span></p>
              <p className="text-xs text-[#78350f] mt-1">Bring a highlighted copy of your lease to court.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Next Steps */}
      <div className="space-y-3">
        <h3 className="font-medium text-[#0f172b]">Your Next Steps</h3>
        <p className="text-sm text-[#64748b] mb-3">Recommended actions before your court date</p>
        
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#155dfc] text-white text-xs font-medium flex-shrink-0">
              1
            </div>
            <p className="text-sm text-[#475569]">Review the dates in your case and commit them to memory</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#155dfc] text-white text-xs font-medium flex-shrink-0">
              2
            </div>
            <p className="text-sm text-[#475569]">Practice one more time at a harder difficulty level</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#155dfc] text-white text-xs font-medium flex-shrink-0">
              3
            </div>
            <p className="text-sm text-[#475569]">Prepare a simple timeline or outline to bring to court</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#155dfc] text-white text-xs font-medium flex-shrink-0">
              4
            </div>
            <p className="text-sm text-[#475569]">Review your documents and highlight key sections</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-[#e2e8f0]">
        <button className="flex-1 bg-white border border-[#e2e8f0] text-[#0f172b] py-3 rounded-lg hover:bg-[#f9fafb] transition-colors font-medium">
          Back to Dashboard
        </button>
        <button className="flex-1 bg-[#155dfc] text-white py-3 rounded-lg hover:bg-[#1047d0] transition-colors font-medium flex items-center justify-center gap-2">
          <span>Practice Again</span>
        </button>
      </div>
    </div>
  );
}
