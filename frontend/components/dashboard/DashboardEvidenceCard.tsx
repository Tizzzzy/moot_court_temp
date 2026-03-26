import React from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import { EvidenceRecommendation } from '@/services/api';

interface EvidenceData {
  hasFiles: boolean;
  analyzed: boolean;
  status: 'ready' | 'needs-improvement' | 'none';
}

interface EvidenceState {
  [key: number]: EvidenceData;
}

interface DashboardEvidenceCardProps {
  evidence: EvidenceRecommendation[];
  evidenceStates: EvidenceState;
  totalFilesUploaded: number;
  onUpload: (index: number) => void;
}

export function DashboardEvidenceCard({
  evidence,
  evidenceStates,
  totalFilesUploaded,
  onUpload,
}: DashboardEvidenceCardProps) {
  const getStatus = (index: number): 'ready' | 'pending' | 'none' => {
    const state = evidenceStates[index];
    if (!state) return 'none';
    if (state.status === 'ready') return 'ready';
    if (state.hasFiles) return 'pending';
    return 'none';
  };

  const readyCount = Object.values(evidenceStates).filter((s) => s.status === 'ready').length;

  // Sparkle SVG icon
  const SparkleIcon = () => (
    <svg className="w-5 h-5" fill="#0088FF" viewBox="0 0 24 24">
      <path d="M12 2C12 2 7 10 2 12C7 14 12 22 12 22C12 22 17 14 22 12C17 10 12 2 12 2Z" />
      <path d="M12 6C12 6 9 11 6 12C9 13 12 18 12 18C12 18 15 13 18 12C15 11 12 6 12 6Z" />
    </svg>
  );

  return (
    <div className="border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6 bg-white">
      {/* Header with Sparkle Icon */}
      <div className="flex items-center gap-3 mb-2">
        <SparkleIcon />
        <h3 className="text-lg font-semibold text-gray-900">AI recommended evidence</h3>
      </div>
      <p className="text-[#62748e] text-sm mb-6">Upload your documents and get AI-powered feedback</p>

      {/* Progress Summary */}
      <div className="mb-6">
        <p className="text-sm text-[#62748e] mb-3">
          {readyCount} of {evidence.length} categories • {totalFilesUploaded} file(s) uploaded
        </p>
        <div className="w-full h-2 bg-[rgba(3,2,19,0.2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#030213] transition-all"
            style={{ width: `${evidence.length > 0 ? (readyCount / evidence.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Evidence Items */}
      <div className="space-y-4">
        {evidence.map((item, index) => {
          const status = getStatus(index);
          const isReady = status === 'ready';

          return (
            <div
              key={index}
              className={`rounded-2xl border-2 p-4 transition-colors ${
                isReady
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-[#e2e8f0]'
              }`}
            >
              {/* Top Row: Title + Button */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                  {status === 'ready' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </span>
                  )}
                  {status === 'pending' && evidenceStates[index]?.analyzed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Needs Review
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onUpload(index)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
                    isReady
                      ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                      : 'border border-[rgba(0,0,0,0.1)] text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isReady ? (
                    <>
                      <Upload className="w-4 h-4" />
                      Replace
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>

              {/* Full Description */}
              <p className="text-[#62748e] text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
