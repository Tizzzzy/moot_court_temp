import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { DashboardCase } from '@/types/dashboard';
import { resolveCaseDisplayName } from './caseNaming';

interface CaseSelectorDropdownProps {
  cases: DashboardCase[];
  selectedCaseId: number | null;
  onSelectCase: (id: number) => void;
}

export function CaseSelectorDropdown({
  cases,
  selectedCaseId,
  onSelectCase,
}: CaseSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  const getCaseLabel = (c: DashboardCase) => {
    return resolveCaseDisplayName({
      alias: c.alias,
      plaintiff: c.plaintiffs?.[0]?.name,
      defendant: c.defendants?.[0]?.name,
      caseNumber: c.case_number,
    });
  };

  const displayText = selectedCase
    ? `Selected Case: ${getCaseLabel(selectedCase)}`
    : 'Selected Case: None';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (cases.length === 0) {
    return (
      <div className="w-[321px] p-4 bg-white border border-[#d1d5dc] rounded-lg text-[#62748e] text-sm">
        No cases found. Please submit a case first.
      </div>
    );
  }

  return (
    <div className="relative w-[321px]" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-[#d1d5dc] rounded-lg hover:bg-gray-50 transition-colors bg-white"
      >
        <span className="text-gray-900 font-medium text-sm">{displayText}</span>
        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d1d5dc] rounded-lg shadow-lg z-50">
          {cases.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm disabled cursor-not-allowed">
              No cases found
            </div>
          ) : (
            cases.map((caseItem) => (
              <button
                key={caseItem.id}
                onClick={() => {
                  onSelectCase(caseItem.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-[#f3f4f6] transition-colors border-b border-gray-100 last:border-b-0"
              >
                <p className="font-medium text-gray-900 text-sm">
                  {getCaseLabel(caseItem)}
                </p>
                <p className="text-xs text-[#62748e]">
                  {caseItem.case_number ? caseItem.case_number : `Case #${caseItem.id}`} • {caseItem.case_type}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
