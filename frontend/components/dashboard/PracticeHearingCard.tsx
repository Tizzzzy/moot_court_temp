import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PracticeHearingCardProps {
  onStartPractice: () => void;
  selectedCaseId: number | null;
}

export function PracticeHearingCard({
  onStartPractice,
  selectedCaseId,
}: PracticeHearingCardProps) {
  const isDisabled = selectedCaseId === null;

  return (
    <div className="bg-[#155dfc] rounded-[14px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] p-6 flex items-center justify-between">
      <div className="flex-1">
        {/* <div className="inline-block px-3 py-1 bg-[#2b7fff] text-white text-xs font-semibold rounded-full mb-3">
          Recommended
        </div> */}
        <h3 className="text-xl font-semibold text-white mb-1">Practice Hearing</h3>
        <p className="text-[#dbeafe] text-sm">
          Simulate a small claims court hearing with AI judge and defendant
        </p>
      </div>

      <button
        onClick={onStartPractice}
        disabled={isDisabled}
        title={isDisabled ? 'Select a case first' : 'Start practice hearing'}
        className={`ml-6 px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 flex-shrink-0 ${
          isDisabled
            ? 'bg-white text-[#155dfc] opacity-50 cursor-not-allowed'
            : 'bg-white text-[#155dfc] hover:bg-gray-100'
        }`}
      >
        Start
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
