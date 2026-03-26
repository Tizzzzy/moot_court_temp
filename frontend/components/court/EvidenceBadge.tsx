import { FileText } from 'lucide-react';

interface EvidenceBadgeProps {
  count: number;
  onClick: () => void;
}

export function EvidenceBadge({ count, onClick }: EvidenceBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 right-6 bg-[#155dfc] rounded-full p-3 shadow-lg hover:bg-[#1047d0] transition-colors flex items-center justify-center z-30"
    >
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 34 34">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.76" d="M19.658 6.9h-8.28a5.52 5.52 0 00-5.518 5.518v13.797a5.52 5.52 0 005.518 5.518h11.037a5.52 5.52 0 005.519-5.518V15.18" />
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.76" d="M19.658 6.9L27.936 15.18v-8.28" />
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.76" d="M13.799 12.419h-2.76M22.078 17.938h-11.04M22.078 23.456h-11.04" />
      </svg>
      {count > 0 && (
        <div className="absolute -top-1 -right-1 bg-[#b3261e] text-white text-xs font-medium rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5">
          {count}
        </div>
      )}
    </button>
  );
}