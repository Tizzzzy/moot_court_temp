import React from 'react';
import { Calendar } from 'lucide-react';
import { DashboardCase } from '@/types/dashboard';
import { resolveCaseDisplayName } from './caseNaming';

interface CaseDetailsCardProps {
  caseData: DashboardCase | null;
  isLoading: boolean;
  onViewMore?: () => void;
}

export function CaseDetailsCard({ caseData, isLoading, onViewMore }: CaseDetailsCardProps) {
  if (isLoading) {
    return (
      <div className="border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6 bg-white animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-6" />
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6 bg-gray-50">
        <p className="text-gray-600 text-sm">Select a case to view details</p>
      </div>
    );
  }

  const daysAway = caseData.hearing_date ? calculateDaysAway(caseData.hearing_date) : null;
  const caseAliasDisplay = resolveCaseDisplayName({
    alias: caseData.alias,
    plaintiff: caseData.plaintiffs?.[0]?.name,
    defendant: caseData.defendants?.[0]?.name,
    caseNumber: caseData.case_number,
  });

  return (
    <div className="border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Case</h3>
        <button
          onClick={onViewMore}
          className="text-sm text-[#0088FF] hover:underline"
        >
          View more
        </button>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {/* Case Alias */}
        <div>
          <p className="text-[16px] text-[#62748e] mb-1">Case Alias</p>
          <p className="text-[16px] text-[#0f172b] font-medium">
            {caseAliasDisplay}
          </p>
        </div>

        {/* Case Number */}
        <div>
          <p className="text-[16px] text-[#62748e] mb-1">Case Number</p>
          <p className="text-[16px] text-[#0f172b] font-medium">
            {caseData.case_number || 'N/A'}
          </p>
        </div>

        {/* Amount Claimed */}
        <div>
          <p className="text-[16px] text-[#62748e] mb-1">Amount Claimed</p>
          <p className="text-[16px] text-[#0f172b] font-medium">
            {caseData.amount_sought !== null ? `$${caseData.amount_sought.toLocaleString()}` : 'N/A'}
          </p>
        </div>

        {/* Case Type */}
        <div>
          <p className="text-[16px] text-[#62748e] mb-1">Case Type</p>
          <p className="text-[16px] text-[#0f172b] font-medium capitalize">
            {caseData.case_type?.replace(/-/g, ' ') || 'N/A'}
          </p>
        </div>
      </div>

      {/* Defendant Row */}
      {caseData.defendants.length > 0 && (
        <div className="py-4 border-t border-gray-100">
          <p className="text-[16px] text-[#62748e] mb-2">Defendant</p>
          <p className="text-[16px] text-[#0f172b] font-medium">
            {caseData.defendants[0].name}
          </p>
        </div>
      )}

      {/* Hearing Date Panel */}
      {caseData.hearing_date && (
        <div className="mt-6 bg-[#f4f9ff] rounded-[10px] p-4 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-[#0088FF] flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#0f172b]">Hearing Date</p>
            <p className="text-sm text-[#62748e]">
              {caseData.hearing_date}
              {daysAway !== null && ` • ${daysAway} days away`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateDaysAway(dateString: string): number {
  try {
    // Replace dashes with slashes (e.g., '2026/03/15') to force JavaScript 
    // to interpret it as a local timezone date rather than UTC, 
    // preventing off-by-one-day errors.
    const normalizedDateString = dateString.includes('-') 
      ? dateString.replace(/-/g, '/') 
      : dateString;

    const hearingDate = new Date(normalizedDateString);
    
    // Check if the resulting date is valid
    if (isNaN(hearingDate.getTime())) return -1;

    const today = new Date();

    // Normalize both to midnight local time
    today.setHours(0, 0, 0, 0);
    hearingDate.setHours(0, 0, 0, 0);

    const diffTime = hearingDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
}
