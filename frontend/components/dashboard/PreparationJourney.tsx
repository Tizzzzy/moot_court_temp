import React from 'react';
import { Check, Clock } from 'lucide-react';

interface PreparationJourneyProps {
  hasCases: boolean;
  allEvidenceReady: boolean;
  hasAttemptedEvidence: boolean;
  hasWinningSession: boolean;
  hasAttemptedSession: boolean;
}
  
const steps: {
  step: 'intake' | 'evidence' | 'practice' | 'final';
  title: string;
  duration: string;
}[] = [
  {
    step: 'intake',
    title: 'Enter court form',
    duration: '10-15 mins',
  },
  {
    step: 'evidence',
    title: 'Upload evidence',
    duration: '15-30 mins',
  },
  {
    step: 'practice',
    title: 'Practice your hearing',
    duration: '20-30 mins',
  },
  {
    step: 'final',
    title: 'Final Preparation',
    duration: '10-15 mins',
  },
];

export function PreparationJourney({ hasCases, allEvidenceReady, hasWinningSession, hasAttemptedEvidence, hasAttemptedSession }: PreparationJourneyProps) {
  const getStepStatus = (stepId: 'intake' | 'evidence' | 'practice' | 'final') => {
    switch (stepId) {
      case 'intake':
        return hasCases ? 'completed' : 'current';
      case 'evidence':
        if (!hasCases) return 'upcoming'; // Locked
        if (allEvidenceReady) return 'completed';
        if (hasAttemptedEvidence) return 'current';
        return 'not-started'; // Unlocked, but 0 files

      case 'practice':
        if (!hasCases) return 'upcoming'; // Locked
        if (hasWinningSession) return 'completed';
        if (hasAttemptedSession) return 'current';
        return 'not-started'; // Unlocked, but 0 sessions

      case 'final':
        // Final prep unlocks ONLY when both Evidence AND Practice are finished
        if (allEvidenceReady && hasWinningSession) return 'not-started';
        return 'upcoming';

      default:
        return 'upcoming';
    }
  };

  return (
    <div className="border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Preparation Journey</h3>

      <div className="space-y-4 relative">
        {steps.map((item, index) => {
          const status = getStepStatus(item.step);
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
          const isNotStarted = status === 'not-started';
          const isActive = isCompleted || isCurrent || isNotStarted;

          return (
            <div key={item.step} className="flex gap-4 relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 top-8 w-px h-12 bg-[#e2e8f0]" />
              )}

              {/* Step Indicator */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold transition-all ${
                    isCompleted
                      ? 'bg-[#dcfce7] text-green-600'
                      : (isCurrent || isNotStarted)
                        ? 'bg-[#dbeafe] text-[#1447e6]'
                        : 'border-2 border-[#e2e8f0] text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (isCurrent || isNotStarted) ? (
                    <div className="w-2 h-2 rounded-full bg-[#1447e6]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
              </div>

              {/* Step Content */}
              <div className="pb-4 flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-medium ${isActive ? 'text-[#0f172b]' : 'text-gray-400'}`}>
                    {item.title}
                  </p>
                  {isCurrent && (
                    <span className="inline-block px-2 py-0.5 bg-[#dbeafe] text-[#1447e6] text-xs font-semibold rounded-lg">
                      In Progress
                    </span>
                  )}
                  {isNotStarted && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                      Not Started
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 text-sm ${isActive ? 'text-[#62748e]' : 'text-gray-400'}`}>
                  <Clock className="w-4 h-4" />
                  {item.duration}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}