import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DashboardSession } from '@/types/dashboard';

interface SimulationHistoryProps {
  sessions: DashboardSession[];
  onSessionClick: (sessionId: string) => void;
  onStartNew: () => void;
}

export function SimulationHistory({
  sessions,
  onSessionClick,
  onStartNew,
}: SimulationHistoryProps) {
  const getVerdictColor = (outcome: string | null) => {
    if (outcome === 'win') return 'text-[#00a63e]';
    if (outcome === 'lose' || outcome === 'loss') return 'text-[#f54900]';
    return 'text-[#94a3b8]';
  };

  const getVerdictText = (outcome: string | null) => {
    if (outcome === 'win') return 'Won';
    if (outcome === 'lose' || outcome === 'loss') return 'Lost';
    return 'Incomplete';
  };

  if (sessions.length === 0) {
    return (
      <div className="border border-[#e5e7eb] rounded-2xl bg-white shadow-sm">
        <div className="border-b border-[#e5e7eb] p-4">
          <h3 className="text-lg font-semibold text-gray-900">Simulation History</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm mb-4">
            No simulation history yet. Start your first practice session.
          </p>
          <button
            onClick={onStartNew}
            className="px-6 py-2 bg-[#155dfc] text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#e5e7eb] rounded-2xl bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Simulation History</h3>
        <button
          onClick={onStartNew}
          className="text-sm text-[#155dfc] hover:underline font-medium"
        >
          Start New
        </button>
      </div>

      {/* Sessions List */}
      <div className="divide-y divide-[#e5e7eb]">
        {sessions.map((session) => (
          <button
            key={session.session_id}
            onClick={() => onSessionClick(session.session_id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.title || `Practice Session ${session.case_id}`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  Case #{session.case_id}
                </span>
                <span className={`text-xs font-medium ${getVerdictColor(session.verdict_outcome)}`}>
                  {getVerdictText(session.verdict_outcome)}
                </span>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
}
